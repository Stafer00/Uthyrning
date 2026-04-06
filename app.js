console.log("PRO iPad TABS STABIL")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[],rentals=[],cart=[]
let activeType=null

window.onload=init

async function init(){
  await load()
  setupTabs()
  bindUI()
  render()
}

/* ========= LOAD ========= */
async function load(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
}

/* ========= HELP ========= */
function el(id){return document.getElementById(id)}
function parse(x){try{return JSON.parse(x||"[]")}catch{return[]}}

/* ========= UI ========= */
function bindUI(){
  const btn=el("saveBtn")
  if(btn) btn.onclick=saveBooking
}

/* ========= TABS ========= */
function setupTabs(){

  const div=el("tabs")
  div.innerHTML=""

  const types=[...new Set(skis.map(s=>s.type).filter(Boolean))]

  activeType=types[0]

  types.forEach(t=>{
    div.innerHTML+=`
      <div class="tab ${t===activeType?'active':''}" onclick="setTab('${t}')">
        ${t}
      </div>
    `
  })
}

function setTab(t){
  activeType=t

  document.querySelectorAll(".tab").forEach(tab=>{
    tab.classList.remove("active")
    if(tab.innerText===t) tab.classList.add("active")
  })

  renderWall()
}

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
}

/* ========= WALL ========= */
function renderWall(){

  const div=el("skiWall")
  div.innerHTML=""

  const list=skis.filter(s=>s.type===activeType)

  const lengths=[...new Set(list.map(s=>s.length))].sort((a,b)=>a-b)

  const grid=document.createElement("div")
  grid.className="grid"

  lengths.forEach(length=>{

    const ids=list.filter(s=>s.length==length).map(s=>s.id)

    const available=getAvailable(ids)
    const selected=getSelected(ids)

    let bg="#c8e6c9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    grid.innerHTML+=`
      <div class="card" style="background:${bg}">
        <b>${length}</b><br>
        ${available} kvar<br>
        <button onclick="minus(${length})">−</button>
        ${selected}
        <button onclick="plus(${length})">+</button>
      </div>
    `
  })

  div.appendChild(grid)
}

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){

  const ids=skis
    .filter(s=>s.type===activeType && s.length==length)
    .map(s=>s.id)

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(length){
  const ids=skis
    .filter(s=>s.type===activeType && s.length==length)
    .map(s=>s.id)

  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)

  render()
}

function renderCart(){
  el("cart").innerHTML = cart.length===0
    ? "Inga val"
    : cart.length+" artiklar"
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

  if(!el("customer").value || cart.length===0){
    alert("Fyll i kund + välj utrustning")
    return
  }

  await supabaseClient.from("rentals").insert({
    name:el("customer").value,
    phone:el("phone").value,
    start:el("start").value,
    end:el("end").value,
    items:JSON.stringify(cart),
    returned:false
  })

  cart=[]
  await load()
  render()
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div=el("rentals")
  div.innerHTML=""

  const active=rentals.filter(r=>!r.returned)

  if(active.length===0){
    div.innerHTML="Inga bokningar"
    return
  }

  active.forEach(r=>{

    const items=parse(r.items)

    div.innerHTML+=`
      <div style="
        border:1px solid #ddd;
        padding:6px;
        border-radius:8px;
        margin-bottom:6px;
        font-size:12px;
      ">
        <b>${r.name}</b><br>
        ${r.start||"-"} → ${r.end||"-"}<br>
        ${items.length} artiklar<br>

        <button onclick="markReturned('${r.id}')">
          Återlämnad
        </button>
      </div>
    `
  })
}

/* ========= RETURN ========= */
async function markReturned(id){

  await supabaseClient
    .from("rentals")
    .update({returned:true})
    .eq("id",id)

  await load()
  render()
}
