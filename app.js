alert("APP STARTAR")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[]

window.onload=init

async function init(){

  document.getElementById("saveBtn").onclick=saveBooking

  await loadSkis()
  await loadBookings()

  renderAll()
}

/* ========= LOAD ========= */

async function loadSkis(){
  const {data}=await supabaseClient.from("skis").select("*")
  skis=data||[]
}

async function loadBookings(){
  const {data}=await supabaseClient.from("rentals").select("*")
  rentals=data||[]
}

/* ========= LAGER ========= */

function getAvailableCount(length,start,end){

  let total = skis.filter(s=>s.length==length).length
  let booked = 0

  rentals.forEach(r=>{

    if(r.returned) return

    if(!(end < r.start || start > r.end)){

      let items=[]
      try{items=JSON.parse(r.items||"[]")}catch{}

      items.forEach(id=>{
        let ski=skis.find(s=>s.id===id)
        if(ski && ski.length==length){
          booked++
        }
      })
    }
  })

  // 🔥 minus det som redan ligger i cart
  cart.forEach(id=>{
    let ski=skis.find(s=>s.id===id)
    if(ski && ski.length==length){
      booked++
    }
  })

  return total - booked
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

  const div=document.getElementById("skiWall")
  div.innerHTML=""

  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  skis.forEach(ski=>{

    let el=document.createElement("div")

    el.style.cssText="display:inline-block;padding:14px;margin:6px;border-radius:10px;border:1px solid #ccc"

    if(start && end){

      let available=getAvailableCount(ski.length,start,end)

      if(available<=0){
        el.style.background="#ccc"
        el.innerText=ski.length+" cm\nFULLT"
        div.appendChild(el)
        return
      }

      if(available==1){
        el.style.background="#ff9800"
        el.innerText=ski.length+" cm\n1 kvar"
      }else{
        el.style.background="#4caf50"
        el.style.color="white"
        el.innerText=ski.length+" cm\n"+available+" kvar"
      }

      el.onclick=()=>{

        if(getAvailableCount(ski.length,start,end)<=0){
          alert("Slut i lager")
          return
        }

        cart.push(ski.id)
        renderAll()
      }

    }else{
      el.innerText=ski.length+" cm"

      el.onclick=()=>{
        cart.push(ski.id)
        renderCart()
      }
    }

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function renderCart(){

  const div=document.getElementById("cart")

  if(cart.length===0){
    div.innerHTML="Inga skidor"
    return
  }

  let html=""

  cart.forEach((id,i)=>{
    let ski=skis.find(s=>s.id===id)

    html+=`
    ${ski.length} cm 
    <button onclick="removeItem(${i})">X</button><br>
    `
  })

  html+=`
  <br>
  <button onclick="undo()">Ångra</button>
  <button onclick="clearCart()">Rensa</button>
  `

  div.innerHTML=html
}

function removeItem(i){
  cart.splice(i,1)
  renderAll()
}

function undo(){
  cart.pop()
  renderAll()
}

function clearCart(){
  cart=[]
  renderAll()
}

/* ========= SAVE ========= */

async function saveBooking(){

  let name=document.getElementById("customer").value
  let phone=document.getElementById("phone").value
  let start=document.getElementById("start").value
  let end=document.getElementById("end").value

  if(!name||!start||!end||cart.length===0){
    alert("Fyll i alla fält")
    return
  }

  for(let id of cart){

    let ski=skis.find(s=>s.id===id)

    if(getAvailableCount(ski.length,start,end)<=0){
      alert("Slut i lager: "+ski.length+" cm")
      return
    }
  }

  await supabaseClient.from("rentals").insert({
    name,
    phone,
    start,
    end,
    items:JSON.stringify(cart),
    returned:false
  })

  cart=[]

  await loadBookings()
  renderAll()
}

/* ========= KALENDER ========= */

function renderWeek(){

  const div=document.getElementById("calendar")

  let html="<table><tr><th>Längd</th>"

  let dates=[]
  let base=new Date()

  for(let i=0;i<7;i++){
    let d=new Date(base)
    d.setDate(base.getDate()+i)
    let f=d.toISOString().split("T")[0]
    dates.push(f)
    html+="<th>"+f.substring(5)+"</th>"
  }

  html+="</tr>"

  let groups={}

  skis.forEach(s=>{
    if(!groups[s.length]) groups[s.length]=[]
    groups[s.length].push(s)
  })

  Object.keys(groups).forEach(length=>{

    html+="<tr><td>"+length+" cm</td>"

    dates.forEach(day=>{

      let free=getAvailableCount(length,day,day)

      html+= free<=0
        ? "<td style='background:red;color:white'>FULLT</td>"
        : "<td style='background:green;color:white'>"+free+"</td>"
    })

    html+="</tr>"
  })

  html+="</table>"

  div.innerHTML=html
}

/* ========= LISTA ========= */

function renderRentals(){

  const div=document.getElementById("rentals")
  div.innerHTML=""

  rentals.forEach(r=>{

    if(r.returned) return

    let items=JSON.parse(r.items||"[]")

    let html="<div class='card'>"

    html+=`<strong>${r.name}</strong><br>`
    html+=`${r.start} → ${r.end}<br><br>`

    items.forEach((id,i)=>{
      let ski=skis.find(s=>s.id===id)

      html+=`
      ${ski.length} cm 
      <button onclick="returnOne('${r.id}',${i})">X</button><br>
      `
    })

    html+=`<br>
    <button onclick="extend('${r.id}')">Förläng</button>
    <button onclick="returnAll('${r.id}')">Allt klart</button>
    `

    html+="</div>"

    div.innerHTML+=html
  })
}

/* ========= RETURN ========= */

async function returnOne(id,index){

  let r=rentals.find(x=>x.id==id)
  let items=JSON.parse(r.items||"[]")

  items.splice(index,1)

  if(items.length===0){
    await supabaseClient.from("rentals").update({returned:true}).eq("id",id)
  }else{
    await supabaseClient.from("rentals").update({
      items:JSON.stringify(items)
    }).eq("id",id)
  }

  await loadBookings()
  renderAll()
}

async function returnAll(id){

  await supabaseClient.from("rentals")
  .update({returned:true})
  .eq("id",id)

  await loadBookings()
  renderAll()
}

/* ========= FÖRLÄNG ========= */

async function extend(id){

  let r=rentals.find(x=>x.id==id)

  let ny=prompt("Nytt slutdatum",r.end)

  if(!ny) return

  await supabaseClient.from("rentals")
  .update({end:ny})
  .eq("id",id)

  await loadBookings()
  renderAll()
}

/* ========= FORM ========= */

function clearForm(){
  document.getElementById("customer").value=""
  document.getElementById("phone").value=""
}
