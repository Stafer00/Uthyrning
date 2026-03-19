console.log("APP STARTAR")

/* ========= SUPABASE ========= */

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= DATA ========= */

let skis = []
let rentals = []
let cart = []
let weekOffset = 0

/* ========= START ========= */

window.onload = init

async function init(){

  console.log("INIT")

  const btn = document.getElementById("saveBtn")
  if(btn) btn.onclick = saveBooking

  await loadSkis()
  await loadBookings()

  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const { data, error } = await supabaseClient.from("skis").select("*")
  if(error){
    console.log(error)
    skis = []
    return
  }
  skis = data || []
}

async function loadBookings(){
  const { data, error } = await supabaseClient.from("rentals").select("*")
  if(error){
    console.log(error)
    rentals = []
    return
  }
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
  if(!div) return

  div.innerHTML = ""

  skis.forEach(ski => {

    const el = document.createElement("div")
    el.className = "card"

    el.innerHTML = `
      <div><strong>${ski.length} cm</strong></div>
      <div style="font-size:11px">${getAvailable(ski.id)} kvar</div>

      <div class="controls">
        <button onclick="removeFromCart(${ski.id})">−</button>
        <span class="count">${getCount(ski.id)}</span>
        <button onclick="addToCart(${ski.id})">+</button>
      </div>
    `

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function getCount(id){
  return cart.filter(x => x === id).length
}

function addToCart(id){

  if(getAvailable(id) <= getCount(id)){
    alert("Finns inte fler")
    return
  }

  cart.push(id)
  renderWall()
  renderCart()
}

function removeFromCart(id){
  const i = cart.indexOf(id)
  if(i > -1){
    cart.splice(i,1)
  }
  renderWall()
  renderCart()
}

function renderCart(){

  const div = document.getElementById("cart")
  if(!div) return

  if(cart.length === 0){
    div.innerHTML = "Inga val"
    return
  }

  let html = ""

  const grouped = {}

  cart.forEach(id=>{
    grouped[id] = (grouped[id] || 0) + 1
  })

  Object.keys(grouped).forEach(id=>{
    const ski = skis.find(s=>s.id == id)
    if(ski){
      html += `${ski.length} cm x ${grouped[id]}<br>`
    }
  })

  div.innerHTML = html
}

/* ========= LAGER ========= */

function getAvailable(skiId){

  let total = skis.filter(s => s.id === skiId).length

  let booked = 0

  rentals.forEach(r=>{

    if(r.returned) return

    let items=[]
    try{ items = JSON.parse(r.items) }catch{}

    items.forEach(id=>{
      if(id === skiId) booked++
    })
  })

  return total - booked
}

/* ========= SAVE ========= */

async function saveBooking(){

  const name = document.getElementById("customer").value
  const phone = document.getElementById("phone").value
  const start = document.getElementById("start").value
  const end = document.getElementById("end").value

  if(!name || !start || !end || cart.length === 0){
    alert("Fyll i allt")
    return
  }

  const { error } = await supabaseClient.from("rentals").insert({
    name,
    phone,
    start,
    end,
    items: JSON.stringify(cart),
    returned:false
  })

  if(error){
    alert(error.message)
    return
  }

  alert("Sparad")

  cart = []

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div = document.getElementById("calendar")
  if(!div) return

  if(!skis.length){
    div.innerHTML = "Inga skidor"
    return
  }

  let base = getMonday(new Date())
  base.setDate(base.getDate() + weekOffset*7)

  let dates = []
  for(let i=0;i<7;i++){
    let d = new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
  }

  let html = "<table border='1'><tr><th>Längd</th>"

  dates.forEach(d=>{
    html += "<th>"+d.substring(5)+"</th>"
  })

  html += "</tr>"

  skis.forEach(ski=>{

    html += "<tr><td>"+ski.length+"</td>"

    dates.forEach(day=>{

      let booked = false

      rentals.forEach(r=>{

        if(r.returned) return

        if(day >= r.start && day <= r.end){

          let items=[]
          try{items=JSON.parse(r.items)}catch{}

          if(items.includes(ski.id)){
            booked = true
          }
        }
      })

      html += booked
        ? "<td style='background:#f44336;color:white'>X</td>"
        : "<td style='background:#4caf50;color:white'>Ledig</td>"

    })

    html += "</tr>"
  })

  html += "</table>"

  div.innerHTML = html
}

/* ========= LISTA ========= */

function renderRentals(){

  const div = document.getElementById("rentals")
  if(!div) return

  div.innerHTML = ""

  rentals.forEach(r=>{

    if(r.returned) return

    div.innerHTML += `
      <div style="border:1px solid #ccc;padding:8px;margin:5px">
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

function format(d){
  return d.toISOString().split("T")[0]
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
