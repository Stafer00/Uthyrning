console.log("PRO++ STABIL + KALENDER")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* PRISER */
const PRICES = {
  langd:150,
  slalom:200,
  pjaxa:100,
  stav:50,
  hjalm:50,
  pulka:200,
  skin:180,
  tur:180
}

/* STATE */
let skis=[],rentals=[],cart=[],weekOffset=0

/* INIT */
window.onload=init

async function init(){
  await load()
  render()
}

/* LOAD */
async function load(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
}

/* HELP */
function el(id){return document.getElementById(id)}
function parse(x){try{return JSON.parse(x||"[]")}catch{return[]}}

/* RENDER */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderDashboard()
  renderCalendar()
}

/* UTRUSTNING */
function renderWall(){
  const div=el("skiWall")
  div.innerHTML=""

  const types=[...new Set(skis.map(s=>s.type))]

  types.forEach(type=>{
    div.innerHTML+=`<h4>${type.toUpperCase()}</h4>`
    const grid=document.createElement("div")
    grid.className="grid"

    const lengths=[...new Set(
      skis.filter(s=>s.type===type).map(s=>s.length)
    )].sort((a,b)=>a-b)

    lengths.forEach(length=>{
      const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

      const available=getAvailable(ids)
      const selected=getSelected(ids)

      let bg="#c8e6c9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

      grid.innerHTML+=`
        <div class="card" style="background:${bg}">
          <b>${length}</b><br>
          ${available} kvar<br>
          <button onclick="minus('${type}',${length})">−</button>
          ${selected}
          <button onclick="plus('${type}',${length})">+</button>
        </div>
      `
    })

    div.appendChild(grid)
  })
}

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){
  const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(type,length){
  const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  render()
}

/* PRIS */
function calcTotal(){
  let total=0
  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(s) total+=PRICES[s.type]||100
  })
  return total
}

function renderCart(){
  const div=el("cart")
  const totalDiv=el("total")

  if(cart.length===0){
    div.innerHTML="Inga val"
    totalDiv.innerHTML=""
    return
  }

  div.innerHTML=cart.length+" artiklar"
  totalDiv.innerHTML=`<b>${calcTotal()} kr</b>`
}

/* LAGER */
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

/* SAVE */
async function saveBooking(){
  if(!el("customer").value || cart.length===0){
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

  cart=[]
  await load()
  render()
}

/* BOOKINGS */
function renderRentals(){
  const div=el("rentals")
  div.innerHTML=""

  rentals.filter(r=>!r.returned).forEach(r=>{
    div.innerHTML+=`
      <div>
        <b>${r.name}</b><br>
        ${r.start} → ${r.end}
      </div>
    `
  })
}

/* DASHBOARD */
function renderDashboard(){

  const active=rentals.filter(r=>!r.returned)

  let items=0
  active.forEach(r=>items+=parse(r.items).length)

  const capacity=skis.length
  const used=items
  const percent=capacity?Math.round((used/capacity)*100):0

  el("dashboard").innerHTML=`
    Bokningar: ${active.length}<br>
    Artiklar: ${items}<br>
    Beläggning: ${percent}%
  `
}

/* 📅 KALENDER */
function renderCalendar(){

  const div=el("calendar")

  let base=new Date()
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table><tr><th>cm</th>"

  let days=[]

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    days.push(d)
    html+=`<th>${d.getDate()}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))]

  lengths.forEach(l=>{
    const ids=skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td>${l}</td>`

    days.forEach(day=>{

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return

        if(day>=new Date(r.start) && day<=new Date(r.end)){
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

function prevWeek(){weekOffset--;render()}
function nextWeek(){weekOffset++;render()}

/* BUTTON */
document.addEventListener("click",e=>{
  if(e.target.id==="saveBtn"){
    saveBooking()
  }
})
