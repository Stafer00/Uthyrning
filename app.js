console.log("APP FINAL WITH COLORS + DOTS")

/* ========= SUPABASE ========= */

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */

let skis = []
let rentals = []
let cart = []
let weekOffset = 0

/* ========= INIT ========= */

window.onload = init

async function init(){
  document.getElementById("saveBtn").onclick = saveBooking
  await loadSkis()
  await loadBookings()
  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const { data } = await supabaseClient.from("skis").select("*")
  skis = data || []
}

async function loadBookings(){
  const { data } = await supabaseClient.from("rentals").select("*")
  rentals = data || []
}

/* ========= GROUP ========= */

function getGroupedSkis(){
  const map = {}
  skis.forEach(s=>{
    if(!map[s.length]) map[s.length] = []
    map[s.length].push(s.id)
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

/* ========= SKIDOR ========= */

function renderWall(){

  const div = document.getElementById("skiWall")
  div.innerHTML = ""

  const grouped = getGroupedSkis()

  Object.keys(grouped).sort((a,b)=>a-b).forEach(length=>{

    const ids = grouped[length]
    const available = getAvailable(ids)
    const selected = getSelected(ids)

    let bg="#e8f5e9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    const el=document.createElement("div")
    el.className="card"
    el.style.background=bg

    el.innerHTML=`
      <strong>${length} cm</strong><br>
      <small>${available} kvar</small><br>
      <button onclick="minus('${length}')">−</button>
      ${selected}
      <button onclick="plus('${length}')">+</button>
    `

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(length){

  const ids=getGroupedSkis()[length]

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])

  renderWall()
  renderCart()
}

function minus(length){

  const ids=getGroupedSkis()[length]

  const index=cart.findIndex(id=>ids.includes(id))
  if(index>-1) cart.splice(index,1)

  renderWall()
  renderCart()
}

function renderCart(){

  const div=document.getElementById("cart")

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  const grouped=getGroupedSkis()
  let html=""

  Object.keys(grouped).forEach(length=>{
    const count=getSelected(grouped[length])
    if(count>0) html+=`${length} cm x ${count}<br>`
  })

  div.innerHTML=html
}

/* ========= CLEAR ========= */

function clearForm(){
  document.getElementById("customer").value=""
  document.getElementById("phone").value=""
  document.getElementById("start").value=""
  document.getElementById("end").value=""
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

  const name=document.getElementById("customer").value
  const phone=document.getElementById("phone").value
  const start=document.getElementById("start").value
  const end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i allt")
    return
  }

  await supabaseClient.from("rentals").insert({
    name, phone, start, end,
    items:JSON.stringify(cart),
    returned:false
  })

  alert("Bokning sparad")

  clearForm()

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let labels=[]
  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

  const today=format(new Date())

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    const dayStr=format(d)
    dates.push(dayStr)

    let label=days[i]+"<br>"+d.toISOString().substring(5,10)

    if(dayStr===today){
      label="<span style='color:#2196f3;font-weight:bold'>"+label+"</span>"
    }

    labels.push(label)
  }

  const weekNumber=getWeekNumber(base)

  let html=`
  <table style="
    width:100%;
    table-layout:fixed;
    border-collapse:collapse;
    font-size:10px;
  ">
  <tr>
    <th style="width:40px">v${weekNumber}</th>
  `

  labels.forEach(l=>html+=`<th style="padding:2px">${l}</th>`)

  html+="</tr>"

  const grouped=getGroupedSkis()

  Object.keys(grouped).sort((a,b)=>a-b).forEach(length=>{

    const ids=grouped[length]
    const total=ids.length

    html+=`<tr><td style="font-size:10px">${length}</td>`

    dates.forEach(day=>{

      let booked=0
      let outCount=0
      let inCount=0

      rentals.forEach(r=>{

        if(r.returned) return

        let items=[]
        try{items=JSON.parse(r.items)}catch{}

        if(day>=r.start && day<=r.end){
          items.forEach(id=>{
            if(ids.includes(id)) booked++
          })
        }

        if(r.start===day){
          items.forEach(id=>{
            if(ids.includes(id)) outCount++
          })
        }

        if(r.end===day){
          items.forEach(id=>{
            if(ids.includes(id)) inCount++
          })
        }

      })

      const free=total-booked

      let bg="#2e7d32"
      if(free===0) bg="#c62828"
      else if(free<=2) bg="#ef6c00"

      html+=`
      <td onclick="showDayDetails('${day}')"
      style="
        background:${bg};
        color:white;
        padding:3px;
        text-align:center;
        font-size:9px;
        border:1px solid rgba(255,255,255,0.2);
      ">
        <div style="font-weight:bold;font-size:12px">${free}</div>

        <div style="font-size:9px">
          ${outCount>0 ? "🟢↑"+outCount : ""}
          ${inCount>0 ? " 🔵↓"+inCount : ""}
        </div>

        <div style="
          width:6px;
          height:6px;
          border-radius:50%;
          margin:2px auto 0;
          background:white;
          opacity:0.8;
        "></div>

      </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= VECKONUMMER ========= */

function getWeekNumber(d){
  d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))
  const dayNum=d.getUTCDay()||7
  d.setUTCDate(d.getUTCDate()+4-dayNum)
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1))
  return Math.ceil((((d-yearStart)/86400000)+1)/7)
}

/* ========= DAG DETALJ ========= */

function showDayDetails(day){

  let outCount=0
  let inCount=0
  let text=""

  rentals.forEach(r=>{

    if(r.returned) return

    let items=[]
    try{items=JSON.parse(r.items)}catch{}

    if(r.start===day){
      outCount+=items.length
      text+=`🟢 UT: ${r.name} (${items.length})\n`
    }

    if(r.end===day){
      inCount+=items.length
      text+=`🔵 IN: ${r.name} (${items.length})\n`
    }
  })

  alert(
    `Datum: ${day}\n\n` +
    `🟢 Ut: ${outCount}\n` +
    `🔵 In: ${inCount}\n\n` +
    (text || "Inga rörelser")
  )
}

/* ========= BOKNINGAR ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{

    if(r.returned) return

    let items=[]
    try{items=JSON.parse(r.items)}catch{}

    const grouped={}

    items.forEach(id=>{
      const ski=skis.find(s=>s.id===id)
      if(!ski) return
      grouped[ski.length]=(grouped[ski.length]||0)+1
    })

    let skisText=""
    Object.keys(grouped).forEach(len=>{
      skisText+=`${len} cm x ${grouped[len]}<br>`
    })

    let controls=""

    Object.keys(grouped).forEach(len=>{
      controls+=`<button onclick="returnOne('${r.id}', ${len})">− ${len}</button>`
    })

    div.innerHTML+=`
      <div style="border:1px solid #ccc;padding:8px;margin:5px">
        <strong>${r.name}</strong><br>
        📞 ${r.phone||""}<br>
        ${r.start} → ${r.end}<br><br>

        ${skisText}

        ${controls}<br>

        <button onclick="extendBooking('${r.id}')">Förläng</button>
        <button onclick="returnAll('${r.id}')">Återlämna allt</button>
      </div>
    `
  })
}

/* ========= RETURN ========= */

async function returnOne(id,length){

  const booking=rentals.find(r=>r.id==id)

  let items=[]
  try{items=JSON.parse(booking.items)}catch{}

  const index=items.findIndex(itemId=>{
    const ski=skis.find(s=>s.id===itemId)
    return ski && ski.length==length
  })

  if(index===-1) return

  items.splice(index,1)

  if(items.length===0){
    await returnAll(id)
    return
  }

  await supabaseClient.from("rentals")
    .update({items:JSON.stringify(items)})
    .eq("id",id)

  await loadBookings()
  renderAll()
}

async function returnAll(id){

  if(!confirm("Återlämna allt?")) return

  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadBookings()
  renderAll()
}

/* ========= EXTEND ========= */

async function extendBooking(id){

  const newEnd=prompt("Nytt slutdatum YYYY-MM-DD")
  if(!newEnd) return

  await supabaseClient.from("rentals")
    .update({end:newEnd})
    .eq("id",id)

  await loadBookings()
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
