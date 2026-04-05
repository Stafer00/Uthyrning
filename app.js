console.log("APP 2.4 FIXAD")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[], rentals=[], cart=[], weekOffset=0

window.onload=init

async function init(){
  bind()
  await load()
  render()
}

/* ========= LOAD ========= */
async function load(){
  const {data:s}=await supabaseClient.from("skis").select("*")
  const {data:r}=await supabaseClient.from("rentals").select("*")
  skis=s||[]
  rentals=r||[]
}

/* ========= HELP ========= */
function el(id){return document.getElementById(id)}
function parse(x){try{return JSON.parse(x||"[]")}catch{return[]}}
function format(d){return d.toISOString().split("T")[0]}

/* ========= BIND ========= */
function bind(){
  el("saveBtn").onclick=save
}

/* ========= RENDER ========= */
function render(){
  renderWall()
  renderCart()
  renderRentals()
  renderCalendar()
}

/* ========= WALL ========= */
function renderWall(){

  const div=el("skiWall")
  div.innerHTML=""

  const types=[...new Set(skis.map(s=>s.type))]

  types.forEach(type=>{

    div.innerHTML+=`<h4>${type.toUpperCase()}</h4>`

    const grid=document.createElement("div")
    grid.className="grid"

    const lengths=[...new Set(
      skis.filter(s=>s.type===type).map(s=>s.length)
    )].sort((a,b)=>a-b)

    lengths.forEach(length=>{

      const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

      const available=getAvailableToday(ids)
      const selected=getSelected(ids)

      let bg="#c8e6c9"
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
  const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)

  if(getSelected(ids)>=getAvailableToday(ids)){
    alert("Slut i lager")
    return
  }

  cart.push(ids[getSelected(ids)])
  render()
}

function minus(type,length){
  const ids=skis.filter(s=>s.type===type && s.length==length).map(s=>s.id)
  const i=cart.findIndex(id=>ids.includes(id))
  if(i>-1) cart.splice(i,1)
  render()
}

function renderCart(){
  const div=el("cart")

  if(cart.length===0){
    div.innerHTML="Inga val"
    return
  }

  const grouped={}

  cart.forEach(id=>{
    const s=skis.find(x=>x.id===id)
    if(!s) return
    const key=s.type+" "+s.length
    grouped[key]=(grouped[key]||0)+1
  })

  let html=""
  Object.keys(grouped).forEach(k=>{
    html+=`${k} x ${grouped[k]}<br>`
  })

  div.innerHTML=html
}

/* ========= LAGER ========= */
function getAvailableToday(ids){

  const today=format(new Date())

  let booked=0

  rentals.forEach(r=>{
    if(r.returned) return

    if(today>=r.start && today<=r.end){
      parse(r.items).forEach(id=>{
        if(ids.includes(id)) booked++
      })
    }
  })

  return ids.length-booked
}

/* ========= SAVE ========= */
async function save(){

  if(!el("customer").value || cart.length===0){
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

  cart=[]
  await load()
  render()
}

/* ========= BOOKINGS ========= */
function renderRentals(){
  el("rentals").innerHTML=rentals.length+" bokningar"
}

/* ========= CALENDAR ========= */
function renderCalendar(){

  const div=el("calendar")

  let base=new Date()
  base.setDate(base.getDate()+weekOffset*7)

  let html="<table><tr><th>cm</th>"

  let days=[]

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)

    const day=format(d)
    days.push(day)

    html+=`<th>${d.getDate()}/${d.getMonth()+1}</th>`
  }

  html+="</tr>"

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{

    const ids=skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td>${l}</td>`

    days.forEach(day=>{

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return

        if(day>=r.start && day<=r.end){
          parse(r.items).forEach(id=>{
            if(ids.includes(id)) booked++
          })
        }
      })

      const free=ids.length-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`<td style="background:${bg}">${free}</td>`
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= NAV ========= */
function prevWeek(){weekOffset--;renderCalendar()}
function nextWeek(){weekOffset++;renderCalendar()}
