console.log("CALENDAR 1.7.1 OK")

const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "DIN-ANON-KEY-HÄR"
)

let skis=[], rentals=[], weekOffset=0

window.onload = init

async function init(){
  await loadAll()
  renderWeek()
}

/* LOAD */
async function loadAll(){
  skis = (await supabaseClient.from("skis").select("*")).data || []
  rentals = (await supabaseClient.from("rentals").select("*")).data || []
}

/* SAFE */
function parse(x){
  try{return JSON.parse(x||"[]")}catch{return[]}
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

  const lengths=[...new Set(skis.map(s=>s.length))].sort((a,b)=>a-b)

  lengths.forEach(l=>{

    const ids=skis.filter(s=>s.length==l).map(s=>s.id)

    html+=`<tr><td>${l}</td>`

    dates.forEach(day=>{

      let booked=0

      rentals.forEach(r=>{
        if(r.returned) return
        const items=parse(r.items)
        if(day>=r.start && day<=r.end){
          items.forEach(id=>{if(ids.includes(id)) booked++})
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
