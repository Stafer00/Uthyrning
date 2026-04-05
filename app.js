console.log("VERSION 2.0 PRIS-KOPPLAD")

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
  if(el("saveBtn")) el("saveBtn").onclick = saveBooking

  el("start")?.addEventListener("change", calculateTotal)
  el("end")?.addEventListener("change", calculateTotal)
}

/* ========= LOAD ========= */
async function loadAll(){

  const { data: skisData } =
    await supabaseClient.from("skis").select("*")

  const { data: rentData } =
    await supabaseClient.from("rentals").select("*")

  const { data: prodData } =
    await supabaseClient.from("products").select("*")

  const { data: priceData } =
    await supabaseClient.from("prices").select("*")

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

  const diff = Math.ceil((e - s)/(1000*60*60*24)) + 1

  return Math.max(1, diff)
}

/* ========= PRIS ========= */
function getPriceForProduct(productId){

  const p = prices.find(x=>x.product_id == productId)
  if(!p) return 0

  const days = getDays()

  if(days <= 1) return p.day_1
  if(days == 2) return p.day_2
  if(days == 3) return p.day_3
  if(days == 4) return p.day_4
  if(days == 5) return p.day_5

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

  const div = el("total")
  if(div){
    const days = getDays()
    div.innerHTML = `💰 ${total} kr (${days} dagar)`
  }
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

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("❌ " + e.message)
}
