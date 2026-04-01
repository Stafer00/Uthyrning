console.log("VERSION 1.6.2 SAFE")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "DIN-KEY-HÄR"
)

/* ========= STATE ========= */
let skis=[], rentals=[], filteredRentals=[], cart=[], weekOffset=0

const VALID_TYPES = ["langd","skin","tur","slalom","pjaxa","stav","hjalm","pulka"]

window.onload=init

async function init(){
  try{
    el("saveBtn").onclick=saveBooking
    await loadAll()
    renderAll()
  }catch(e){showError(e)}
}

/* ========= LOAD ========= */
async function loadAll(){

  const skisRes = await supabaseClient.from("skis").select("*")
  const rentRes = await supabaseClient.from("rentals").select("*")

  skis = (skisRes.data || []).map(s=>({
    id: s.id,
    length: Number(s.length) || 0,
    type: VALID_TYPES.includes(s.type) ? s.type : "langd"
  }))

  rentals = rentRes.data || []
  filteredRentals = rentals
}

/* ========= HELP ========= */
function el(id){return document.getElementById(id)}

/* ========= SAFE JSON ========= */
function safeParse(str){
  try{return JSON.parse(str||"[]")}catch{return[]}
}

/* ========= GROUP ========= */
function getTypes(){
  return [...new Set(skis.map(s=>s.type))]
}

function getLengths(type){
  return [...new Set(
    skis.filter(s=>s.type===type).map(s=>s.length)
  )].sort((a,b)=>a-b)
}

function getIds(type,length){
  return skis
    .filter(s=>s.type===type && s.length==length)
    .map(s=>s.id)
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

  const div=el("skiWall")
  if(!div) return

  div.innerHTML=""

  getTypes().forEach(type=>{

    div.innerHTML+=`<h4>${type.toUpperCase()}</h4>`

    const grid=document.createElement("div")
    grid.className="grid"

    getLengths(type).forEach(length=>{

      const ids=getIds(type,length)
      const available=getAvailable(ids)
      const selected=getSelected(ids)

      let bg="#e8f5e9"
      if(available===0) bg="#ffcdd2"
      else if(available<=2) bg="#fff3cd"

      grid.innerHTML+=`
        <div class="card" style="background:${bg}">
          <b>${length}</b><br>
          ${available} kvar<br>
          <button onclick="minus('${type}',${length})">−</button>
          ${selected}
          <button onclick="plus('${type}',${length})">+</button>
        </div>
      `
    })

    div.appendChild(grid)
  })
}

/* ========= CART ========= */
function getSelected(ids){
  return cart.filter(id=>ids.includes(id)).length
}

function plus(type,length){
  const ids=getIds(type,length)
  if(!ids.length) return

  if(getSelected(ids)>=getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(type,length){
  const ids=getIds(type,length)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  renderAll()
}

function renderCart(){
  const div=el("cart")
  if(!div) return

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  const grouped={}

  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    const key=s.type+"_"+s.length
    grouped[key]=(grouped[key]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(k=>{
    const [type,length]=k.split("_")
    html+=`${type} ${length} x ${grouped[k]}<br>`
  })

  div.innerHTML=html
}

/* ========= LAGER ========= */
function getAvailable(ids){
  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    safeParse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length-booked
}

/* ========= SAVE ========= */
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

  let base=getMonday(new Date())
  base.setDate(base.getDate()+weekOffset*7)

  let dates=[]
  let html="<table><tr><th>cm</th>"

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    dates.push(format(d))
    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{

    const ids=skis.filter(s=>s.length==l).map(s=>s.id)
    const total=ids.length

    html+=`<tr><td style="color:black">${l}</td>`

    dates.forEach(day=>{

      let booked=0,out=0,inn=0

      rentals.forEach(r=>{
        if(r.returned) return

        const items=safeParse(r.items)

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
        <td onclick="showDay('${day}')"
        style="background:${bg};color:black">
          ${free}<br>
          ↑${out||""} ↓${inn||""}
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* ========= POPUP ========= */
function showDay(day){

  let html=""

  rentals.forEach(r=>{

    if(r.returned) return

    if(r.start===day || r.end===day){

      html+=`
        <div>
          <b>${r.name}</b><br>
          <button onclick="quickReturn('${r.id}')">Återlämna</button>
        </div>
      `
    }
  })

  alert(html||"Inget")
}

/* ========= RETURN ========= */
async function quickReturn(id){
  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderAll()
}

/* ========= NAV ========= */
function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ========= DATE ========= */
function format(d){return d.toISOString().split("T")[0]}
function getMonday(d){
  d=new Date(d)
  let day=d.getDay()
  let diff=d.getDate()-(day==0?6:day-1)
  return new Date(d.setDate(diff))
}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  document.body.innerHTML+=`<div style="color:red">${e.message}</div>`
}
