console.log("APP 2.3 PRO STABIL")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let cart = []
let weekOffset = 0

/* ========= PRISER ========= */
const PRICES = {
  langd: {1:100,2:150,3:200,4:230,5:270,7:300},
  slalom: {1:190,2:270,3:360,4:410,5:460,7:520},
  pjaxa: {1:130,2:180,3:240,4:280,5:300,7:330},
  stav: {1:50,2:70,3:90,4:110,5:140,7:150},
  hjalm: {1:40,2:60,3:80,4:100,5:120,7:140},
  pulka: {1:310,2:420,3:540,4:650,5:750,7:800}
}

/* ========= INIT ========= */
window.onload = init

async function init(){
  bind()
  await load()
  render()
}

/* ========= BIND ========= */
function bind(){
  if(el("saveBtn")) el("saveBtn").onclick = save
}

/* ========= LOAD ========= */
async function load(){
  const {data: s} = await supabaseClient.from("skis").select("*")
  const {data: r} = await supabaseClient.from("rentals").select("*")

  skis = s || []
  rentals = r || []
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }
function parse(x){ try{return JSON.parse(x||"[]")}catch{return[]} }

/* ========= DAYS ========= */
function getDays(){
  const s = el("start").value
  const e = el("end").value

  if(!s || !e) return 1

  const d1 = new Date(s)
  const d2 = new Date(e)

  const diff = Math.ceil((d2-d1)/(1000*60*60*24))+1

  if(diff<=1) return 1
  if(diff<=2) return 2
  if(diff<=3) return 3
  if(diff<=4) return 4
  if(diff<=5) return 5
  return 7
}

/* ========= PRICE ========= */
function getPrice(type){
  const d = getDays()
  return PRICES[type]?.[d] || 0
}

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderCalendar()
}

/* ========= WALL ========= */
function renderWall(){

  const div = el("skiWall")
  if(!div) return

  div.innerHTML=""

  const types = [...new Set(skis.map(s=>s.type))]

  types.forEach(type=>{

    div.innerHTML += `<h4>${type.toUpperCase()}</h4>`

    const grid = document.createElement("div")
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

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){
  const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut")
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

/* ========= CART VIEW ========= */
function renderCart(){

  const div=el("cart")
  const totalDiv=el("total")

  if(!div) return

  if(cart.length===0){
    div.innerHTML="Inga val"
    if(totalDiv) totalDiv.innerHTML=""
    return
  }

  let total=0
  let html=""

  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return

    total+=getPrice(s.type)
    html+=`${s.type} ${s.length}<br>`
  })

  div.innerHTML=html

  if(totalDiv){
    totalDiv.innerHTML=`<b>${total} kr</b>`
  }
}

/* ========= LAGER ========= */
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

/* ========= SAVE ========= */
async function save(){

  if(!el("customer").value || cart.length===0){
    alert("Fyll i")
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

/* ========= BOOKINGS ========= */
function renderRentals(){
  const div=el("rentals")
  if(!div) return
  div.innerHTML=rentals.length+" bokningar"
}

/* ========= KALENDER ========= */
function renderCalendar(){

  const div=el("calendar")
  if(!div) return

  let html="<table><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    html+=`<th>${i+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))]

  lengths.forEach(l=>{
    html+=`<tr><td>${l}</td>`
    for(let i=0;i<7;i++){
      html+=`<td onclick="openDay('${l}')">OK</td>`
    }
    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= POPUP ========= */
function openDay(text){
  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" onclick="this.remove()">
      <div class="popup-box">
        ${text}
      </div>
    </div>
  `)
}
