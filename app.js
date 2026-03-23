console.log("APP BULLETPROOF")

/* ========= GLOBAL ERROR HANDLER ========= */

window.onerror = function(msg, url, line){
  showError("JS FEL: " + msg)
}

function showError(msg){
  const div = document.getElementById("calendar")
  if(div){
    div.innerHTML = `
      <div style="padding:20px;color:red;font-weight:bold">
        ⚠️ ${msg}
      </div>
    `
  }
}

/* ========= SUPABASE SAFE ========= */

let supabaseClient = null

try{
  supabaseClient = window.supabase.createClient(
    "https://ycasdixhobiaiizevgsi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
  )
}catch(e){
  showError("Supabase init misslyckades")
}

/* ========= STATE ========= */

let skis = []
let rentals = []
let filteredRentals = []
let cart = []
let weekOffset = 0

/* ========= INIT ========= */

window.onload = init

async function init(){

  try{
    document.getElementById("saveBtn").onclick = saveBooking

    await safeLoadData()

    renderAll()

  }catch(e){
    showError("Init fel")
  }
}

/* ========= SAFE LOAD ========= */

async function safeLoadData(){

  try{

    const skisRes = await supabaseClient.from("skis").select("*")
    skis = skisRes.data || []

    const rentRes = await supabaseClient.from("rentals").select("*")
    rentals = rentRes.data || []

    filteredRentals = rentals

  }catch(e){

    console.log("LOAD ERROR", e)

    showError("Kunde inte ladda data (offline?)")
  }
}

/* ========= RENDER ========= */

function renderAll(){

  try{
    renderWall()
    renderCart()
    renderWeek()
    renderRentals()
  }catch(e){
    showError("Render fel")
  }
}

/* ========= SKIDOR ========= */

function getGroupedSkis(){
  const map={}
  skis.forEach(s=>{
    if(!map[s.length]) map[s.length]=[]
    map[s.length].push(s.id)
  })
  return map
}

function renderWall(){

  const div=document.getElementById("skiWall")
  if(!div) return

  div.innerHTML=""

  const grouped=getGroupedSkis()

  Object.keys(grouped).sort((a,b)=>a-b).forEach(length=>{

    const ids=grouped[length]
    const available=getAvailable(ids)
    const selected=getSelected(ids)

    const el=document.createElement("div")
    el.className="card"

    el.innerHTML=`
      <strong>${length} cm</strong><br>
      ${available} kvar<br>
      <button onclick="minus('${length}')">−</button>
      ${selected}
      <button onclick="plus('${length}')">+</button>
    `

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){
  const ids=getGroupedSkis()[length]
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(length){
  const ids=getGroupedSkis()[length]
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=document.getElementById("cart")
  if(!div) return

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  div.innerHTML=cart.length+" skidor valda"
}

/* ========= LAGER ========= */

function getAvailable(ids){

  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    let items=[]
    try{items=JSON.parse(r.items)}catch{}

    items.forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length-booked
}

/* ========= SAVE ========= */

async function saveBooking(){

  try{

    const name=document.getElementById("customer").value
    const start=document.getElementById("start").value
    const end=document.getElementById("end").value

    if(!name||!start||!end||cart.length===0){
      alert("Fyll i allt")
      return
    }

    await supabaseClient.from("rentals").insert({
      name,start,end,
      items:JSON.stringify(cart),
      returned:false
    })

    alert("Sparad")

    cart=[]

    await safeLoadData()
    renderAll()

  }catch(e){
    showError("Kunde inte spara bokning")
  }
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")
  if(!div) return

  if(!skis.length){
    div.innerHTML="Laddar..."
    return
  }

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table style='width:100%'>"

  html+="<tr><th></th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const grouped=getGroupedSkis()

  Object.keys(grouped).forEach(length=>{

    html+=`<tr><td>${length}</td>`

    for(let i=0;i<7;i++){
      html+=`<td>-</td>`
    }

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= BOKNINGAR ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  if(!div) return

  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
      <div style="border:1px solid #ccc;margin:5px;padding:5px">
        ${r.name}
      </div>
    `
  })
}

/* ========= NAV ========= */

function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= DATE ========= */

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
