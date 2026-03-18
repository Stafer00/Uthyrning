alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[]
let weekOffset=0

window.onload=init

async function init(){

  try{

    document.getElementById("saveBtn").onclick=saveBooking

    await loadSkis()
    await loadBookings()

    renderAll()

  }catch(e){
    console.log(e)
    alert("Fel vid start")
  }

}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data,error}=await supabaseClient.from("skis").select("*")
  if(error){
    alert("Fel laddning skidor")
    skis=[]
    return
  }
  skis=data||[]
}

async function loadBookings(){
  const {data}=await supabaseClient.from("rentals").select("*")
  rentals=data||[]
}

/* ========= RENDER ========= */

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
  renderInventory()
}

/* ========= SKIDOR ========= */

function renderWall(){

  const div=document.getElementById("skiWall")
  div.innerHTML=""

  skis.forEach(ski=>{

    const el=document.createElement("button")
    el.innerText=ski.length+" cm"

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
    let ski=skis.find(s=>s.id===id)
    html+=`
    ${ski.length} cm 
    <button onclick="removeItem(${i})">X</button><br>
    `
  })

  div.innerHTML=html
}

function removeItem(i){
  cart.splice(i,1)
  renderCart()
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

  await supabaseClient.from("rentals").insert({
    name,
    phone,
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

  Object.keys(groups).forEach(length=>{
    html+=`${length} cm: ${groups[length]} st<br>`
  })

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

/* ========= NAV ========= */

function prevWeek(){
  weekOffset--
  renderWeek()
}

function nextWeek(){
  weekOffset++
  renderWeek()
}

/* ========= LAGERLOGIK ========= */

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
