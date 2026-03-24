console.log("VERSION 1.5 SAFE")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[], rentals=[], filteredRentals=[], cart=[], weekOffset=0

window.onload=init

async function init(){
  try{
    document.getElementById("saveBtn").onclick=saveBooking
    await loadAll()
    renderAll()
  }catch(e){showError(e)}
}

/* LOAD */
async function loadAll(){
  try{
    skis=(await supabaseClient.from("skis").select("*")).data||[]
    rentals=(await supabaseClient.from("rentals").select("*")).data||[]

    // 🔥 FALLBACK – OM TYPE SAKNAS
    skis = skis.map(s => ({
      ...s,
      type: s.type || "langd"
    }))

    filteredRentals=rentals
  }catch(e){showError(e)}
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
  try{
    renderWall()
    renderCart()
    renderWeek()
    renderRentals()
  }catch(e){showError(e)}
}

/* SKIDOR */
function renderWall(){
  const div=el("skiWall")
  if(!div) return

  div.innerHTML=""

  const types={
    langd:"🎿 Längdskidor",
    skin:"🟢 Skinskidor",
    tur:"🟠 Turskidor"
  }

  Object.keys(types).forEach(type=>{

    const lengths=getLengthsByType(type)
    if(lengths.length===0) return

    div.innerHTML+=`<div style="grid-column:1/-1;font-weight:bold">${types[type]}</div>`

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
  if(!div) return

  if(cart.length===0){div.innerHTML="Inga val";return}

  let html=""

  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    html+=`${s.type} ${s.length} cm<br>`
  })

  div.innerHTML=html
}

/* LAGER */
function getAvailable(ids){
  let booked=0
  rentals.forEach(r=>{
    if(r.returned) return
    try{
      JSON.parse(r.items||"[]").forEach(id=>{
        if(ids.includes(id)) booked++
      })
    }catch{}
  })
  return ids.length-booked
}

/* SAVE */
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
  if(!div) return

  try{

    let base=getMonday(new Date())
    base.setDate(base.getDate()+weekOffset*7)

    let dates=[]
    let html="<table style='width:100%;height:100%'><tr><th>cm</th>"

    for(let i=0;i<7;i++){
      let d=new Date(base)
      d.setDate(base.getDate()+i)
      dates.push(format(d))
      html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
    }

    html+="</tr>"

    const lengths=[...new Set(skis.map(s=>s.length))]

    lengths.forEach(l=>{
      const ids=skis.filter(s=>s.length==l).map(s=>s.id)

      html+=`<tr><td style="color:black">${l}</td>`

      dates.forEach(day=>{

        let booked=0

        rentals.forEach(r=>{
          if(r.returned) return
          try{
            JSON.parse(r.items||"[]").forEach(id=>{
              if(ids.includes(id)) booked++
            })
          }catch{}
        })

        const free=ids.length-booked

        html+=`<td>${free}</td>`
      })

      html+="</tr>"
    })

    html+="</table>"
    div.innerHTML=html

  }catch(e){showError(e)}
}

/* BOKNINGAR */
function renderRentals(){
  const div=el("rentals")
  if(!div) return

  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
      <div style="border:1px solid #ccc;padding:6px;margin:4px">
        ${r.name}<br>
        ${r.start} → ${r.end}
      </div>
    `
  })
}

/* NAV */
function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* DATE */
function format(d){return d.toISOString().split("T")[0]}
function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}

/* ERROR */
function showError(e){
  console.error(e)
  document.body.innerHTML+=`<div style="color:red">${e.message}</div>`
}
