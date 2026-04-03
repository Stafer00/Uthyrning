console.log("VERSION 1.7 PRO STABLE")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let cart = []
let selectedType = "all"

/* ========= INIT ========= */
window.onload = init

async function init(){
  try{
    el("saveBtn").onclick = saveBooking
    await loadAll()
    renderAll()
  }catch(e){ showError(e) }
}

/* ========= LOAD ========= */
async function loadAll(){

  const skisRes = await supabaseClient.from("skis").select("*")
  const rentRes = await supabaseClient.from("rentals").select("*")

  skis = (skisRes.data || []).map(s => ({
    id: s.id,
    length: Number(s.length) || 0,
    type: (s.type || "okand").toLowerCase().trim()
  }))

  rentals = rentRes.data || []

  console.log("TYPES:", [...new Set(skis.map(s=>s.type))])
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
  div.innerHTML = ""

  div.innerHTML += `<button onclick="setType('all')">Alla</button>`

  getTypes().forEach(t=>{
    div.innerHTML += `<button onclick="setType('${t}')">${t}</button>`
  })
}

/* ========= WALL ========= */
function renderWall(){

  const div = el("skiWall")
  div.innerHTML = ""

  let list = skis

  if(selectedType !== "all"){
    list = skis.filter(s=>s.type === selectedType)
  }

  if(list.length === 0){
    div.innerHTML = "Ingen utrustning hittad"
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

  alert("Sparad!")

  cart=[]
  await loadAll()
  renderAll()
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div = el("rentals")
  div.innerHTML=""

  const active = rentals.filter(r=>!r.returned)

  if(active.length===0){
    div.innerHTML="Inga bokningar"
    return
  }

  active.forEach(r=>{

    const items = parse(r.items)

    div.innerHTML += `
      <div class="booking">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
        ${items.length} artiklar<br>
      </div>
    `
  })
}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("Fel: " + e.message)
}
