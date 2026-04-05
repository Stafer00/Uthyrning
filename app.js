console.log("APP 2.2 CLEAN PRO")

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
    console.log("✅ App redo")
  }catch(e){
    showError(e)
  }
}

/* ========= BIND ========= */
function bind(){
  if(el("saveBtn")){
    el("saveBtn").onclick = save
  }
}

/* ========= LOAD ========= */
async function load(){

  const { data: skiData, error: skiErr } =
    await supabaseClient.from("skis").select("*")

  const { data: rentData, error: rentErr } =
    await supabaseClient.from("rentals").select("*")

  if(skiErr) throw skiErr
  if(rentErr) throw rentErr

  skis = (skiData || []).map(s => ({
    id: s.id,
    length: Number(s.length) || 0,
    type: (s.type || "okand").toLowerCase().trim()
  }))

  rentals = rentData || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }

function parse(x){
  try{return JSON.parse(x || "[]")}
  catch{return[]}
}

function format(d){
  return d.toISOString().split("T")[0]
}

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderWeek()
}

/* ========= WALL ========= */
function renderWall(){

  const div = el("skiWall")
  if(!div) return

  div.innerHTML = ""

  const types = [...new Set(skis.map(s=>s.type))]

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

  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  const next = ids[getSelected(ids)]

  if(!next){
    alert("Slut i lager")
    return
  }

  cart.push(next)
  render()
}

function minus(type,length){

  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  const i = cart.findIndex(id=>ids.includes(id))

  if(i>-1){
    cart.splice(i,1)
  }

  render()
}

function renderCart(){

  const div = el("cart")
  if(!div) return

  if(cart.length===0){
    div.innerHTML = "Inga val"
    return
  }

  const grouped = {}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return

    const key = s.type + " " + s.length
    grouped[key] = (grouped[key] || 0) + 1
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

    parse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length - booked
}

/* ========= SAVE ========= */
async function save(){

  if(!el("customer").value || cart.length===0){
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

    alert("✅ Bokning sparad")

    cart = []

    await load()
    render()

  }catch(e){
    showError(e)
  }
}

/* ========= BOOKINGS ========= */
function renderRentals(){

  const div = el("rentals")
  if(!div) return

  const active = rentals.filter(r=>!r.returned)

  if(active.length===0){
    div.innerHTML = "Inga bokningar"
    return
  }

  let html = ""

  active.forEach(r=>{
    html += `
      <div>
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
        ${parse(r.items).length} artiklar
      </div><br>
    `
  })

  div.innerHTML = html
}

/* ========= CALENDAR ========= */
function renderWeek(){

  const div = el("calendar")
  if(!div) return

  let base = new Date()
  base.setDate(base.getDate() + weekOffset*7)

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

    const ids = skis.filter(s=>s.length==l).map(s=>s.id)
    const total = ids.length

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

      const free = total - booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`
        <td onclick="openDay('${day}')"
        style="background:${bg};color:black">
          ${free}
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML = html
}

/* ========= POPUP ========= */
function openDay(day){

  let html = `<h3>${day}</h3>`

  rentals.forEach(r=>{

    if(r.returned) return

    if(r.start<=day && r.end>=day){

      html += `
        <div style="margin-bottom:8px">
          <b>${r.name}</b><br>
          ${r.start} → ${r.end}
        </div>
      `
    }
  })

  if(html === `<h3>${day}</h3>`){
    html += "Inga bokningar"
  }

  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" onclick="this.remove()">
      <div class="popup-box">
        ${html}
      </div>
    </div>
  `)
}

/* ========= NAV ========= */
function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("❌ Fel: " + e.message)
}
