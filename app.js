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

  try{

    const btn = document.getElementById("saveBtn")
    if(btn) btn.onclick = saveBooking

    await loadSkis()
    await loadBookings()

    renderAll()

  }catch(e){
    console.log("INIT ERROR", e)
  }
}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data,error} = await supabaseClient.from("skis").select("*")
  if(!error && data) skis = data
}

async function loadBookings(){
  const {data,error} = await supabaseClient.from("rentals").select("*")
  if(!error && data) rentals = data
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

  if(cart.length === 0){
    div.innerHTML = "<strong>Valda:</strong><br>Inga skidor"
    return
  }

  let html = "<strong>Valda:</strong><br>"

  cart.forEach((id,index)=>{
    const ski = skis.find(s=>s.id===id)

    if(ski){
      html += `
      <div>
        ${ski.length} cm
        <button onclick="removeFromCart(${index})"
          style="margin-left:10px;background:#f44336;color:white;border:none">
          X
        </button>
      </div>
      `
    }
  })

  html += `
    <br>
    <button onclick="undoLast()">Ångra senaste</button>
    <button onclick="clearCart()">Rensa alla</button>
  `

  div.innerHTML = html
}

function removeFromCart(index){
  cart.splice(index,1)
  renderCart()
}

function clearCart(){
  if(confirm("Rensa alla?")){
    cart=[]
    renderCart()
  }
}

function undoLast(){
  cart.pop()
  renderCart()
}

/* ========= DUBBELKOLL ========= */

function isBooked(skiId,start,end){

  for(let r of rentals){

    if(r.returned) continue

    if(!(new Date(end) < new Date(r.start) || new Date(start) > new Date(r.end))){

      let items=[]
      try{ items=JSON.parse(r.items || "[]") }catch{}

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
  const phone=document.getElementById("phone").value
  const start=document.getElementById("start").value
  const end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i alla fält")
    return
  }

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

  let html="<table style='width:100%'><tr><th>Längd</th>"

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

    html+="<tr><td><strong>"+length+" cm</strong></td>"

    dates.forEach(day=>{

      let total = groups[length].length
      let bookedCount = 0

      rentals.forEach(r=>{

        if(r.returned) return

        if(new Date(day) >= new Date(r.start) && new Date(day) <= new Date(r.end)){

          let items=[]
          try{items=JSON.parse(r.items || "[]")}catch{}

          items.forEach(id=>{
            let ski = skis.find(s=>s.id===id)
            if(ski && ski.length == length){
              bookedCount++
            }
          })
        }
      })

      let free = total - bookedCount

      if(free <= 0){
        html += `<td style="background:#f44336;color:white">FULLT</td>`
      }else{
        html += `<td style="background:#4caf50;color:white">${free} kvar</td>`
      }

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

      <button onclick="returnBooking('${r.id}')">
        Returnerad
      </button>
    </div>
    `
  })
}

/* ========= RETURN ========= */

async function returnBooking(id){

  if(!confirm("Markera som återlämnad?")) return

  await supabaseClient
    .from("rentals")
    .update({returned:true})
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
