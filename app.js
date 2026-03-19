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

/* ========= DROPDOWN ========= */

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
    row.style.cssText="margin:10px;padding:10px;border:1px solid #ccc;border-radius:10px"

    let label=document.createElement("div")
    label.innerHTML=`<strong>${length} cm</strong> (${available} kvar)`

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

    row.appendChild(label)
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

  let html="<strong>Valt:</strong><br>"

  Object.keys(selections).forEach(l=>{
    if(selections[l]>0){
      html+=`${l} cm: ${selections[l]} st<br>`
    }
  })

  html+=`<br><button onclick="clearCart()">Rensa</button>`

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

  cart=[]
  selections={}

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

/* ========= BOKNINGAR ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{

    if(r.returned) return

    let items=JSON.parse(r.items||"[]")

    let html="<div style='border:1px solid #ccc;padding:10px;margin:5px'>"

    html+=`<strong>${r.name}</strong><br>`
    html+=`${r.start} → ${r.end}<br><br>`

    items.forEach((id,i)=>{
      let ski=skis.find(s=>s.id===id)

      html+=`
      ${ski.length} cm 
      <button onclick="returnOne('${r.id}',${i})">X</button><br>
      `
    })

    html+=`
    <br>
    <button onclick="returnAll('${r.id}')">Återlämna alla</button>
    <button onclick="extendBooking('${r.id}')">Förläng</button>
    `

    html+="</div>"

    div.innerHTML+=html
  })
}

/* ========= RETUR ========= */

async function returnOne(id,index){

  let r=rentals.find(x=>x.id==id)
  let items=JSON.parse(r.items||"[]")

  items.splice(index,1)

  if(items.length===0){
    await supabaseClient.from("rentals").update({returned:true}).eq("id",id)
  }else{
    await supabaseClient.from("rentals")
      .update({items:JSON.stringify(items)})
      .eq("id",id)
  }

  await loadBookings()
  renderAll()
}

async function returnAll(id){

  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadBookings()
  renderAll()
}

/* ========= FÖRLÄNG ========= */

async function extendBooking(id){

  let r=rentals.find(x=>x.id==id)

  let ny=prompt("Nytt slutdatum",r.end)

  if(!ny) return

  await supabaseClient.from("rentals")
    .update({end:ny})
    .eq("id",id)

  await loadBookings()
  renderAll()
}

/* ========= LAGER ========= */

function renderInventory(){

  const div=document.getElementById("inventory")
  if(!div) return

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=0
    groups[s.length]++
  })

  let html=""

  Object.keys(groups).forEach(l=>{
    html+=`${l} cm: ${groups[l]} st<br>`
  })

  div.innerHTML=html
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
