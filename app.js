console.log("VERSION 1.6 STABLE FULL")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "DIN_FULLA_KEY_HÄR"
)

/* STATE */
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
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]

  skis=skis.map(s=>({...s,type:s.type||"langd"}))

  filteredRentals=rentals
}

/* HELP */
function el(id){return document.getElementById(id)}

/* GROUP */
function getLengths(){
  return [...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)
}

function getIds(length){
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

  getLengths().forEach(l=>{
    const ids=getIds(l)
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
  const ids=getIds(l)
  if(getSelected(ids)>=getAvailable(ids)) return
  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(l){
  const ids=getIds(l)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=el("cart")
  if(cart.length===0){div.innerHTML="Inga val";return}

  const grouped={}
  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    grouped[s.length]=(grouped[s.length]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(l=>{
    html+=`${l} cm x ${grouped[l]}<br>`
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

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let html="<table style='width:100%;height:100%;table-layout:fixed'><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    const day=format(d)
    dates.push(day)

    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  getLengths().forEach(l=>{

    const ids=getIds(l)
    const total=ids.length

    html+=`<tr><td style="background:#eee;color:black;font-weight:bold">${l}</td>`

    dates.forEach(day=>{

      let booked=0,out=0,inn=0

      rentals.forEach(r=>{
        if(r.returned) return

        let items=[]
        try{items=JSON.parse(r.items||"[]")}catch{}

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
        style="background:${bg};color:black;text-align:center">
          ${free}<br>
          <span style="font-weight:bold">↑${out||""}</span>
          <span style="font-weight:bold;margin-left:4px">↓${inn||""}</span>
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* POPUP */
function showDayDetails(day){

  let html=""

  rentals.forEach(r=>{

    if(r.returned) return

    let items=[]
    try{items=JSON.parse(r.items||"[]")}catch{}

    const grouped={}
    items.forEach(id=>{
      const s=skis.find(x=>x.id===id)
      if(!s) return
      grouped[s.length]=(grouped[s.length]||0)+1
    })

    if(r.start===day || r.end===day){

      let skisHTML=""

      Object.keys(grouped).forEach(l=>{
        skisHTML+=`
          ${l} cm x ${grouped[l]}
          <button onclick="returnOne('${r.id}', ${l})">−</button><br>
        `
      })

      html+=`
        <div style="border:1px solid #ccc;padding:8px;margin-bottom:8px">
          <b>${r.name}</b><br>
          ${skisHTML}
          <button onclick="quickReturn('${r.id}')">Återlämna allt</button>
        </div>
      `
    }

  })

  document.body.insertAdjacentHTML("beforeend",`
    <div id="popup" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6)">
      <div style="background:white;padding:16px;margin:50px auto;width:90%;max-width:400px">
        <h3>${day}</h3>
        ${html||"Inget"}
        <button onclick="closePopup()">Stäng</button>
      </div>
    </div>
  `)
}

function closePopup(){
  document.getElementById("popup")?.remove()
}

/* RETURN */
async function returnOne(id,length){

  const r=rentals.find(x=>x.id==id)
  let items=JSON.parse(r.items||"[]")

  const i=items.findIndex(itemId=>{
    const s=skis.find(x=>x.id===itemId)
    return s && s.length==length
  })

  if(i===-1) return

  items.splice(i,1)

  if(items.length===0){
    await quickReturn(id)
    return
  }

  await supabaseClient.from("rentals")
    .update({items:JSON.stringify(items)})
    .eq("id",id)

  await loadAll()
  renderAll()
  closePopup()
}

async function quickReturn(id){
  if(!confirm("Återlämna allt?")) return

  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderAll()
  closePopup()
}

/* BOKNINGAR */
function renderRentals(){
  const div=el("rentals")
  div.innerHTML=""

  filteredRentals.forEach(r=>{
    if(r.returned) return

    div.innerHTML+=`
      <div style="border:1px solid #ccc;padding:8px;margin:5px">
        <b>${r.name}</b><br>
        📞 ${r.phone||""}<br>
        ${r.start} → ${r.end}<br><br>

        <button onclick="extendBooking('${r.id}')">Förläng</button>
        <button onclick="quickReturn('${r.id}')">Återlämna</button>
      </div>
    `
  })
}

/* EXTEND */
async function extendBooking(id){
  const d=prompt("Nytt slutdatum YYYY-MM-DD")
  if(!d) return

  await supabaseClient.from("rentals")
    .update({end:d})
    .eq("id",id)

  await loadAll()
  renderAll()
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
