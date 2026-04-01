console.log("VERSION 2.1 CLEAN UI")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* STATE */
let skis=[], rentals=[], filteredRentals=[], cart=[], weekOffset=0
let activeType="langd"

const VALID_TYPES=["langd","skin","tur","slalom","pjaxa","stav","hjalm","pulka"]

window.onload=init

async function init(){
  el("saveBtn").onclick=saveBooking
  await loadAll()
  renderAll()
}

/* LOAD */
async function loadAll(){
  const s=await supabaseClient.from("skis").select("*")
  const r=await supabaseClient.from("rentals").select("*")

  skis=(s.data||[]).map(x=>({
    id:x.id,
    length:Number(x.length)||0,
    type:VALID_TYPES.includes(x.type)?x.type:"langd"
  }))

  rentals=r.data||[]
  filteredRentals=rentals
}

/* HELP */
function el(id){return document.getElementById(id)}
function safeParse(x){try{return JSON.parse(x||"[]")}catch{return[]}}

/* GROUP */
function getLengths(type){
  return [...new Set(skis.filter(s=>s.type===type).map(s=>s.length))].sort((a,b)=>a-b)
}
function getIds(type,length){
  return skis.filter(s=>s.type===type&&s.length==length).map(s=>s.id)
}

/* RENDER */
function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* SWITCH TYPE */
function setType(t){
  activeType=t
  renderWall()
}

/* WALL */
function renderWall(){
  const div=el("skiWall")
  div.innerHTML=""

  const lengths=getLengths(activeType)

  if(lengths.length===0){
    div.innerHTML="Inget lager"
    return
  }

  lengths.forEach(l=>{
    const ids=getIds(activeType,l)
    const available=getAvailable(ids)
    const selected=getSelected(ids)

    let bg="#e8f5e9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    div.innerHTML+=`
      <div class="card" style="background:${bg}">
        <b>${l}</b><br>
        ${available} kvar<br>
        <button onclick="minus('${activeType}',${l})">−</button>
        ${selected}
        <button onclick="plus('${activeType}',${l})">+</button>
      </div>
    `
  })
}

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){
  const ids=getIds(type,length)
  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut")
    return
  }
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(type,length){
  const ids=getIds(type,length)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=el("cart")
  if(cart.length===0){div.innerHTML="Inga val";return}

  const g={}
  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    const k=s.type+"_"+s.length
    g[k]=(g[k]||0)+1
  })

  let html=""
  Object.keys(g).forEach(k=>{
    const [t,l]=k.split("_")
    html+=`${t} ${l} x ${g[k]}<br>`
  })

  div.innerHTML=html
}

/* LAGER */
function getAvailable(ids){
  let b=0
  rentals.forEach(r=>{
    if(r.returned) return
    safeParse(r.items).forEach(id=>{
      if(ids.includes(id)) b++
    })
  })
  return ids.length-b
}

/* SAVE */
async function saveBooking(){

  if(!el("customer").value||!el("start").value||!el("end").value||cart.length===0){
    alert("Fyll i allt")
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

  clearForm()
  await loadAll()
  renderAll()
}

/* CLEAR */
function clearForm(){
  el("customer").value=""
  el("phone").value=""
  el("start").value=""
  el("end").value=""
  cart=[]
  renderAll()
}

/* BOOKINGS */
function renderRentals(){
  const div=el("rentals")
  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
      <div style="border:1px solid #ccc;padding:6px;margin:4px">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}<br>
      </div>
    `
  })
}

/* SEARCH */
function filterRentals(){
  const q=el("search").value.toLowerCase()
  filteredRentals=rentals.filter(r=>
    (r.name||"").toLowerCase().includes(q)
  )
  renderRentals()
}

/* CALENDAR */
function renderWeek(){

  const div=el("calendar")

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table><tr><th>cm</th>"

  let dates=[]
  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
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
        if(day>=r.start&&day<=r.end){
          safeParse(r.items).forEach(id=>{
            if(ids.includes(id)) booked++
          })
        }
      })

      const free=ids.length-booked
      let bg=free===0?"#f44336":free<=2?"#ff9800":"#4caf50"

      html+=`<td style="background:${bg}">${free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* NAV */
function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* DATE */
function format(d){return d.toISOString().split("T")[0]}
function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
