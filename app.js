console.log("PRO iPad STABIL FIX")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[],rentals=[],cart=[]
let activeType=null
let weekOffset=0

window.onload=init

async function init(){
  await load()
  setupTabs()
  bindUI()
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

/* UI */
function bindUI(){
  el("saveBtn").onclick=saveBooking
}

/* TABS */
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
    tab.classList.toggle("active",tab.innerText===t)
  })
  renderWall()
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

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){
  const ids=skis.filter(s=>s.type===activeType && s.length==length).map(s=>s.id)

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(length){
  const ids=skis.filter(s=>s.type===activeType && s.length==length).map(s=>s.id)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  render()
}

function renderCart(){
  el("cart").innerHTML = cart.length===0
    ? "Inga val"
    : cart.length+" artiklar"
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

/* BOOKINGS */
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
      <div class="card">
        <b>${r.name}</b><br>
        ${r.start||"-"} → ${r.end||"-"}<br>
        ${items.length} artiklar<br>
        <button onclick="markReturned('${r.id}')">Återlämnad</button>
      </div>
    `
  })
}

/* RETURN */
async function markReturned(id){
  await supabaseClient.from("rentals").update({returned:true}).eq("id",id)
  await load()
  render()
}

/* VIEW */
function showView(view){
  el("bookingView").classList.remove("active")
  el("calendarView").classList.remove("active")

  if(view==="calendar"){
    el("calendarView").classList.add("active")
    renderCalendar()
  }else{
    el("bookingView").classList.add("active")
  }
}

/* CALENDAR */
function renderCalendar(){
  const div=el("calendar")
  if(!div) return

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table><tr><th>cm</th>"

  let days=[]

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    let ds=formatDate(d)
    days.push(ds)

    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(length=>{
    const ids=skis.filter(s=>s.length==length).map(s=>s.id)

    html+=`<tr><td>${length}</td>`

    days.forEach(day=>{
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

      html+=`<td style="background:${bg}">${free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day===0?6:day-1)
  return new Date(d.setDate(diff))
}

function formatDate(d){
  return d.toISOString().split("T")[0]
}

function prevWeek(){weekOffset--;renderCalendar()}
function nextWeek(){weekOffset++;renderCalendar()}
