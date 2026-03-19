alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let selections={}
let cart=[]
let weekOffset=0

window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadSkis()
  await loadBookings()
  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data}=await supabaseClient.from("skis").select("*")
  skis=data||[]
}

async function loadBookings(){
  const {data}=await supabaseClient.from("rentals").select("*")
  rentals=data||[]
}

/* ========= LAGER ========= */

function getAvailableCount(length,start,end){

  let total=skis.filter(s=>s.length==length).length
  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    if(!(end < r.start || start > r.end)){
      let items=[]
      try{items=JSON.parse(r.items||"[]")}catch{}

      items.forEach(id=>{
        let ski=skis.find(s=>s.id===id)
        if(ski && ski.length==length){
          booked++
        }
      })
    }
  })

  return total-booked
}

/* ========= RENDER ========= */

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
  renderInventory()
}

/* ========= KOMPAKT GRID ========= */

function renderWall(){

  const div=document.getElementById("skiWall")
  div.innerHTML=""

  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  let html="<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px'>"

  Object.keys(groups).sort((a,b)=>a-b).forEach(length=>{

    let available=(start&&end)
      ? getAvailableCount(length,start,end)
      : groups[length].length

    let selected=selections[length]||0

    html+=`
    <div style="border:1px solid #ccc;padding:10px;border-radius:10px;text-align:center">

      <strong>${length} cm</strong><br>
      <small>${available} kvar</small><br><br>

      <button onclick="minus('${length}')">–</button>
      <span style="font-size:20px;margin:0 10px">${selected}</span>
      <button onclick="plus('${length}',${available})">+</button>

    </div>
    `
  })

  html+="</div>"

  div.innerHTML=html
}

function plus(length,available){

  if(!selections[length]) selections[length]=0

  if(selections[length] >= available){
    alert("Finns inte fler")
    return
  }

  selections[length]++
  buildCart()
  renderAll()
}

function minus(length){

  if(!selections[length]) return

  selections[length]--

  if(selections[length]<=0){
    delete selections[length]
  }

  buildCart()
  renderAll()
}

/* ========= CART ========= */

function buildCart(){

  cart=[]

  Object.keys(selections).forEach(length=>{

    let count=selections[length]
    let list=skis.filter(s=>s.length==length)

    for(let i=0;i<count;i++){
      if(list[i]) cart.push(list[i].id)
    }
  })
}

function renderCart(){

  const div=document.getElementById("cart")

  if(cart.length===0){
    div.innerHTML="Inga skidor"
    return
  }

  let html="<strong>Valt:</strong><br>"

  Object.keys(selections).forEach(l=>{
    html+=`${l} cm: ${selections[l]} st<br>`
  })

  html+=`<br><button onclick="clearCart()">Rensa</button>`

  div.innerHTML=html
}

function clearCart(){
  selections={}
  cart=[]
  renderAll()
}

/* ========= SAVE ========= */

async function saveBooking(){

  let name=document.getElementById("customer").value
  let phone=document.getElementById("phone").value
  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i alla fält")
    return
  }

  const {error}=await supabaseClient.from("rentals").insert({
    name,
    phone,
    start,
    end,
    items:JSON.stringify(cart),
    returned:false
  })

  if(error){
    alert(error.message)
    return
  }

  selections={}
  cart=[]

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(d)
  }

  let html="<table><tr><th>Längd</th>"

  dates.forEach((d,i)=>{
    html+=`<th>${days[i]}<br>${d.getDate()}/${d.getMonth()+1}</th>`
  })

  html+="</tr>"

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  Object.keys(groups).forEach(length=>{

    html+=`<tr><td>${length} cm</td>`

    dates.forEach(d=>{

      let free=getAvailableCount(length,formatLocal(d),formatLocal(d))

      let color="#4caf50"
      if(free<=0) color="#f44336"
      else if(free==1) color="#ff9800"

      html+=`<td style="background:${color};color:white">${free<=0?"FULLT":free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= LAGERHANTERING ========= */

function renderInventory(){

  const div=document.getElementById("inventory")
  if(!div) return

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  let html=""

  Object.keys(groups).forEach(length=>{

    html+=`
    <div style="margin:5px;border:1px solid #ccc;padding:8px;border-radius:8px">

      <strong>${length} cm</strong> (${groups[length].length})

      <button onclick="addSki('${length}')">+</button>
      <button onclick="removeSki('${length}')">–</button>

    </div>
    `
  })

  div.innerHTML=html
}

async function addSki(length){

  await supabaseClient.from("skis").insert({
    length:parseInt(length)
  })

  await loadSkis()
  renderAll()
}

async function removeSki(length){

  let ski=skis.find(s=>s.length==length)
  if(!ski){
    alert("Inga kvar")
    return
  }

  await supabaseClient.from("skis").delete().eq("id",ski.id)

  await loadSkis()
  renderAll()
}

/* ========= RENTALS ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
    <div style="border:1px solid #ccc;padding:10px;margin:5px">
      <strong>${r.name}</strong><br>
      ${r.start} → ${r.end}
    </div>
    `
  })
}

/* ========= NAV ========= */

function prevWeek(){
  weekOffset--
  renderWeek()
}

function nextWeek(){
  weekOffset++
  renderWeek()
}

/* ========= DATUM ========= */

function formatLocal(d){
  let y=d.getFullYear()
  let m=(d.getMonth()+1).toString().padStart(2,"0")
  let day=d.getDate().toString().padStart(2,"0")
  return `${y}-${m}-${day}`
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
