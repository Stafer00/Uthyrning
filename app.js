alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[] // sparar IDs
let selections={} // {length: antal}

/* ========= INIT ========= */

window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadSkis()
  await loadBookings()
  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data}=await supabaseClient.from("skis").select("*")
  skis=data||[]
}

async function loadBookings(){
  const {data}=await supabaseClient.from("rentals").select("*")
  rentals=data||[]
}

/* ========= LAGER ========= */

function getAvailableCount(length,start,end){

  let total = skis.filter(s=>s.length==length).length
  let booked = 0

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

  return total - booked
}

/* ========= RENDER ========= */

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= SKIDOR (DROPDOWN) ========= */

function renderWall(){

  const div=document.getElementById("skiWall")
  div.innerHTML=""

  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  Object.keys(groups).sort((a,b)=>a-b).forEach(length=>{

    let available = (start && end)
      ? getAvailableCount(length,start,end)
      : groups[length].length

    let row=document.createElement("div")
    row.style.margin="10px"
    row.style.padding="10px"
    row.style.border="1px solid #ccc"
    row.style.borderRadius="10px"

    let label=document.createElement("div")
    label.innerHTML=`<strong>${length} cm</strong> (${available} kvar)`

    let select=document.createElement("select")
    select.style.fontSize="18px"
    select.style.padding="8px"

    let max=Math.max(available,0)

    for(let i=0;i<=max;i++){
      let opt=document.createElement("option")
      opt.value=i
      opt.text=i+" st"
      select.appendChild(opt)
    }

    select.value = selections[length] || 0

    select.onchange=()=>{
      selections[length]=parseInt(select.value)
      buildCartFromSelections()
      renderCart()
    }

    row.appendChild(label)
    row.appendChild(select)

    div.appendChild(row)
  })
}

/* ========= BUILD CART ========= */

function buildCartFromSelections(){

  cart=[]

  Object.keys(selections).forEach(length=>{

    let count=selections[length]

    let skisOfLength=skis.filter(s=>s.length==length)

    for(let i=0;i<count;i++){
      if(skisOfLength[i]){
        cart.push(skisOfLength[i].id)
      }
    }
  })
}

/* ========= CART ========= */

function renderCart(){

  const div=document.getElementById("cart")

  if(cart.length===0){
    div.innerHTML="Inga skidor"
    return
  }

  let html="<strong>Valt:</strong><br>"

  Object.keys(selections).forEach(length=>{
    if(selections[length]>0){
      html+=`${length} cm: ${selections[length]} st<br>`
    }
  })

  html+=`<br><button onclick="clearCart()">Rensa</button>`

  div.innerHTML=html
}

function clearCart(){
  cart=[]
  selections={}
  renderAll()
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

  const {error}=await supabaseClient.from("rentals").insert({
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

  cart=[]
  selections={}

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  let base=getMonday(new Date())

  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

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

    html+=`<tr><td>${length}</td>`

    dates.forEach(d=>{
      let free=getAvailableCount(length,format(d),format(d))
      html+=`<td>${free}</td>`
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

    let lengths={}

    items.forEach(id=>{
      let ski=skis.find(s=>s.id===id)
      if(ski){
        lengths[ski.length]=(lengths[ski.length]||0)+1
      }
    })

    Object.keys(lengths).forEach(l=>{
      html+=`${l} cm: ${lengths[l]} st<br>`
    })

    html+="</div>"

    div.innerHTML+=html
  })
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
