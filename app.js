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

  console.log("INIT")

  const btn = document.getElementById("saveBtn")
  if(btn) btn.onclick = saveBooking

  await loadSkis()
  await loadBookings()

  renderWall()
  renderCart()
  renderWeek()
  renderRentals()

}

/* ========= LOAD ========= */

async function loadSkis(){

  const {data,error} = await supabaseClient.from("skis").select("*")

  if(error){
    console.log(error)
    skis = []
    return
  }

  skis = data || []

}

async function loadBookings(){

  const {data,error} = await supabaseClient.from("rentals").select("*")

  if(error){
    console.log(error)
    rentals = []
    return
  }

  rentals = data || []

}

/* ========= SKIDOR ========= */

function renderWall(){

  const div = document.getElementById("skiWall")
  if(!div) return

  div.innerHTML = ""

  skis.forEach(ski=>{

    const el = document.createElement("div")

    el.style.display = "inline-block"
    el.style.padding = "10px"
    el.style.margin = "5px"
    el.style.border = "1px solid #ccc"
    el.style.cursor = "pointer"

    el.innerText = ski.length + " cm"

    el.onclick = ()=>{
      cart.push(ski.id)
      renderCart()
    }

    div.appendChild(el)

  })

}

/* ========= KORG ========= */

function renderCart(){

  const div = document.getElementById("cart")
  if(!div) return

  div.innerHTML = "<strong>Valda skidor:</strong><br>"

  cart.forEach(id=>{
    const ski = skis.find(s=>s.id===id)
    if(ski){
      div.innerHTML += ski.length + " cm<br>"
    }
  })

}

/* ========= SPARA ========= */

async function saveBooking(){

  const name = document.getElementById("customer").value
  const phone = document.getElementById("phone").value
  const start = document.getElementById("start").value
  const end = document.getElementById("end").value

  if(!name || !start || !end || cart.length===0){
    alert("Fyll i alla fält")
    return
  }

  const {error} = await supabaseClient.from("rentals").insert({
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
  renderCart()

  await loadBookings()

  renderWeek()
  renderRentals()

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
  base.setDate(base.getDate() + weekOffset * 7)

  let dates = []

  for(let i=0;i<7;i++){
    let d = new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
  }

  let html = "<table style='width:100%; border-collapse:collapse'>"

  html += "<tr><th>Skida</th>"

  dates.forEach(d=>{
    html += "<th>" + d.substring(5) + "</th>"
  })

  html += "</tr>"

  skis.forEach(ski=>{

    html += "<tr><td>"+ski.length+" cm</td>"

    dates.forEach(day=>{

      let booked = false
      let booking = null

      rentals.forEach(r=>{

        if(r.returned) return

        if(day >= r.start && day <= r.end){

          let items = []
          try{ items = JSON.parse(r.items) }catch{}

          if(items.includes(ski.id)){
            booked = true
            booking = r
          }

        }

      })

      if(booked){

        html += `<td style="background:#f44336;color:white;cursor:pointer"
          onclick="showBooking('${booking.id}')">X</td>`

      }else{

        html += `<td style="background:#4caf50;color:white">Ledig</td>`

      }

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

  div.innerHTML = "<h3>Aktiva bokningar</h3>"

  rentals.forEach(r=>{

    if(r.returned) return

    div.innerHTML += `
    <div style="border:1px solid #ccc;padding:10px;margin:5px">
      <strong>${r.name}</strong><br>
      ${r.phone}<br>
      ${r.start} → ${r.end}<br><br>

      <button onclick="returnBooking('${r.id}')"
        style="background:#2196f3;color:white;padding:8px;border:none;border-radius:6px">
        Returnerad
      </button>
    </div>
    `

  })

}

/* ========= RETURNERA ========= */

async function returnBooking(id){

  const ok = confirm("Markera som återlämnad?")
  if(!ok) return

  const {error} = await supabaseClient
    .from("rentals")
    .update({returned:true})
    .eq("id", id)

  if(error){
    alert(error.message)
    return
  }

  await loadBookings()

  renderWeek()
  renderRentals()

}

/* ========= POPUP ========= */

function showBooking(id){

  const r = rentals.find(x=>x.id==id)
  if(!r) return

  alert(
    "Namn: " + r.name + "\n" +
    "Telefon: " + (r.phone||"") + "\n" +
    "Datum: " + r.start + " → " + r.end
  )

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
  d = new Date(d)
  let day = d.getDay()
  let diff = d.getDate() - (day==0?6:day-1)
  return new Date(d.setDate(diff))
}
