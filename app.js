console.log("PRO 4.0 STABIL + PRIS + PAKET")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= PRISER ========= */
const PRICES = {
  langd: 150,
  slalom: 200,
  pjaxa: 100,
  stav: 50,
  hjalm: 50,
  pulka: 200,
  skin: 180,
  tur: 180
}

/* ========= STATE ========= */
let skis = []
let rentals = []
let cart = []

/* ========= INIT ========= */
window.onload = init

async function init(){
  await load()
  render()
}

/* ========= LOAD ========= */
async function load(){
  const { data: s } = await supabaseClient.from("skis").select("*")
  const { data: r } = await supabaseClient.from("rentals").select("*")

  skis = (s || []).map(x=>({
    id:x.id,
    length:Number(x.length)||0,
    type:(x.type||"").toLowerCase().trim()
  }))

  rentals = r || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }
function parse(x){ try{return JSON.parse(x||"[]")}catch{return[]} }

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderDashboard()
}

/* ========= UTRUSTNING ========= */
function renderWall(){

  const div = el("skiWall")
  div.innerHTML = ""

  const types = [...new Set(skis.map(s=>s.type).filter(Boolean))]

  types.forEach(type=>{

    div.innerHTML += `<h4>${type.toUpperCase()}</h4>`

    const grid = document.createElement("div")
    grid.className = "grid"

    const lengths = [...new Set(
      skis.filter(s=>s.type===type).map(s=>s.length)
    )].sort((a,b)=>a-b)

    lengths.forEach(length=>{

      const ids = skis
        .filter(s=>s.type===type && s.length==length)
        .map(s=>s.id)

      const available = getAvailable(ids)
      const selected = getSelected(ids)

      let bg="#c8e6c9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

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
  const ids = skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

  if(getSelected(ids) >= getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(type,length){
  const ids = skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)
  const i = cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  render()
}

/* ========= PAKET ========= */
function addPackage(type){

  const needed = ["skidor","pjaxa","stav"]

  needed.forEach(part=>{
    const item = skis.find(s=>s.type===type || s.type===part)
    if(item) cart.push(item.id)
  })

  render()
}

/* ========= PRIS ========= */
function calcTotal(){

  let total = 0

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return
    total += PRICES[s.type] || 100
  })

  return total
}

function renderCart(){

  const div = el("cart")
  const totalDiv = el("total")

  if(cart.length===0){
    div.innerHTML="Inga val"
    totalDiv.innerHTML=""
    return
  }

  const grouped = {}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return
    const key = s.type + " " + s.length + " cm"
    grouped[key]=(grouped[key]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(k=>{
    html += `${k} x ${grouped[k]}<br>`
  })

  div.innerHTML = html
  totalDiv.innerHTML = `<b>Total: ${calcTotal()} kr</b>`
}

/* ========= LAGER ========= */
function getAvailable(ids){
  let booked = 0
  rentals.forEach(r=>{
    if(r.returned) return
    parse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })
  return ids.length - booked
}

/* ========= SAVE ========= */
async function saveBooking(){

  if(!el("customer").value || cart.length===0){
    alert("Fyll i kund + välj utrustning")
    return
  }

  await supabaseClient.from("rentals").insert({
    name: el("customer").value,
    phone: el("phone").value,
    start: el("start").value,
    end: el("end").value,
    items: JSON.stringify(cart),
    total: calcTotal(),
    returned:false
  })

  cart=[]
  await load()
  render()
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div = el("rentals")
  div.innerHTML = ""

  const active = rentals.filter(r=>!r.returned)

  active.forEach(r=>{

    const items = parse(r.items)

    div.innerHTML += `
      <div class="booking-card">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
        ${items.length} artiklar<br>
        💰 ${r.total || 0} kr
        <button onclick="markReturned('${r.id}')">Återlämnad</button>
      </div>
    `
  })
}

/* ========= RETURN ========= */
async function markReturned(id){
  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await load()
  render()
}

/* ========= DASHBOARD ========= */
function renderDashboard(){

  const div = el("dashboard")

  const active = rentals.filter(r=>!r.returned)

  let items=0
  let revenue=0

  active.forEach(r=>{
    items += parse(r.items).length
    revenue += r.total || 0
  })

  div.innerHTML = `
    📊 Bokningar: ${active.length}<br>
    🎿 Artiklar: ${items}<br>
    💰 Intäkter: ${revenue} kr
  `
}

/* ========= BUTTON ========= */
document.addEventListener("click", e=>{
  if(e.target.id==="saveBtn"){
    saveBooking()
  }
})
