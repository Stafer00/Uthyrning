alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[]
let selections={}

/* ========= INIT ========= */

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
  renderInventory()
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= INVENTORY ADMIN ========= */

function renderInventory(){

  const div=document.getElementById("inventory")
  if(!div) return

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=0
    groups[s.length]++
  })

  let html="<h3>Lager</h3>"

  Object.keys(groups).sort((a,b)=>a-b).forEach(length=>{

    html+=`
    ${length} cm: ${groups[length]} st
    <button onclick="addSki(${length})">+</button>
    <button onclick="removeSki(${length})">−</button>
    <br>
    `
  })

  html+=`
  <br>
  <input id="newLength" placeholder="Ny längd (cm)">
  <button onclick="createNewLength()">Lägg till ny längd</button>
  `

  div.innerHTML=html
}

/* ========= ADD SKI ========= */

async function addSki(length){

  await supabaseClient.from("skis").insert({
    length:parseInt(length)
  })

  await loadSkis()
  renderAll()
}

/* ========= REMOVE SKI ========= */

async function removeSki(length){

  let ski = skis.find(s=>s.length==length)

  if(!ski){
    alert("Finns inga att ta bort")
    return
  }

  // kontroll: ej bokad
  let used=false

  rentals.forEach(r=>{
    let items=[]
    try{items=JSON.parse(r.items||"[]")}catch{}

    if(items.includes(ski.id)){
      used=true
    }
  })

  if(used){
    alert("Skidan är bokad – kan ej tas bort")
    return
  }

  await supabaseClient.from("skis")
    .delete()
    .eq("id",ski.id)

  await loadSkis()
  renderAll()
}

/* ========= NY LÄNGD ========= */

async function createNewLength(){

  let val=document.getElementById("newLength").value

  if(!val){
    alert("Ange längd")
    return
  }

  await supabaseClient.from("skis").insert({
    length:parseInt(val)
  })

  document.getElementById("newLength").value=""

  await loadSkis()
  renderAll()
}

/* ========= SKIDOR ========= */

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

  Object.keys(groups).sort((a,b)=>a-b).forEach(length=>{

    let available=(start&&end)
      ? getAvailableCount(length,start,end)
      : groups[length].length

    let row=document.createElement("div")

    row.innerHTML=`${length} cm (${available} kvar)`

    let select=document.createElement("select")

    for(let i=0;i<=available;i++){
      let opt=document.createElement("option")
      opt.value=i
      opt.text=i+" st"
      select.appendChild(opt)
    }

    select.value=selections[length]||0

    select.onchange=()=>{
      selections[length]=parseInt(select.value)
      buildCart()
      renderCart()
    }

    row.appendChild(select)
    div.appendChild(row)
  })
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

  let html="Valt:<br>"

  Object.keys(selections).forEach(l=>{
    if(selections[l]>0){
      html+=`${l} cm: ${selections[l]} st<br>`
    }
  })

  html+=`<button onclick="clearCart()">Rensa</button>`

  div.innerHTML=html
}

function clearCart(){
  cart=[]
  selections={}
  renderAll()
}

/* ========= SAVE ========= */

async function saveBooking(){

  let name=document.getElementById("customer").value
  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i alla fält")
    return
  }

  await supabaseClient.from("rentals").insert({
    name,
    start,
    end,
    items:JSON.stringify(cart),
    returned:false
  })

  cart=[]
  selections={}

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  let base=getMonday(new Date())

  let html="<table><tr><th>Längd</th><th>Idag</th></tr>"

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  Object.keys(groups).forEach(length=>{

    let free=getAvailableCount(length,formatLocal(new Date()),formatLocal(new Date()))

    html+=`<tr><td>${length}</td><td>${free}</td></tr>`
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= RENTALS ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
    <div>
      <strong>${r.name}</strong><br>
      ${r.start} → ${r.end}
    </div><br>
    `
  })
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
