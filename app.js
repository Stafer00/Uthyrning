alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis = []
let rentals = []
let cart = []
let weekOffset = 0

window.onload = init

async function init(){
  const btn = document.getElementById("saveBtn")
  if(btn) btn.onclick = saveBooking

  await loadSkis()
  await loadBookings()

  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data} = await supabaseClient.from("skis").select("*")
  skis = data || []
}

async function loadBookings(){
  const {data} = await supabaseClient.from("rentals").select("*")
  rentals = data || []
}

/* ========= RENDER ========= */

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= SKIDOR ========= */

function renderWall(){

  const div = document.getElementById("skiWall")
  div.innerHTML=""

  skis.forEach(ski=>{
    const el=document.createElement("div")
    el.innerText = ski.length+" cm"

    el.style.cssText="display:inline-block;padding:10px;margin:5px;border:1px solid #ccc;cursor:pointer"

    el.onclick=()=>{
      cart.push(ski.id)
      renderCart()
    }

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function renderCart(){

  const div=document.getElementById("cart")

  if(cart.length===0){
    div.innerHTML="Inga skidor"
    return
  }

  let html=""

  cart.forEach((id,i)=>{
    const ski=skis.find(s=>s.id===id)
    if(ski){
      html+=`
      ${ski.length} cm 
      <button onclick="removeFromCart(${i})">X</button><br>
      `
    }
  })

  html+=`<br>
  <button onclick="undoLast()">Ångra</button>
  <button onclick="clearCart()">Rensa</button>`

  div.innerHTML=html
}

function removeFromCart(i){
  cart.splice(i,1)
  renderCart()
}

function undoLast(){
  cart.pop()
  renderCart()
}

function clearCart(){
  cart=[]
  renderCart()
}

/* ========= DUBBELBOKNING ========= */

function isBooked(skiId,start,end){

  for(let r of rentals){

    if(r.returned) continue

    if(!(new Date(end)<new Date(r.start)||new Date(start)>new Date(r.end))){

      let items=JSON.parse(r.items||"[]")

      if(items.includes(skiId)){
        return r
      }
    }
  }

  return null
}

/* ========= SAVE ========= */

async function saveBooking(){

  const name=document.getElementById("customer").value
  const start=document.getElementById("start").value
  const end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i alla fält")
    return
  }

  for(let id of cart){
    if(isBooked(id,start,end)){
      alert("En skida är redan bokad")
      return
    }
  }

  await supabaseClient.from("rentals").insert({
    name,
    start,
    end,
    items:JSON.stringify(cart),
    returned:false
  })

  cart=[]

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
  }

  let html="<table><tr><th>Längd</th>"

  dates.forEach(d=>{
    html+="<th>"+d.substring(5)+"</th>"
  })

  html+="</tr>"

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  Object.keys(groups).forEach(length=>{

    html+="<tr><td>"+length+" cm</td>"

    dates.forEach(day=>{

      let total=groups[length].length
      let booked=0

      rentals.forEach(r=>{

        if(r.returned) return

        if(day>=r.start && day<=r.end){

          let items=JSON.parse(r.items||"[]")

          items.forEach(id=>{
            let ski=skis.find(s=>s.id===id)
            if(ski && ski.length==length){
              booked++
            }
          })
        }
      })

      let free=total-booked

      html+= free<=0
        ? "<td style='background:red;color:white'>FULLT</td>"
        : "<td style='background:green;color:white'>"+free+"</td>"

    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= LISTA ========= */

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
      if(ski){
        html+=`
        ${ski.length} cm 
        <button onclick="returnOne('${r.id}',${i})">Returnera</button><br>
        `
      }
    })

    html+=`<br>
    <button onclick="extendBooking('${r.id}')">Förläng</button>
    <button onclick="returnAll('${r.id}')">Allt returnerat</button>
    `

    html+="</div>"

    div.innerHTML+=html
  })
}

/* ========= RETURN DEL ========= */

async function returnOne(rentalId,index){

  let r=rentals.find(x=>x.id==rentalId)

  let items=JSON.parse(r.items||"[]")

  items.splice(index,1)

  if(items.length===0){
    await supabaseClient.from("rentals").update({returned:true}).eq("id",rentalId)
  }else{
    await supabaseClient.from("rentals").update({
      items:JSON.stringify(items)
    }).eq("id",rentalId)
  }

  await loadBookings()
  renderAll()
}

/* ========= RETURN ALL ========= */

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

  let newEnd=prompt("Nytt slutdatum (YYYY-MM-DD)", r.end)

  if(!newEnd) return

  await supabaseClient.from("rentals")
    .update({end:newEnd})
    .eq("id",id)

  await loadBookings()
  renderAll()
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

function format(d){
  return d.toISOString().split("T")[0]
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
