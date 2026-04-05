console.log("VERSION 2.1 KALENDER POPUP PRO")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let products = []
let prices = []
let cart = []
let selectedType = "all"
let weekOffset = 0

/* ========= INIT ========= */
window.onload = init

async function init(){
  try{
    bindUI()
    await loadAll()
    renderAll()
  }catch(e){
    showError(e)
  }
}

/* ========= UI ========= */
function bindUI(){
  el("saveBtn")?.addEventListener("click", saveBooking)
  el("start")?.addEventListener("change", calculateTotal)
  el("end")?.addEventListener("change", calculateTotal)
}

/* ========= LOAD ========= */
async function loadAll(){

  const { data: skisData } = await supabaseClient.from("skis").select("*")
  const { data: rentData } = await supabaseClient.from("rentals").select("*")
  const { data: prodData } = await supabaseClient.from("products").select("*")
  const { data: priceData } = await supabaseClient.from("prices").select("*")

  skis = skisData || []
  rentals = rentData || []
  products = prodData || []
  prices = priceData || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }

function parse(x){
  try{return JSON.parse(x || "[]")}catch{return[]}
}

/* ========= TYPES ========= */
function getTypes(){
  return [...new Set(skis.map(s=>s.type))].filter(Boolean)
}

/* ========= FILTER ========= */
function setType(t){
  selectedType = t
  renderWall()
}

/* ========= RENDER ========= */
function renderAll(){
  renderFilters()
  renderWall()
  renderCart()
  renderRentals()
  calculateTotal()
}

/* ========= FILTERS ========= */
function renderFilters(){

  const div = el("filters")
  if(!div) return

  div.innerHTML = `<button onclick="setType('all')">Alla</button>`

  getTypes().forEach(t=>{
    div.innerHTML += `<button onclick="setType('${t}')">${t}</button>`
  })
}

