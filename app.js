console.log("PRO STABIL FULL")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[],rentals=[],cart=[]
let activeType=null
let weekOffset=0

/* ========= PRIS ========= */
const priceTable = {
  Knatte: [165,235,305,365,415,450,35],
  Junior: [190,270,360,410,460,520,60],
  Vuxen:  [450,600,750,900,1000,1100,100]
}

/* ========= INIT ========= */
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
  el("saveBtn").onclick=saveBooking
}

/* ========= TABS ========= */
function setupTabs(){
  const div=el("tabs")
  div.innerHTML=""

  const types=[...new Set(skis.map(s=>s.type).filter(Boolean))]
  activeType=types.length?types[0]:null

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

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
}

/* ========= WALL ========= */
function renderWall(){

  if(!activeType){
    el("skiWall").innerHTML="Ingen utrustning"
    return
  }

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
    if(available===0) bg="#f44336"
    else if(available<=2) bg="#ff9800"

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

/* ========= PRIS ========= */
function getDays(){
  const start=el("start").value
  const end=el("end").value

  if(!start||!end) return 1

  return Math.ceil((new Date(end)-new Date(start))/(1000*60*60*24))+1
}

function getPrice(type,days){
  const t=priceTable[type]
  if(!t) return 0

  if(days<=5) return t[days-1]
  if(days<=7) return t[5]

  return t[5]+(days-7)*t[6]
}

function renderCart(){

  if(cart.length===0){
    el("cart").innerHTML="Inga val"
    return
  }

  const days=getDays()

  let total=0

  cart.forEach(id=>{
    const ski=skis.find(s=>s.id===id)
    if(ski) total+=getPrice(ski.type,days)
  })

  el("cart").innerHTML=`
    ${cart.length} artiklar<br>
    ${days} dagar<br>
    <b>${total} kr</b>
  `
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

  const today=formatDate(new Date())

  const active=rentals.filter(r=>!r.returned)

  if(active.length===0){
    div.innerHTML="Inga bokningar"
    return
  }

  div.innerHTML+=renderStats()

  active.forEach(r=>{

    const items=parse(r.items)

    let list=""
    let counts={}
    let total=0

    const days=(r.start&&r.end)
      ? Math.ceil((new Date(r.end)-new Date(r.start))/(1000*60*60*24))+1
      : 1

    items.forEach(id=>{
      const ski=skis.find(s=>s.id===id)
      if(ski){
        list+=`${ski.type} ${ski.length} cm<br>`
        counts[ski.type]=(counts[ski.type]||0)+1
        total+=getPrice(ski.type,days)
      }
    })

    let countHTML=""
    Object.keys(counts).forEach(k=>{
      countHTML+=`${k}: ${counts[k]}<br>`
    })

    let warn=(r.end===today)
      ? "<div style='color:red'>Åter idag!</div>"
      : ""

    div.innerHTML+=`
      <div class="card" onclick="editBooking('${r.id}')">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
        ${warn}
        <hr>
        ${countHTML}
        <hr>
        ${list}
        <hr>
        <b>${total} kr</b><br>
      </div>
    `
  })
}

/* ========= EDIT ========= */
function editBooking(id){
  const r=rentals.find(x=>x.id==id)
  if(!r) return

  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" onclick="this.remove()">
      <div class="popup-box" onclick="event.stopPropagation()">
        <h3>${r.name}</h3>
        <input id="editStart" type="date" value="${r.start||""}">
        <input id="editEnd" type="date" value="${r.end||""}">
        <button onclick="saveEdit('${id}')">Spara</button>
        <button onclick="deleteBooking('${id}')">Ta bort</button>
      </div>
    </div>
  `)
}

async function saveEdit(id){
  const start=el("editStart").value
  const end=el("editEnd").value

  await supabaseClient.from("rentals").update({start,end}).eq("id",id)

  document.querySelector(".popup").remove()
  await load()
  render()
}

async function deleteBooking(id){
  await supabaseClient.from("rentals").delete().eq("id",id)
  document.querySelector(".popup").remove()
  await load()
  render()
}

/* ========= STATISTIK ========= */
function renderStats(){

  const total=rentals.reduce((s,r)=>s+parse(r.items).length,0)
  const active=rentals.filter(r=>!r.returned).length

  let types={}

  rentals.forEach(r=>{
    parse(r.items).forEach(id=>{
      const ski=skis.find(s=>s.id===id)
      if(ski){
        types[ski.type]=(types[ski.type]||0)+1
      }
    })
  })

  const top=Object.keys(types).sort((a,b)=>types[b]-types[a])[0]||"-"

  return `
    <div class="section">
      <b>Statistik</b><br>
      Totalt: ${total}<br>
      Aktiva: ${active}<br>
      Mest hyrd: ${top}
    </div>
  `
}

/* ========= CALENDAR ========= */
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
