console.log("APP FINAL CLEAN STABLE")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let filteredRentals=[]
let cart=[]
let weekOffset=0

window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadAll()
  renderAll()
}

async function loadAll(){
  const s=await supabaseClient.from("skis").select("*")
  skis=s.data||[]

  const r=await supabaseClient.from("rentals").select("*")
  rentals=r.data||[]
  filteredRentals=rentals
}

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* SKIDOR */

function getGroupedSkis(){
  const m={}
  skis.forEach(s=>{
    if(!m[s.length]) m[s.length]=[]
    m[s.length].push(s.id)
  })
  return m
}

function renderWall(){
  const div=document.getElementById("skiWall")
  div.innerHTML=""

  const g=getGroupedSkis()

  Object.keys(g).sort((a,b)=>a-b).forEach(l=>{
    const ids=g[l]
    const el=document.createElement("div")
    el.className="card"

    el.innerHTML=`
      <b>${l} cm</b><br>
      ${getAvailable(ids)} kvar<br>
      <button onclick="minus('${l}')">−</button>
      ${getSelected(ids)}
      <button onclick="plus('${l}')">+</button>
    `
    div.appendChild(el)
  })
}

function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(l){
  const ids=getGroupedSkis()[l]
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(l){
  const ids=getGroupedSkis()[l]
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  document.getElementById("cart").innerHTML =
    cart.length ? cart.length+" skidor valda" : "Inga val"
}

/* LAGER */

function getAvailable(ids){
  let booked=0
  rentals.forEach(r=>{
    if(r.returned) return
    let items=[]
    try{items=JSON.parse(r.items)}catch{}
    items.forEach(id=>{ if(ids.includes(id)) booked++ })
  })
  return ids.length-booked
}

/* SAVE */

async function saveBooking(){
  const name=customer.value
  const phone=phoneInput?.value || ""
  const start=startInput.value
  const end=endInput.value

  if(!name||!start||!end||!cart.length){
    alert("Fyll i allt")
    return
  }

  await supabaseClient.from("rentals").insert({
    name,phone,start,end,
    items:JSON.stringify(cart),
    returned:false
  })

  cart=[]
  await loadAll()
  renderAll()
}

/* KALENDER */

function renderWeek(){

  const div=document.getElementById("calendar")

  let base=new Date()
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table><tr><th></th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const g=getGroupedSkis()

  Object.keys(g).forEach(l=>{
    html+=`<tr><td>${l}</td>`
    for(let i=0;i<7;i++){
      html+=`<td>-</td>`
    }
    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* BOKNINGAR */

function renderRentals(){
  const div=document.getElementById("rentals")
  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return
    div.innerHTML+=`<div>${r.name}</div>`
  })
}

/* SÖK */

function filterRentals(){
  const q=search.value.toLowerCase()
  filteredRentals=rentals.filter(r=>
    (r.name||"").toLowerCase().includes(q) ||
    (r.phone||"").toLowerCase().includes(q)
  )
  renderRentals()
}

/* NAV */

function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}
