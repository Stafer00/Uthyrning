console.log("VERSION 1.5 TYPES")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* STATE */
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

/* GROUP */
function getLengthsByType(type){
  return [...new Set(
    skis.filter(s=>s.type===type).map(s=>s.length)
  )].sort((a,b)=>a-b)
}

function getIds(length,type){
  return skis
    .filter(s=>s.length==length && s.type===type)
    .map(s=>s.id)
}

/* RENDER */
function renderAll(){
  renderWall()
  renderCart()
  renderWeek()
  renderRentals()
}

/* SKIDOR – NU MED TYPER */
function renderWall(){

  const div=el("skiWall")
  div.innerHTML=""

  const types = {
    langd:"🎿 Längdskidor",
    skin:"🟢 Skinskidor",
    tur:"🟠 Turskidor"
  }

  Object.keys(types).forEach(type=>{

    const lengths=getLengthsByType(type)
    if(lengths.length===0) return

    div.innerHTML+=`
      <div style="grid-column:1/-1;font-weight:bold;margin-top:6px">
        ${types[type]}
      </div>
    `

    lengths.forEach(l=>{

      const ids=getIds(l,type)
      const available=getAvailable(ids)
      const selected=getSelected(ids)

      let bg="#e8f5e9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

      div.innerHTML+=`
        <div class="card" style="background:${bg}">
          <b>${l} cm</b><br>
          ${available} kvar<br>
          <button onclick="minus('${l}','${type}')">−</button>
          ${selected}
          <button onclick="plus('${l}','${type}')">+</button>
        </div>
      `
    })
  })
}

/* CART */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(l,type){
  const ids=getIds(l,type)
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(l,type){
  const ids=getIds(l,type)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){

  const div=el("cart")
  if(cart.length===0){div.innerHTML="Inga val";return}

  const grouped={}

  cart.forEach(id=>{
    const ski=skis.find(s=>s.id===id)
    if(!ski) return

    const key=ski.type+"-"+ski.length

    if(!grouped[key]){
      grouped[key]={count:0,length:ski.length,type:ski.type}
    }

    grouped[key].count++
  })

  let html=""

  Object.values(grouped).forEach(item=>{

    let name=""
    if(item.type==="langd") name="Längd"
    if(item.type==="skin") name="Skin"
    if(item.type==="tur") name="Tur"

    html+=`${name} ${item.length} cm x ${item.count}<br>`
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

/* KALENDER (OFÖRÄNDRAD LOGIK) */
function renderWeek(){

  const div=el("calendar")

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  const days=["Mån","Tis","Ons","Tor","Fre","Lör","Sön"]

  let dates=[]
  let html="<table style='width:100%;height:100%;table-layout:fixed'><tr>"

  html+=`<th style="width:60px;text-align:left">cm</th>`

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    const dayStr=format(d)
    dates.push(dayStr)

    html+=`<th>${days[i]}<br>${formatDisplayDate(d)}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{

    const ids=skis.filter(s=>s.length==l).map(s=>s.id)
    const total=ids.length

    html+=`
      <tr>
      <td style="font-weight:bold;background:#f0f0f0;text-align:center;color:black">
        ${l}
      </td>
    `

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
        style="background:${bg};color:white;text-align:center">
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

/* RESTEN = IDENTISKT SOM 1.4.1 */
