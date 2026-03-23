console.log("APP REAL WORKING VERSION")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let filteredRentals=[]
let cart=[]
let weekOffset=0

window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadAll()
  renderAll()
}

async function loadAll(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
  filteredRentals=rentals
}

function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* ========= SKIDOR ========= */

function getGroupedSkis(){
  const m={}
  skis.forEach(s=>{
    if(!m[s.length]) m[s.length]=[]
    m[s.length].push(s.id)
  })
  return m
}

function renderWall(){
  skiWall.innerHTML=""

  const g=getGroupedSkis()

  Object.keys(g).sort((a,b)=>a-b).forEach(l=>{

    const ids=g[l]
    const available=getAvailable(ids)
    const selected=getSelected(ids)

    let bg="#e8f5e9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    skiWall.innerHTML+=`
      <div class="card" style="background:${bg}">
        <b>${l} cm</b><br>
        ${available} kvar<br>
        <button onclick="minus('${l}')">−</button>
        ${selected}
        <button onclick="plus('${l}')">+</button>
      </div>
    `
  })
}

/* ========= CART ========= */

function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(l){
  const ids=getGroupedSkis()[l]
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(l){
  const ids=getGroupedSkis()[l]
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  if(cart.length===0){
    cartDiv.innerHTML="Inga val"
    return
  }

  const g=getGroupedSkis()
  let html=""

  Object.keys(g).forEach(l=>{
    const c=getSelected(g[l])
    if(c>0) html+=`${l} cm x ${c}<br>`
  })

  cartDiv.innerHTML=html
}

/* ========= CLEAR ========= */

function clearForm(){
  customer.value=""
  phone.value=""
  start.value=""
  end.value=""
  cart=[]
  renderAll()
}

/* ========= LAGER ========= */

function getAvailable(ids){
  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return
    let items=[]
    try{items=JSON.parse(r.items)}catch{}
    items.forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length-booked
}

/* ========= SAVE ========= */

async function saveBooking(){

  if(!customer.value||!start.value||!end.value||cart.length===0){
    alert("Fyll i allt")
    return
  }

  await supabaseClient.from("rentals").insert({
    name:customer.value,
    phone:phone.value,
    start:start.value,
    end:end.value,
    items:JSON.stringify(cart),
    returned:false
  })

  clearForm()
  await loadAll()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

  let dates=[]
  let html="<table><tr><th></th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    dates.push(format(d))

    html+=`<th>${days[i]}<br>${d.toISOString().substring(5,10)}</th>`
  }

  html+="</tr>"

  const g=getGroupedSkis()

  Object.keys(g).sort((a,b)=>a-b).forEach(l=>{

    const ids=g[l]
    const total=ids.length

    html+=`<tr><td>${l}</td>`

    dates.forEach(day=>{

      let booked=0,out=0,inn=0

      rentals.forEach(r=>{
        if(r.returned) return

        let items=[]
        try{items=JSON.parse(r.items)}catch{}

        if(day>=r.start && day<=r.end){
          items.forEach(id=>{ if(ids.includes(id)) booked++ })
        }

        if(r.start===day){
          items.forEach(id=>{ if(ids.includes(id)) out++ })
        }

        if(r.end===day){
          items.forEach(id=>{ if(ids.includes(id)) inn++ })
        }
      })

      const free=total-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`
        <td style="background:${bg};color:white">
          ${free}<br>
          <span style="color:#00e676">↑${out||""}</span>
          <span style="color:#40c4ff">↓${inn||""}</span>
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  calendar.innerHTML=html
}

/* ========= BOKNINGAR ========= */

function renderRentals(){

  rentalsDiv.innerHTML=""

  filteredRentals.forEach(r=>{

    if(r.returned) return

    rentalsDiv.innerHTML+=`
      <div style="border:1px solid #ccc;padding:8px;margin:5px">
        <strong>${r.name}</strong><br>
        📞 ${r.phone||""}<br>
        ${r.start} → ${r.end}<br>

        <button onclick="extendBooking('${r.id}')">Förläng</button>
        <button onclick="returnAll('${r.id}')">Återlämna</button>
      </div>
    `
  })
}

/* ========= SÖK ========= */

function filterRentals(){
  const q=search.value.toLowerCase()

  filteredRentals=rentals.filter(r=>
    (r.name||"").toLowerCase().includes(q) ||
    (r.phone||"").toLowerCase().includes(q)
  )

  renderRentals()
}

/* ========= ACTIONS ========= */

async function returnAll(id){
  await supabaseClient.from("rentals").update({returned:true}).eq("id",id)
  await loadAll()
  renderAll()
}

async function extendBooking(id){
  const d=prompt("Nytt slutdatum YYYY-MM-DD")
  if(!d) return
  await supabaseClient.from("rentals").update({end:d}).eq("id",id)
  await loadAll()
  renderAll()
}

/* ========= NAV ========= */

function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= DATE ========= */

function format(d){
  return d.toISOString().split("T")[0]
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
