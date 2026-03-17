alert("APP STARTAR")

const supabase = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[]
let weekOffset=0

document.addEventListener("DOMContentLoaded", init)

async function init(){

document.getElementById("saveBtn").onclick = saveBooking

await loadSkis()
await loadBookings()

renderWall()
renderWeek()
renderRentals()

}

/* LOAD */

async function loadSkis(){
const {data}=await supabase.from("skis").select("*")
skis=data||[]
}

async function loadBookings(){
const {data}=await supabase.from("rentals").select("*")
rentals=data||[]
}

/* SKIDOR */

function renderWall(){
const div=document.getElementById("skiWall")
div.innerHTML=""

skis.forEach(ski=>{
let el=document.createElement("div")
el.className="ski"
el.innerText=ski.length+" cm"

el.onclick=()=>{
cart.push(ski.id)
renderCart()
}

div.appendChild(el)
})
}

/* CART */

function renderCart(){
const div=document.getElementById("cart")
div.innerHTML=""

cart.forEach(id=>{
let ski=skis.find(s=>s.id===id)
if(ski){
div.innerHTML+=ski.length+" cm<br>"
}
})
}

/* SAVE */

async function saveBooking(){

let name=document.getElementById("customer").value
let phone=document.getElementById("phone").value
let start=document.getElementById("start").value
let end=document.getElementById("end").value

if(!name||!start||!end||cart.length===0){
alert("Fyll i allt")
return
}

await supabase.from("rentals").insert({
name,
phone,
start,
end,
items:JSON.stringify(cart),
returned:false
})

cart=[]
renderCart()

await loadBookings()

renderWeek()
renderRentals()

}

/* KALENDER */

function renderWeek(){

const div=document.getElementById("calendar")

let base=getMonday(new Date())
base.setDate(base.getDate()+weekOffset*7)

let dates=[]
for(let i=0;i<7;i++){
let d=new Date(base)
d.setDate(base.getDate()+i)
dates.push(format(d))
}

let html="<table><tr><th>Skida</th>"

dates.forEach(d=>{
html+="<th>"+d.substring(5)+"</th>"
})

html+="</tr>"

skis.forEach(ski=>{

html+="<tr><td>"+ski.length+" cm</td>"

dates.forEach(day=>{

let booked=false

rentals.forEach(r=>{
if(day>=r.start && day<=r.end){
let items=JSON.parse(r.items||"[]")
if(items.includes(ski.id)){
booked=true
}
}
})

html+= booked
? "<td class='booked'>X</td>"
: "<td class='free'>Ledig</td>"

})

html+="</tr>"

})

html+="</table>"

div.innerHTML=html

}

/* LISTA */

function renderRentals(){

const div=document.getElementById("rentals")
div.innerHTML=""

rentals.forEach(r=>{
div.innerHTML+=`
<div>
<strong>${r.name}</strong><br>
${r.start} - ${r.end}
</div><br>
`
})

}

/* NAV */

function prevWeek(){
weekOffset--
renderWeek()
}

function nextWeek(){
weekOffset++
renderWeek()
}

/* DATUM */

function format(d){
return d.toISOString().split("T")[0]
}

function getMonday(d){
d=new Date(d)
let day=d.getDay()
let diff=d.getDate()-(day==0?6:day-1)
return new Date(d.setDate(diff))
}
