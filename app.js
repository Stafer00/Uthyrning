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

  console.log("INIT START")

  try {

    const btn = document.getElementById("saveBtn")
    if(btn) btn.onclick = saveBooking

    await loadSkis()
    await loadBookings()

    renderAll()

  } catch(e){
    console.log("INIT ERROR", e)
  }

}

/* ========= LOAD ========= */

async function loadSkis(){

  try{
    const {data,error} = await supabaseClient.from("skis").select("*")

    if(error){
      console.log("SKIS ERROR", error)
      return
    }

    if(data) skis = data

  }catch(e){
    console.log("LOAD SKIS CRASH", e)
  }

}

async function loadBookings(){

  try{
    const {data,error} = await supabaseClient.from("rentals").select("*")

    if(error){
      console.log("RENTALS ERROR", error)
      return
    }

    if(data) rentals = data

  }catch(e){
    console.log("LOAD BOOKINGS CRASH", e)
  }

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

  skis.forEach(ski=>{

    const el = document.createElement("div")

    el.style.display="inline-block"
    el.style.padding="10px"
    el.style.margin="5px"
    el.style.border="1px solid #ccc"
    el.style.cursor="pointer"

    el.innerText = ski.length+" cm"

    el.onclick = ()=>{
      cart.push(ski.id)
      renderCart()
    }

    div.appendChild(el)

  })

}

/* ========= CART ========= */

function renderCart(){

  const div = document.getElementById("cart")
  if(!div) return

  div.innerHTML = "<strong>Valda:</strong><br>"

  cart.forEach(id=>{
    const ski = skis.find(s=>s.id===id)
    if(ski){
      div.innerHTML += ski.length+" cm<br>"
    }
  })

}

/* ========= DUBBELKOLL ========= */

function isBooked(skiId,start,end){

  for(let r of rentals){

    if(r.returned) continue

    if(!(end < r.start || start > r.end)){

      let items=[]
      try{ items=JSON.parse(r.items) }catch{}

      if(items.includes(skiId)){
        return r
      }
    }
  }

  return null
}

/* ========= SAVE ========= */

async function saveBooking(){

  console.log("SPARAR...")

  try{

    const name=document.getElementById("customer").value
    const phone=document.getElementById("phone").value
    const start=document.getElementById("start").value
    const end=document.getElementById("end").value

    if(!name||!start||!end||cart.length===0){
      alert("Fyll i alla fält")
      return
    }

    // dubbelbokning
    for(let skiId of cart){

      const conflict = isBooked(skiId,start,end)

      if(conflict){
        const ski = skis.find(s=>s.id===skiId)

        alert(
          "Redan bokad:\n"+
          ski.length+" cm\n"+
          conflict.start+" → "+conflict.end
        )
        return
      }
    }

    const {error} = await supabaseClient.from("rentals").insert({
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

    alert("Bokning sparad")

    cart=[]

    await loadBookings()

    renderAll()

  }catch(e){
    console.log("SAVE ERROR", e)
    alert("Fel vid bokning")
  }

}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")
  if(!div) return

  if(!skis.length){
    div.innerHTML="Inga skidor"
    return
  }

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
  }

  let html="<table style='width:100%'><tr><th>Skida</th>"

  dates.forEach(d=>{
    html+="<th>"+d.substring(5)+"</th>"
  })

  html+="</tr>"

  skis.forEach(ski=>{

    html+="<tr><td>"+ski.length+" cm</td>"

    dates.forEach(day=>{

      let booked=false

      rentals.forEach(r=>{
        if(r.returned) return

        if(day>=r.start && day<=r.end){

          let items=[]
          try{items=JSON.parse(r.items)}catch{}

          if(items.includes(ski.id)){
            booked=true
          }
        }
      })

      html+= booked
        ? "<td style='background:#f44336;color:white'>X</td>"
        : "<td style='background:#4caf50;color:white'>Ledig</td>"

    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= LISTA ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  if(!div) return

  div.innerHTML="<h3>Aktiva bokningar</h3>"

  rentals.forEach(r=>{

    if(r.returned) return

    div.innerHTML+=`
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

/* ========= RETURN ========= */

async function returnBooking(id){

  if(!confirm("Markera som återlämnad?")) return

  try{

    const {error} = await supabaseClient
      .from("rentals")
      .update({returned:true})
      .eq("id",id)

    if(error){
      alert(error.message)
      return
    }

    await loadBookings()

    renderAll()

  }catch(e){
    console.log("RETURN ERROR", e)
  }

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
