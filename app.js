console.log("VERSION 1.3")

/* ========= SUPABASE ========= */

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= STATE ========= */

let skis=[]
let rentals=[]
let filteredRentals=[]
let cart=[]
let weekOffset=0

window.onload=init

/* ========= INIT ========= */

async function init(){
  try{
    document.getElementById("saveBtn").onclick=saveBooking
    await loadAll()
    renderAll()
  }catch(e){showError(e)}
}

/* ========= LOAD ========= */

async function loadAll(){
  try{
    skis=(await supabaseClient.from("skis").select("*")).data||[]
    rentals=(await supabaseClient.from("rentals").select("*")).data||[]
    filteredRentals=rentals
  }catch(e){showError(e)}
}

/* ========= HELP ========= */

function el(id){return document.getElementById(id)}

/* ========= RENDER ========= */

function renderAll(){
  try{
    renderWall()
    renderCart()
    renderWeek()
    renderRentals()
  }catch(e){showError(e)}
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
  const div=el("skiWall")
  if(!div) return

  div.innerHTML=""

  const g=getGroupedSkis()

  Object.keys(g).sort((a,b)=>a-b).forEach(l=>{

    const ids=g[l]
    const available=getAvailable(ids)
    const selected=getSelected(ids)

    let bg="#e8f5e9"
    if(available===0) bg="#ffcdd2"
    else if(available<=2) bg="#fff3cd"

    div.innerHTML+=`
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
  try{
    const ids=getGroupedSkis()[l]
    if(getSelected(ids)>=getAvailable(ids)) return
    cart.push(ids[getSelected(ids)])
    renderAll()
  }catch(e){showError(e)}
}

function minus(l){
  try{
    const ids=getGroupedSkis()[l]
    const i=cart.findIndex(id=>ids.includes(id))
    if(i>-1) cart.splice(i,1)
    renderAll()
  }catch(e){showError(e)}
}

function renderCart(){
  const div=el("cart")
  if(!div) return

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  const g=getGroupedSkis()
  let html=""

  Object.keys(g).forEach(l=>{
    const c=getSelected(g[l])
    if(c>0) html+=`${l} cm x ${c}<br>`
  })

  div.innerHTML=html
}

/* ========= LAGER ========= */

function getAvailable(ids){
  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return
    try{
      JSON.parse(r.items).forEach(id=>{
        if(ids.includes(id)) booked++
      })
    }catch{}
  })

  return ids.length-booked
}

/* ========= SAVE ========= */

async function saveBooking(){
  try{
    if(!el("customer").value||!el("start").value||!el("end").value||cart.length===0){
      alert("Fyll i allt")
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

    clearForm()
    await loadAll()
    renderAll()

  }catch(e){showError(e)}
}

/* ========= CLEAR ========= */

function clearForm(){
  el("customer").value=""
  el("phone").value=""
  el("start").value=""
  el("end").value=""
  cart=[]
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=el("calendar")
  if(!div) return

  try{

    let base=getMonday(new Date())
    base.setDate(base.getDate()+weekOffset*7)

    const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

    let dates=[]
    let html="<table><tr><th></th>"

    for(let i=0;i<7;i++){
      let d=new Date(base)
      d.setDate(base.getDate()+i)

      const dayStr=format(d)
      dates.push(dayStr)

      html+=`<th>${days[i]}<br>${formatDisplayDate(d)}</th>`
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
          <td onclick="showDayDetails('${day}')"
          style="background:${bg};color:white;cursor:pointer">
            ${free}<br>
            <span style="color:#00e676">↑${out||""}</span>
            <span style="color:#40c4ff">↓${inn||""}</span>
          </td>
        `
      })

      html+="</tr>"
    })

    html+="</table>"

    div.innerHTML=html

  }catch(e){showError(e)}
}

/* ========= POPUP ========= */

function showDayDetails(day){

  let outHTML=""
  let inHTML=""

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

    if(r.start===day){
      outHTML+=`
        <div style="margin-bottom:8px">
          🟢 ${r.name} (${items.length})
        </div>
      `
    }

    if(r.end===day){

      let skisHTML=""

      Object.keys(grouped).forEach(len=>{
        skisHTML+=`
          ${len} cm x ${grouped[len]}
          <button onclick="returnOne('${r.id}', ${len})">−</button><br>
        `
      })

      inHTML+=`
        <div style="margin-bottom:12px;border-bottom:1px solid #ccc;padding-bottom:6px">
          🔵 ${r.name}<br><br>

          ${skisHTML}

          <button onclick="quickReturn('${r.id}')">
            Återlämna allt
          </button>
        </div>
      `
    }

  })

  let html = `
    <div id="popup" style="
      position:fixed;
      top:0;left:0;
      width:100%;height:100%;
      background:rgba(0,0,0,0.6);
      display:flex;
      justify-content:center;
      align-items:center;
      z-index:999;
    ">

      <div style="
        background:white;
        padding:20px;
        border-radius:10px;
        max-width:420px;
        width:90%;
        max-height:80%;
        overflow:auto;
      ">

        <h3>${day}</h3>

        <b>🟢 Ut</b><br>
        ${outHTML || "Inga"}<br><br>

        <b>🔵 In</b><br>
        ${inHTML || "Inga"}<br><br>

        <button onclick="closePopup()">Stäng</button>

      </div>
    </div>
  `

  document.body.insertAdjacentHTML("beforeend", html)
}

function closePopup(){
  const p=document.getElementById("popup")
  if(p) p.remove()
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
    await quickReturn(id)
    return
  }

  await supabaseClient
    .from("rentals")
    .update({items:JSON.stringify(items)})
    .eq("id",id)

  await loadAll()
  renderAll()

  closePopup()
}

async function quickReturn(id){

  if(!confirm("Återlämna hela bokningen?")) return

  await supabaseClient
    .from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderAll()

  closePopup()
}

/* ========= BOKNINGAR ========= */

function renderRentals(){

  const div=el("rentals")
  if(!div) return

  try{

    div.innerHTML=""

    filteredRentals.forEach(r=>{

      if(r.returned) return

      div.innerHTML+=`
        <div style="border:1px solid #ccc;padding:8px;margin:5px">
          <strong>${r.name}</strong><br>
          📞 ${r.phone||""}<br>
          ${r.start} → ${r.end}<br>

          <button onclick="extendBooking('${r.id}')">Förläng</button>
          <button onclick="returnAll('${r.id}')">Återlämna</button>
        </div>
      `
    })

  }catch(e){showError(e)}
}

/* ========= SÖK ========= */

function filterRentals(){
  const q=el("search").value.toLowerCase()

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

function formatDisplayDate(d){
  return d.getDate()+"/"+(d.getMonth()+1)
}

function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}

/* ========= ERROR ========= */

function showError(e){
  console.error(e)
  document.body.insertAdjacentHTML("beforeend",
    `<div style="color:red">${e.message}</div>`
  )
}