/* ========= WALL ========= */
function renderWall(){

  const div = el("skiWall")
  if(!div) return

  div.innerHTML = ""

  let list = skis
  if(selectedType !== "all"){
    list = skis.filter(s=>s.type === selectedType)
  }

  if(list.length === 0){
    div.innerHTML = "⚠️ Ingen utrustning hittad"
    return
  }

  const lengths = [...new Set(list.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(length=>{

    const ids = list.filter(s=>s.length==length).map(s=>s.id)
    const available = getAvailable(ids)
    const selected = getSelected(ids)

    let bg="#e8f5e9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    div.innerHTML += `
      <div class="card" style="background:${bg}">
        <b>${length}</b><br>
        ${available} kvar<br>
        <button onclick="minus(${length})">−</button>
        ${selected}
        <button onclick="plus(${length})">+</button>
      </div>
    `
  })
}

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){

  const ids = skis.filter(s=>s.length==length).map(s=>s.id)

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(length){
  const ids = skis.filter(s=>s.length==length).map(s=>s.id)
  const i = cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){

  const div = el("cart")
  if(!div) return

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  const grouped={}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return
    const key = s.type+" "+s.length
    grouped[key]=(grouped[key]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(k=>{
    html += `${k} x ${grouped[k]}<br>`
  })

  div.innerHTML = html
}

/* ========= LAGER ========= */
function getAvailable(ids){

  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    parse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length-booked
}

/* ========= DAGAR ========= */
function getDays(){

  const start = el("start")?.value
  const end = el("end")?.value

  if(!start || !end) return 1

  const s = new Date(start)
  const e = new Date(end)

  return Math.max(1, Math.ceil((e - s)/(1000*60*60*24)) + 1)
}

/* ========= PRIS ========= */
function getPriceForProduct(productId){

  const p = prices.find(x=>x.product_id == productId)
  if(!p) return 0

  const d = getDays()

  if(d<=1) return p.day_1
  if(d==2) return p.day_2
  if(d==3) return p.day_3
  if(d==4) return p.day_4
  if(d==5) return p.day_5

  return p.day_7
}

/* ========= TOTAL ========= */
function calculateTotal(){

  let total = 0

  cart.forEach(id=>{
    const ski = skis.find(s=>s.id===id)
    if(!ski) return

    const product = products.find(p => p.type === ski.type)
    if(!product) return

    total += getPriceForProduct(product.id)
  })

  el("total") && (el("total").innerHTML = `💰 ${total} kr (${getDays()} dagar)`)
}

/* ========= SAVE ========= */
async function saveBooking(){

  if(!el("customer").value || !el("start").value || !el("end").value || cart.length===0){
    alert("Fyll i allt")
    return
  }

  await supabaseClient.from("rentals").insert({
    name: el("customer").value,
    phone: el("phone").value,
    start: el("start").value,
    end: el("end").value,
    items: JSON.stringify(cart),
    returned:false
  })

  alert("✅ Sparad")

  cart=[]
  await loadAll()
  renderAll()
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div = el("rentals")
  if(!div) return

  div.innerHTML=""

  rentals.filter(r=>!r.returned).forEach(r=>{
    div.innerHTML += `
      <div class="booking">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}
      </div>
    `
  })
}

/* ========= KALENDER ========= */
function renderWeek(){

  const div = el("calendar")
  if(!div) return

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let html="<table><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    const day=format(d)
    dates.push(day)
    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{
    const ids=skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td>${l}</td>`

    dates.forEach(day=>{

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return

        if(day>=r.start && day<=r.end){
          parse(r.items).forEach(id=>{
            if(ids.includes(id)) booked++
          })
        }
      })

      const free=ids.length-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`
        <td onclick="openDay('${day}')" style="background:${bg}">
          ${free}
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* ========= POPUP ========= */
function openDay(day){

  let html=""

  rentals.forEach(r=>{

    if(r.returned) return

    if(day>=r.start && day<=r.end){

      const items=parse(r.items)
      const grouped={}

      items.forEach(id=>{
        const s=skis.find(x=>x.id===id)
        if(!s) return
        grouped[s.length]=(grouped[s.length]||0)+1
      })

      let skisHTML=""

      Object.keys(grouped).forEach(l=>{
        skisHTML+=`
          ${l} cm x ${grouped[l]}
          <button onclick="returnOne('${r.id}',${l})">−</button><br>
        `
      })

      html+=`
        <div style="margin-bottom:10px;border:1px solid #ccc;padding:6px;border-radius:8px">
          <b>${r.name}</b><br>
          ${r.start} → ${r.end}<br><br>
          ${skisHTML}
          <button onclick="extend('${r.id}')">Förläng</button>
          <button onclick="returnAll('${r.id}')">Återlämna allt</button>
        </div>
      `
    }
  })

  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" id="popup">
      <div class="popup-box">
        <h3>${day}</h3>
        ${html||"Inget"}
        <button onclick="closePopup()">Stäng</button>
      </div>
    </div>
  `)
}

function closePopup(){
  el("popup")?.remove()
}

/* ========= ACTIONS ========= */
async function returnOne(id,length){

  const r=rentals.find(x=>x.id==id)
  let items=parse(r.items)

  const i=items.findIndex(itemId=>{
    const s=skis.find(x=>x.id===itemId)
    return s && s.length==length
  })

  if(i===-1) return

  items.splice(i,1)

  if(items.length===0){
    await returnAll(id)
    return
  }

  await supabaseClient.from("rentals")
    .update({items:JSON.stringify(items)})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
}

async function returnAll(id){
  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
}

async function extend(id){
  const d=prompt("Nytt slutdatum YYYY-MM-DD")
  if(!d) return

  await supabaseClient.from("rentals")
    .update({end:d})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
}

/* ========= NAV ========= */
function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= DATE ========= */
function format(d){return d.toISOString().split("T")[0]}
function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("❌ " + e.message)
}
