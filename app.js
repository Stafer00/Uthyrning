console.log("RESET 2.1 CLEAN")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[],rentals=[],cart=[],weekOffset=0

window.onload=init

async function init(){
  bind()
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

function bind(){
  el("saveBtn").onclick=save
}

/* RENDER */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderWeek()
}

/* WALL */
function renderWall(){

  const div = el("skiWall")
  div.innerHTML = ""

  const types = [...new Set(skis.map(s=>s.type))]

  types.forEach(type=>{

    div.innerHTML += `<h4>${type.toUpperCase()}</h4>`

    const grid = document.createElement("div")
    grid.className = "grid"

    const lengths = [...new Set(
      skis.filter(s=>s.type===type).map(s=>s.length)
    )].sort((a,b)=>a-b)

    lengths.forEach(length=>{

      const ids = skis
        .filter(s=>s.type===type && s.length==length)
        .map(s=>s.id)

      const available = getAvailable(ids)
      const selected = getSelected(ids)

      let bg="#c8e6c9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

      grid.innerHTML += `
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
  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  cart.push(ids[0])
  render()
}

function minus(type,length){
  const ids = skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)

  const i = cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)

  render()
}

function renderCart(){
  el("cart").innerHTML=cart.length+" artiklar"
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
async function save(){

  if(!el("customer").value||cart.length===0){
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

/* BOOKINGS */
function renderRentals(){
  el("rentals").innerHTML=rentals.length+" bokningar"
}

/* CALENDAR */
function renderWeek(){

  const div=el("calendar")

  let base=new Date()

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

/* POPUP */
function openDay(text){
  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" onclick="this.remove()">
      <div class="popup-box">
        ${text}
      </div>
    </div>
  `)
}

/* NAV */
function prevWeek(){weekOffset--}
function nextWeek(){weekOffset++}
