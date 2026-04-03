console.log("VERSION 1.6.3 CLEAN + FIX")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "DIN-ANON-KEY-HÄR"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let filteredRentals = []
let cart = []
let weekOffset = 0

const VALID_TYPES = ["langd","skin","tur","slalom","pjaxa","stav","hjalm","pulka"]

window.onload = init

/* ========= INIT ========= */
async function init(){
  try{
    el("saveBtn").onclick = saveBooking

    const search = el("search")
    if(search) search.oninput = filterRentals

    await loadAll()
    filteredRentals = rentals

    renderAll()

  }catch(e){
    showError(e)
  }
}

/* ========= LOAD ========= */
async function loadAll(){

  const skisRes = await supabaseClient.from("skis").select("*")
  const rentRes = await supabaseClient.from("rentals").select("*")

  skis = (skisRes.data || []).map(s=>({
    id: s.id,
    length: Number(s.length) || 0,
    type: VALID_TYPES.includes(s.type) ? s.type : "langd"
  }))

  rentals = rentRes.data || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }

/* ========= SAFE ========= */
function safeParse(str){
  try{return JSON.parse(str||"[]")}catch{return[]}
}

/* ========= FILTER ========= */
function filterRentals(){

  const q = (el("search")?.value || "").toLowerCase()

  filteredRentals = rentals.filter(r =>
    (r.name || "").toLowerCase().includes(q) ||
    (r.phone || "").includes(q)
  )

  renderRentals()
}

/* ========= GROUP ========= */
function getTypes(){
  return [...new Set(skis.map(s=>s.type))]
}

function getLengths(type){
  return [...new Set(
    skis.filter(s=>s.type===type).map(s=>s.length)
  )].sort((a,b)=>a-b)
}

function getIds(type,length){
  return skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)
}

/* ========= RENDER ========= */
function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= UTRUSTNING ========= */
function renderWall(){

  const div = el("skiWall")
  if(!div) return

  div.innerHTML = ""

  getTypes().forEach(type=>{

    div.innerHTML += `<h4>${type.toUpperCase()}</h4>`

    const grid = document.createElement("div")
    grid.className = "grid"

    getLengths(type).forEach(length=>{

      const ids = getIds(type,length)
      const available = getAvailable(ids)
      const selected = getSelected(ids)

      let bg = "#e8f5e9"
      if(available === 0) bg = "#ffcdd2"
      else if(available <= 2) bg = "#fff3cd"

      grid.innerHTML += `
        <div class="card" style="background:${bg}">
          <b>${length}</b><br>
          ${available} kvar<br>
          <button onclick="minus('${type}',${length})">−</button>
          ${selected}
          <button onclick="plus('${type}',${length})">+</button>
        </div>
      `
    })

    div.appendChild(grid)
  })
}

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){

  const ids = getIds(type,length)
  if(!ids.length) return

  if(getSelected(ids) >= getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(type,length){

  const ids = getIds(type,length)
  const i = cart.findIndex(id=>ids.includes(id))

  if(i > -1) cart.splice(i,1)

  renderAll()
}

function renderCart(){

  const div = el("cart")
  if(!div) return

  if(cart.length === 0){
    div.innerHTML = "Inga val"
    return
  }

  const grouped = {}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return
    const key = s.type + " " + s.length
    grouped[key] = (grouped[key]||0)+1
  })

  let html = ""
  Object.keys(grouped).forEach(k=>{
    html += `${k} x ${grouped[k]}<br>`
  })

  div.innerHTML = html
}

/* ========= LAGER ========= */
function getAvailable(ids){

  let booked = 0

  rentals.forEach(r=>{
    if(r.returned) return

    safeParse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length - booked
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
    returned: false
  })

  clearForm()
  await loadAll()
  filteredRentals = rentals
  renderAll()
}

/* ========= CLEAR ========= */
function clearForm(){
  el("customer").value = ""
  el("phone").value = ""
  el("start").value = ""
  el("end").value = ""
  cart = []
}

/* ========= BOKNINGAR ========= */
function renderRentals(){

  const div = el("rentals")
  if(!div) return

  div.innerHTML = ""

  const list = filteredRentals.length ? filteredRentals : rentals

  if(list.length === 0){
    div.innerHTML = "Inga bokningar"
    return
  }

  list.forEach(r=>{

    if(r.returned) return

    const items = safeParse(r.items)
    const grouped = {}

    items.forEach(id=>{
      const s = skis.find(x=>x.id===id)
      if(!s) return
      const key = s.type + " " + s.length
      grouped[key] = (grouped[key]||0)+1
    })

    let itemsHTML = ""
    Object.keys(grouped).forEach(k=>{
      itemsHTML += `${k} x ${grouped[k]}<br>`
    })

    div.innerHTML += `
      <div style="border:1px solid #ccc;padding:6px;margin:4px;border-radius:6px">
        <b>${r.name || "-"}</b><br>
        📞 ${r.phone || "-"}<br>
        ${r.start} → ${r.end}<br><br>

        ${itemsHTML}

        <button onclick="quickReturn('${r.id}')">Återlämna</button>
      </div>
    `
  })
}

/* ========= RETURN ========= */
async function quickReturn(id){

  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  filteredRentals = rentals
  renderAll()
}

/* ========= KALENDER ========= */
function renderWeek(){

  const div = el("calendar")
  if(!div) return

  let base = getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let html="<table><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
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

        const items=safeParse(r.items)

        if(day>=r.start && day<=r.end){
          items.forEach(id=>{
            if(ids.includes(id)) booked++
          })
        }
      })

      const free=ids.length-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`<td style="background:${bg}">${free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
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
  alert("Fel: "+e.message)
}
