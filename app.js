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

console.log("INIT START")

const btn = document.getElementById("saveBtn")
if(btn) btn.onclick = saveBooking

// visa direkt så sidan inte känns död
setHTML("skiWall","Laddar skidor...")
setHTML("calendar","Laddar kalender...")

try{

// timeout-skydd (5 sek)
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject("Timeout"), 5000)
)

await Promise.race([
  Promise.all([loadSkis(), loadBookings()]),
  timeout
])

console.log("DATA LADDAD")

}catch(e){

console.log("SUPABASE FEL:", e)

// fallback – appen fungerar ändå
skis = [
{id:1,length:100},
{id:2,length:120},
{id:3,length:140},
{id:4,length:160}
]

rentals = []

}

// rendera alltid
renderWall()
renderWeek()
renderRentals()

}

/* ========= LOAD ========= */

async function loadSkis(){

const {data,error}=await supabase.from("skis").select("*")

if(error){
console.log("SKIS ERROR:", error)
throw error
}

skis=data||[]

}

async function loadBookings(){

const {data,error}=await supabase.from("rentals").select("*")

if(error){
console.log("RENTALS ERROR:", error)
throw error
}

rentals=data||[]

}

/* ========= SKI WALL ========= */

function renderWall(){

const div=document.getElementById("skiWall")
if(!div) return

div.innerHTML=""

skis.forEach(ski=>{

let btn=document.createElement("div")
btn.className="ski"
btn.innerText=ski.length+" cm"

btn.onclick=()=>{
cart.push(ski.id)
renderCart()
}

div.appendChild(btn)

})

}

/* ========= CART ========= */

function renderCart(){

const div=document.getElementById("cart")
if(!div) return

div.innerHTML=""

cart.forEach(id=>{
let ski=skis.find(s=>s.id===id)
if(ski){
div.innerHTML+=ski.length+" cm<br>"
}
})

}

/* ========= SAVE ========= */

async function saveBooking(){

let name=document.getElementById("customer")?.value
let phone=document.getElementById("phone")?.value
let start=document.getElementById("start")?.value
let end=document.getElementById("end")?.value

if(!name||!start||!end||cart.length===0){
alert("Fyll i alla fält")
return
}

const {error}=await supabase.from("rentals").insert({
name,
phone,
start,
end,
items:JSON.stringify(cart),
returned:false
})

if(error){
alert("Fel: "+error.message)
return
}

alert("Bokning sparad")

cart=[]
renderCart()

await loadBookings()

renderWeek()
renderRentals()

}

/* ========= KALENDER ========= */

function renderWeek(){

const div=document.getElementById("calendar")
if(!div) return

if(!skis.length){
div.innerHTML="Inga skidor"
return
}

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

if(r.returned) return

if(day>=r.start && day<=r.end){

let items=[]
try{items=JSON.parse(r.items)}catch{}

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

/* ========= LISTA ========= */

function renderRentals(){

const div=document.getElementById("bookingList")
if(!div) return

div.innerHTML=""

rentals.forEach(r=>{

if(r.returned) return

div.innerHTML+=`
<div class="card">
<strong>${r.name}</strong><br>
${r.phone}<br>
${r.start} - ${r.end}
</div>
`

})

}

/* ========= NAV ========= */

function prevWeek(){
weekOffset--
renderWeek()
}

function nextWeek(){
weekOffset++
renderWeek()
}

/* ========= HELPERS ========= */

function format(d){
return d.toISOString().split("T")[0]
}

function getMonday(d){
d=new Date(d)
let day=d.getDay()
let diff=d.getDate()-(day==0?6:day-1)
return new Date(d.setDate(diff))
}

function setHTML(id,text){
let el=document.getElementById(id)
if(el) el.innerHTML=text
}
