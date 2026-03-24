console.log("VERSION 1.3.4")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[], rentals=[], filteredRentals=[], cart=[], weekOffset=0

window.onload=init

async function init(){
  document.getElementById("saveBtn").onclick=saveBooking
  await loadAll()
  renderAll()
}

/* LOAD */
async function loadAll(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
  filteredRentals=rentals
}

/* HELP */
function el(id){return document.getElementById(id)}

/* GROUP SAFE */
function getLengths(){
  const set = new Set()
  skis.forEach(s=>set.add(s.length))
  return Array.from(set).sort((a,b)=>a-b)
}

function getIdsByLength(length){
  return skis.filter(s=>s.length==length).map(s=>s.id)
}

/* RENDER */
function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* SKIDOR */
function renderWall(){
  const div=el("skiWall")
  div.innerHTML=""

  const lengths=getLengths()

  lengths.forEach(l=>{

    const ids=getIdsByLength(l)
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

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(l){
  const ids=getIdsByLength(l)
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(l){
  const ids=getIdsByLength(l)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=el("cart")
  if(cart.length===0){div.innerHTML="Inga val";return}

  const lengths=getLengths()
  let html=""

  lengths.forEach(l=>{
    const ids=getIdsByLength(l)
    const c=getSelected(ids)
    if(c>0) html+=`${l} cm x ${c}<br>`
  })

  div.innerHTML=html
}

/* LAGER */
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

/* SAVE */
async function saveBooking(){
  if(!el("customer").value||!el("start").value||!el("end").value||cart.length===0){
    alert("Fyll i allt");return
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
}

/* CLEAR */
function clearForm(){
  el("customer").value=""
  el("phone").value=""
  el("start").value=""
  el("end").value=""
  cart=[]
  renderAll()
}

/* KALENDER */
function renderWeek(){

  const div=el("calendar")

  const lengths=getLengths()

  if(lengths.length===0){
    div.innerHTML="<b>Inga skidor i lager</b>"
    return
  }

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

  let dates=[]
  let html="<table><tr><th style='width:45px'></th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    const dayStr=format(d)
    dates.push(dayStr)

    html+=`<th>${days[i]}<br>${formatDisplayDate(d)}</th>`
  }

  html+="</tr>"

  lengths.forEach(l=>{

    const ids=getIdsByLength(l)
    const total=ids.length

    html+=`<tr><td><b>${l}</b></td>`

    dates.forEach(day=>{

      let booked=0,out=0,inn=0

      rentals.forEach(r=>{
        if(r.returned) return

        let items=[]
        try{items=JSON.parse(r.items)}catch{}

        if(day>=r.start && day<=r.end){
          items.forEach(id=>{if(ids.includes(id)) booked++})
        }

        if(r.start===day){
          items.forEach(id=>{if(ids.includes(id)) out++})
        }

        if(r.end===day){
          items.forEach(id=>{if(ids.includes(id)) inn++})
        }
      })

      const free=total-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`
        <td onclick="showDayDetails('${day}')"
        style="background:${bg};color:white">
          ${free}<br>
          <span style="color:black;font-weight:bold">↑${out||""}</span>
          <span style="color:black;font-weight:bold;margin-left:4px">↓${inn||""}</span>
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* DATE */
function format(d){return d.toISOString().split("T")[0]}
function formatDisplayDate(d){return d.getDate()+"/"+(d.getMonth()+1)}
function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}
