console.log("VERSION 1.6.4 STABLE UI FIX")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "DIN-ANON-KEY-HÄR"
)

/* ========= STATE ========= */
let skis = []
let rentals = []
let filteredRentals = []
let cart = []
let activeType = null

const VALID_TYPES = ["langd","skin","tur","slalom","pjaxa","stav","hjalm","pulka"]

window.onload = init

/* ========= INIT ========= */
async function init(){
  try{
    el("saveBtn").onclick = saveBooking

    if(el("search")){
      el("search").oninput = filterRentals
    }

    await loadAll()
    filteredRentals = rentals

    renderAll()

  }catch(e){
    showError(e)
  }
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
}

/* ========= HELP ========= */
function el(id){ return document.getElementById(id) }

function safeParse(str){
  try{return JSON.parse(str||"[]")}catch{return[]}
}

/* ========= FILTER ========= */
function filterRentals(){

  const q = (el("search")?.value || "").toLowerCase()

  filteredRentals = rentals.filter(r =>
    (r.name || "").toLowerCase().includes(q) ||
    (r.phone || "").includes(q)
  )

  renderRentals()
}

/* ========= TYPE FILTER ========= */
function setType(type){
  activeType = type
  renderWall()
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
  renderRentals()
}

/* ========= UTRUSTNING ========= */
function renderWall(){

  const div = el("skiWall")
  if(!div) return

  div.innerHTML = ""

  // 🔥 FIX: visa alltid något
  let types = getTypes()
  if(activeType){
    types = types.includes(activeType) ? [activeType] : types
  }

  if(types.length === 0){
    div.innerHTML = "Ingen utrustning hittad"
    return
  }

  types.forEach(type=>{

    const title = document.createElement("h4")
    title.innerText = type.toUpperCase()
    div.appendChild(title)

    const grid = document.createElement("div")
    grid.className = "grid"

    const lengths = getLengths(type)

    if(lengths.length === 0){
      grid.innerHTML = "Inget i lager"
    }

    lengths.forEach(length=>{

      const ids = getIds(type,length)
      const available = getAvailable(ids)
      const selected = getSelected(ids)

      let bg = "#e8f5e9"
      if(available === 0) bg = "#ffcdd2"
      else if(available <= 2) bg = "#fff3cd"

      grid.innerHTML += `
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

  const ids = getIds(type,length)
  if(!ids.length) return

  if(getSelected(ids) >= getAvailable(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  renderAll()
}

function minus(type,length){

  const ids = getIds(type,length)
  const i = cart.findIndex(id=>ids.includes(id))

  if(i > -1) cart.splice(i,1)

  renderAll()
}

function renderCart(){

  const div = el("cart")
  if(!div) return

  if(cart.length === 0){
    div.innerHTML = "Inga val"
    return
  }

  const grouped = {}

  cart.forEach(id=>{
    const s = skis.find(x=>x.id===id)
    if(!s) return
    const key = s.type + " " + s.length
    grouped[key] = (grouped[key]||0)+1
  })

  let html = ""
  Object.keys(grouped).forEach(k=>{
    html += `${k} x ${grouped[k]}<br>`
  })

  div.innerHTML = html
}

/* ========= LAGER ========= */
function getAvailable(ids){

  let booked = 0

  rentals.forEach(r=>{
    if(r.returned) return

    safeParse(r.items).forEach(id=>{
      if(ids.includes(id)) booked++
    })
  })

  return ids.length - booked
}

/* ========= SAVE ========= */
async function saveBooking(){

  if(!el("customer").value || !el("start").value || !el("end").value || cart.length===0){
    alert("Fyll i allt")
    return
  }

  await supabaseClient.from("rentals").insert({
    name: el("customer").value,
    phone: el("phone").value,
    start: el("start").value,
    end: el("end").value,
    items: JSON.stringify(cart),
    returned: false
  })

  clearForm()
  await loadAll()
  filteredRentals = rentals
  renderAll()
}

/* ========= CLEAR ========= */
function clearForm(){
  el("customer").value = ""
  el("phone").value = ""
  el("start").value = ""
  el("end").value = ""
  cart = []
}

/* ========= BOKNINGAR ========= */
function renderRentals(){

  const div = el("rentals")
  if(!div) return

  div.innerHTML = ""

  if(rentals.length === 0){
    div.innerHTML = "Inga bokningar"
    return
  }

  rentals.forEach(r=>{

    if(r.returned) return

    const items = safeParse(r.items)
    const grouped = {}

    items.forEach(id=>{
      const s = skis.find(x=>x.id===id)
      if(!s) return
      const key = s.type + " " + s.length
      grouped[key] = (grouped[key]||0)+1
    })

    let itemsHTML = ""
    Object.keys(grouped).forEach(k=>{
      itemsHTML += `${k} x ${grouped[k]}<br>`
    })

    div.innerHTML += `
      <div style="border:1px solid #ccc;padding:6px;margin:4px;border-radius:6px">
        <b>${r.name || "-"}</b><br>
        📞 ${r.phone || "-"}<br>
        ${r.start} → ${r.end}<br><br>

        ${itemsHTML}

        <button onclick="quickReturn('${r.id}')">Återlämna</button>
      </div>
    `
  })
}

/* ========= RETURN ========= */
async function quickReturn(id){

  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderAll()
}

/* ========= ERROR ========= */
function showError(e){
  console.error(e)
  alert("Fel: "+e.message)
}
