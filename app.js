console.log("APP PRO START")

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

/* ========= INIT ========= */

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

/* ========= GROUP ========= */

function getGroupedSkis(){

  const map = {}

  skis.forEach(ski=>{
    if(!map[ski.length]){
      map[ski.length] = []
    }
    map[ski.length].push(ski.id)
  })

  return map
}

/* ========= RENDER ========= */

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= SKI WALL (PRO) ========= */

function renderWall(){

  const div = document.getElementById("skiWall")
  if(!div) return

  div.innerHTML = ""

  const grouped = getGroupedSkis()

  Object.keys(grouped)
    .sort((a,b)=>a-b)
    .forEach(length=>{

      const ids = grouped[length]

      const available = getAvailable(ids)
      const selected = getSelected(ids)

      const el = document.createElement("div")
      el.className = "card"

      // 🎨 FÄRG
      let bg = "#e8f5e9" // grön
      if(available === 0) bg = "#ffcdd2"
      else if(available <= 2) bg = "#fff3cd"

      el.style.background = bg

      el.innerHTML = `
        <div><strong>${length} cm</strong></div>
        <div style="font-size:11px">${available} kvar</div>

        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:5px">
          <button onclick="minus('${length}')">−</button>
          <span style="font-size:18px">${selected}</span>
          <button onclick="plus('${length}')">+</button>
        </div>
      `

      div.appendChild(el)
    })
}

/* ========= CART ========= */

function getSelected(ids){
  return cart.filter(id => ids.includes(id)).length
}

function plus(length){

  const grouped = getGroupedSkis()
  const ids = grouped[length]

  if(getSelected(ids) >= getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  const used = getSelected(ids)
  cart.push(ids[used])

  renderWall()
  renderCart()
}

function minus(length){

  const grouped = getGroupedSkis()
  const ids = grouped[length]

  const index = cart.findIndex(id => ids.includes(id))
  if(index > -1){
    cart.splice(index,1)
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

  const grouped = getGroupedSkis()

  let html = ""

  Object.keys(grouped).forEach(length=>{

    const ids = grouped[length]
    const count = getSelected(ids)

    if(count > 0){
      html += `${length} cm x ${count}<br>`
    }
  })

  div.innerHTML = html
}

/* ========= LAGER ========= */

function getAvailable(ids){

  let booked = 0

  rentals.forEach(r=>{

    if(r.returned) return

    let items=[]
    try{items=JSON.parse(r.items)}catch{}

    items.forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length - booked
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

  alert("Bokning sparad")

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

  const grouped = getGroupedSkis()

  Object.keys(grouped).forEach(length=>{

    const ids = grouped[length]

    html += "<tr><td>"+length+"</td>"

    dates.forEach(day=>{

      let booked = false

      rentals.forEach(r=>{
        if(r.returned) return

        if(day >= r.start && day <= r.end){

          let items=[]
          try{items=JSON.parse(r.items)}catch{}

          items.forEach(id=>{
            if(ids.includes(id)) booked = true
          })
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
