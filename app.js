console.log("SAFE VERSION")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)

let skis=[]
let rentals=[]
let filteredRentals=[]
let cart=[]
let weekOffset=0

window.onload=init

async function init(){
  try{
    document.getElementById("saveBtn").onclick=saveBooking
    await loadAll()
    renderAll()
  }catch(e){
    showError(e)
  }
}

/* LOAD */

async function loadAll(){
  try{
    skis=(await supabaseClient.from("skis").select("*")).data||[]
    rentals=(await supabaseClient.from("rentals").select("*")).data||[]
    filteredRentals=rentals
  }catch(e){ showError(e) }
}

/* SAFE DOM */

function el(id){
  return document.getElementById(id)
}

/* RENDER */

function renderAll(){
  try{
    renderWall()
    renderCart()
    renderWeek()
    renderRentals()
  }catch(e){ showError(e) }
}

/* SKIS */

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

  Object.keys(g).forEach(l=>{
    const ids=g[l]
    div.innerHTML+=`
      <div class="card">
        <b>${l} cm</b><br>
        ${getAvailable(ids)} kvar<br>
        <button onclick="minus('${l}')">−</button>
        ${getSelected(ids)}
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
  try{
    const ids=getGroupedSkis()[l]
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

  div.innerHTML=cart.length+" skidor valda"
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
  try{
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
    div.innerHTML="<div>Kalender laddar...</div>"

    let base=new Date()
    base.setDate(base.getDate()+weekOffset*7)

    div.innerHTML="OK"
  }catch(e){showError(e)}
}

/* BOOKINGS */

function renderRentals(){
  const div=el("rentals")
  if(!div) return

  try{
    div.innerHTML=""

    filteredRentals.forEach(r=>{
      if(r.returned) return
      div.innerHTML+=`<div>${r.name}</div>`
    })
  }catch(e){showError(e)}
}

/* SEARCH */

function filterRentals(){
  const q=el("search").value.toLowerCase()
  filteredRentals=rentals.filter(r=>
    (r.name||"").toLowerCase().includes(q)
  )
  renderRentals()
}

/* NAV */

function prevWeek(){weekOffset--;renderWeek()}
function nextWeek(){weekOffset++;renderWeek()}

/* ERROR */

function showError(e){
  console.error(e)
  document.body.innerHTML+=`<div class="error">${e.message}</div>`
}
