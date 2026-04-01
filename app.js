console.log("VERSION 2.0 MULTI EQUIPMENT")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)

/* STATE */
let skis=[], rentals=[], filteredRentals=[], cart=[], weekOffset=0
let currentTab="booking"

/* INIT */
window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadAll()
  renderAll()
}

/* LOAD */
async function loadAll(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]

  skis=skis.map(s=>({...s,type:s.type||"langd"}))

  filteredRentals=rentals
}

/* HELP */
function el(id){return document.getElementById(id)}

/* GROUP TYPES */
function getTypes(){
  return [...new Set(skis.map(s=>s.type))]
}

function getLengths(type){
  return [...new Set(
    skis.filter(s=>s.type===type).map(s=>s.length)
  )].sort((a,b)=>a-b)
}

function getIds(type,length){
  return skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)
}

/* RENDER */
function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* TABS */
function switchTab(tab){
  currentTab=tab

  el("bookingView").style.display = tab==="booking"?"block":"none"
  el("calendarView").style.display = tab==="calendar"?"block":"none"
}

/* SKIDOR */
function renderWall(){

  const div=el("skiWall")
  div.innerHTML=""

  const labels={
    langd:"🎿 Längd",
    skin:"🟢 Skins",
    tur:"🟠 Tur",
    slalom:"⛷ Slalom",
    pjaxa:"👢 Pjäxor",
    stav:"🪵 Stavar",
    hjalm:"🪖 Hjälmar",
    pulka:"🛷 Pulkor"
  }

  getTypes().forEach(type=>{

    div.innerHTML+=`<h4>${labels[type]||type}</h4>`

    getLengths(type).forEach(l=>{

      const ids=getIds(type,l)
      const available=getAvailable(ids)
      const selected=getSelected(ids)

      let bg="#e8f5e9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

      div.innerHTML+=`
        <div class="card" style="background:${bg}">
          <b>${l}${type==="pjaxa"?" EU":" cm"}</b><br>
          ${available} kvar<br>
          <button onclick="minus('${type}',${l})">−</button>
          ${selected}
          <button onclick="plus('${type}',${l})">+</button>
        </div>
      `
    })
  })
}

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,l){
  const ids=getIds(type,l)
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(type,l){
  const ids=getIds(type,l)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=el("cart")
  if(cart.length===0){div.innerHTML="Inga val";return}

  const grouped={}
  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    const key=s.type+"-"+s.length
    grouped[key]=(grouped[key]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(k=>{
    html+=`${k.replace("-", " ")} x ${grouped[k]}<br>`
  })

  div.innerHTML=html
}

/* 🔥 PAKET */
function addPackage(type){

  if(type==="langd"){
    addFirst("langd")
    addFirst("pjaxa")
    addFirst("stav")
  }

  if(type==="slalom"){
    addFirst("slalom")
    addFirst("pjaxa")
    addFirst("stav")
  }

  renderAll()
}

function addFirst(type){
  const items=skis.filter(s=>s.type===type)
  if(items.length===0) return
  cart.push(items[0].id)
}

/* LAGER */
function getAvailable(ids){
  let booked=0
  rentals.forEach(r=>{
    if(r.returned) return
    try{
      JSON.parse(r.items||"[]").forEach(id=>{
        if(ids.includes(id)) booked++
      })
    }catch{}
  })
  return ids.length-booked
}

/* SAVE */
async function saveBooking(){
  if(!el("customer").value||!el("start").value||!el("end").value||cart.length===0){
    alert("Fyll i allt");return
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

/* KALENDER (oförändrad logik) */
function renderWeek(){

  const div=el("calendar")

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let html="<table style='width:100%;height:100%'><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    const day=format(d)
    dates.push(day)
    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  getLengths("langd").forEach(l=>{

    const ids=getIds("langd",l)
    const total=ids.length

    html+=`<tr><td style="background:#eee;color:black">${l}</td>`

    dates.forEach(day=>{

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return
        let items=[]
        try{items=JSON.parse(r.items||"[]")}catch{}
        if(day>=r.start && day<=r.end){
          items.forEach(id=>{if(ids.includes(id)) booked++})
        }
      })

      const free=total-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`<td style="background:${bg};color:black">${free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* BOOKINGS */
function renderRentals(){
  const div=el("rentals")
  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
      <div class="card">
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}
      </div>
    `
  })
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
