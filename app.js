console.log("VERSION 1.7.2 PRO STABLE")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
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
    console.log("App startad OK")
  }catch(e){
    showError(e)
  }
}

/* ========= UI ========= */
function bindUI(){
  const btn = document.getElementById("saveBtn")
  if(btn) btn.onclick = saveBooking
}

/* ========= LOAD ========= */
async function loadAll(){

  const { data: skisData, error: skiErr } =
    await supabaseClient.from("skis").select("*")

  const { data: rentData, error: rentErr } =
    await supabaseClient.from("rentals").select("*")

  if(skiErr) throw skiErr
  if(rentErr) throw rentErr

  skis = (skisData || []).map(s => ({
    id: s.id,
    length: Number(s.length) || 0,
    type: String(s.type || "okand").toLowerCase().trim()
  }))

  rentals = rentData || []

  console.log("Skis:", skis.length)
  console.log("Rentals:", rentals.length)
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
}

/* ========= FILTER BUTTONS ========= */
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

  if(!ids.length) return

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

    const items = parse(r.items)

    items.forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length-booked
}

/* ========= SAVE ========= */
async function saveBooking(){

  if(!el("customer").value || !el("start").value || !el("end").value || cart.length===0){
    alert("Fyll i allt")
    return
  }

  try{
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

  }catch(e){
    showError(e)
  }
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div = el("rentals")
  if(!div) return

  div.innerHTML=""

  const active = rentals.filter(r=>!r.returned)

  if(active.length===0){
    div.innerHTML="Inga bokningar"
    return
  }

  active.forEach(r=>{
    div.innerHTML += `
      <div class="booking">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
        ${parse(r.items).length} artiklar
      </div>
    `
  })
}

/* ========= ROUTING ========= */
function showView(view){

  const booking = el("bookingView")
  const calendar = el("calendarView")

  if(booking) booking.classList.add("hidden")
  if(calendar) calendar.classList.add("hidden")

  if(view === "calendar"){
    if(calendar) calendar.classList.remove("hidden")
    renderWeek()
  }else{
    if(booking) booking.classList.remove("hidden")
  }
}

/* ========= CALENDAR ========= */
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

        if(day >= r.start && day <= r.end){
          parse(r.items).forEach(id=>{
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
  alert("❌ Fel: " + e.message)
}
