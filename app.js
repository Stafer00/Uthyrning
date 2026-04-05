console.log("STABLE 2.2 FIXED")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let cart = []
let weekOffset = 0

/* ========= INIT ========= */
window.onload = init

async function init(){
  try{
    bind()
    await load()
    render()
  }catch(e){
    showError(e)
  }
}

/* ========= BIND ========= */
function bind(){
  document.getElementById("saveBtn").onclick = save
}

/* ========= LOAD ========= */
async function load(){

  const { data: skisData } =
    await supabaseClient.from("skis").select("*")

  const { data: rentData } =
    await supabaseClient.from("rentals").select("*")

  skis = (skisData || []).map(s => ({
    id: s.id,
    length: Number(s.length) || 0,
    type: (s.type || "").toLowerCase().trim() // 🔥 KRITISK FIX
  }))

  rentals = rentData || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }

function parse(x){
  try{return JSON.parse(x||"[]")}catch{return[]}
}

/* ========= VIEW ========= */
function showView(view){
  el("bookingView").classList.add("hidden")
  el("calendarView").classList.add("hidden")

  if(view==="calendar"){
    el("calendarView").classList.remove("hidden")
    renderWeek()
  }else{
    el("bookingView").classList.remove("hidden")
  }
}

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
}

/* ========= WALL ========= */
function renderWall(){

  const div = el("skiWall")
  div.innerHTML = ""

  const types = [...new Set(
    skis.map(s=>s.type).filter(Boolean)
  )]

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

      const card = document.createElement("div")
      card.className = "card"
      card.style.background = bg

      card.innerHTML = `
        <b>${length}</b><br>
        ${available} kvar<br>
        <button onclick="minus('${type}',${length})">−</button>
        ${selected}
        <button onclick="plus('${type}',${length})">+</button>
      `

      grid.appendChild(card)
    })

    div.appendChild(grid)
  })
}

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){
  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  if(getSelected(ids) >= getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(type,length){
  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  const i = cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)

  render()
}

function renderCart(){

  const div = el("cart")

  if(cart.length===0){
    div.innerHTML = "Inga val"
    return
  }

  const grouped = {}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return

    const key = s.type+" "+s.length
    grouped[key] = (grouped[key]||0)+1
  })

  let html=""

  Object.keys(grouped).forEach(k=>{
    html += `${k} x ${grouped[k]}<br>`
  })

  div.innerHTML = html
}

/* ========= BOOKINGS ========= */
function renderRentals(){
  el("rentals").innerHTML = rentals.length + " bokningar"
}

/* ========= STOCK ========= */
function getAvailable(ids){

  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    parse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length - booked
}

/* ========= SAVE ========= */
async function save(){

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
    returned:false
  })

  cart=[]
  await load()
  render()

  alert("✅ Sparad")
}

/* ========= CALENDAR ========= */
function renderWeek(){

  const div = el("calendar")

  let html="<table><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    html+=`<th>${i+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{

    const ids = skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td>${l}</td>`

    for(let i=0;i<7;i++){

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return

        parse(r.items).forEach(id=>{
          if(ids.includes(id)) booked++
        })
      })

      const free = ids.length - booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`<td style="background:${bg}">${free}</td>`
    }

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML = html
}

function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("Fel: "+e.message)
}
