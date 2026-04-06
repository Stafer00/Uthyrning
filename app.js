console.log("PRO iPad TABS")

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
  render()
}

/* LOAD */
async function load(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
}

/* HELP */
function el(id){return document.getElementById(id)}
function parse(x){try{return JSON.parse(x||"[]")}catch{return[]}}

/* TABS */
function setupTabs(){

  const types=[...new Set(skis.map(s=>s.type))]
  activeType=types[0]

  const div=el("tabs")

  types.forEach(t=>{
    div.innerHTML+=`
      <div class="tab" onclick="setTab('${t}')">${t}</div>
    `
  })
}

function setTab(t){
  activeType=t
  renderWall()

  document.querySelectorAll(".tab").forEach(tab=>{
    tab.classList.remove("active")
    if(tab.innerText===t) tab.classList.add("active")
  })
}

/* RENDER */
function render(){
  renderWall()
  renderCart()
  renderRentals()
}

/* WALL */
function renderWall(){

  const div=el("skiWall")
  div.innerHTML=""

  const list=skis.filter(s=>s.type===activeType)

  const lengths=[...new Set(list.map(s=>s.length))]

  const grid=document.createElement("div")
  grid.className="grid"

  lengths.forEach(length=>{

    const ids=list.filter(s=>s.length==length).map(s=>s.id)

    const available=getAvailable(ids)
    const selected=getSelected(ids)

    let bg="#c8e6c9"
    if(available===0) bg="#ffcdd2"

    grid.innerHTML+=`
      <div class="card" style="background:${bg}">
        ${length}<br>
        ${available}<br>
        <button onclick="minus(${length})">−</button>
        ${selected}
        <button onclick="plus(${length})">+</button>
      </div>
    `
  })

  div.appendChild(grid)
}

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){
  const ids=skis.filter(s=>s.type===activeType && s.length==length).map(s=>s.id)
  cart.push(ids[0])
  render()
}

function minus(length){
  const ids=skis.filter(s=>s.type===activeType && s.length==length).map(s=>s.id)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  render()
}

function renderCart(){
  el("cart").innerHTML=cart.length+" artiklar"
}

/* LAGER */
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

/* SAVE */
async function saveBooking(){

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

/* BOOKINGS */
function renderRentals(){
  const div=el("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{
    div.innerHTML+=`<div>${r.name}</div>`
  })
}

/* BUTTON */
document.addEventListener("click",e=>{
  if(e.target.id==="saveBtn") saveBooking()
})
