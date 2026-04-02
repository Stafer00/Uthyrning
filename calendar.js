console.log("KALENDER PRO 2.2")



let skis=[], rentals=[], weekOffset=0

window.onload=init

async function init(){
  await loadAll()
  renderWeek()
}

/* LOAD */
async function loadAll(){
  skis=(await supabaseClient.from("skis").select("*")).data||[]
  rentals=(await supabaseClient.from("rentals").select("*")).data||[]
}

/* SAFE */
function parse(x){
  try{return JSON.parse(x||"[]")}catch{return[]}
}

/* GROUP */
function getLengths(){
  return [...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)
}

/* CALENDAR */
function renderWeek(){

  const div=document.getElementById("calendar")

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

  getLengths().forEach(l=>{

    const ids=skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td style="background:#eee;color:black">${l}</td>`

    dates.forEach(day=>{

      let booked=0,out=0,inn=0

      rentals.forEach(r=>{
        if(r.returned) return

        const items=parse(r.items)

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

      const free=ids.length-booked

      let bg="#4caf50"
      if(free===0) bg="#f44336"
      else if(free<=2) bg="#ff9800"

      html+=`
        <td onclick="openDay('${day}')"
        style="background:${bg};color:black">
          ${free}<br>
          <b>↑${out||""}</b> <b>↓${inn||""}</b>
        </td>
      `
    })

    html+="</tr>"
  })

  html+="</table>"
  div.innerHTML=html
}

/* POPUP */
function openDay(day){

  let html=""

  rentals.forEach(r=>{

    if(r.returned) return

    const items=parse(r.items)

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
          ${r.start} → ${r.end}<br><br>

          ${skisHTML}

          <button onclick="extend('${r.id}')">Förläng</button>
          <button onclick="returnAll('${r.id}')">Återlämna allt</button>
        </div>
      `
    }

  })

  document.body.insertAdjacentHTML("beforeend",`
    <div class="popup" id="popup">
      <div class="popup-box">
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

/* ACTIONS */
async function returnOne(id,length){

  const r=rentals.find(x=>x.id==id)
  let items=parse(r.items)

  const index=items.findIndex(itemId=>{
    const s=skis.find(x=>x.id===itemId)
    return s && s.length==length
  })

  if(index===-1) return

  items.splice(index,1)

  if(items.length===0){
    await returnAll(id)
    return
  }

  await supabaseClient.from("rentals")
    .update({items:JSON.stringify(items)})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
}

async function returnAll(id){
  await supabaseClient.from("rentals")
    .update({returned:true})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
}

async function extend(id){
  const d=prompt("Nytt slutdatum YYYY-MM-DD")
  if(!d) return

  await supabaseClient.from("rentals")
    .update({end:d})
    .eq("id",id)

  await loadAll()
  renderWeek()
  closePopup()
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
