alert("APP JS LADDAS")
console.log("APP STARTAR")

/* ========= SUPABASE ========= */

const supabase = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

/* ========= DATA ========= */

let skis=[]
let rentals=[]
let cart=[]
let weekOffset=0

/* ========= START ========= */

document.addEventListener("DOMContentLoaded", init)

async function init(){

try{

console.log("INIT START")

// 🔥 säker knappkoppling
const btn = document.getElementById("saveBtn")
if(btn){
btn.onclick = saveBooking
}else{
console.log("saveBtn saknas")
}

// 🔥 kontrollera viktiga element
if(!document.getElementById("skiWall")) console.log("saknar skiWall")
if(!document.getElementById("calendar")) console.log("saknar calendar")
if(!document.getElementById("rentals")) console.log("saknar rentals")

await loadSkis()
await loadBookings()

console.log("DATA LADDAD")

renderWall()
renderWeek()
renderRentals()

}catch(e){

console.log("KRASH:", e)
alert("Fel i app.js – öppna konsol")

}

}

/* ========= LOAD ========= */

async function loadSkis(){

const {data,error}=await supabase.from("skis").select("*")

if(error){
console.log("SKIS ERROR:", error)
skis=[]
return
}

skis=data||[]
console.log("Skidor:", skis.length)

}

async function loadBookings(){

const {data,error}=await supabase.from("rentals").select("*")

if(error){
console.log("RENTALS ERROR:", error)
rentals=[]
return
}

rentals=data||[]
console.log("Bokningar:", rentals.length)

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
alert(error.message)
return
}

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

div.innerHTML=""

if(!skis.length){
div.innerHTML="<p>Inga skidor</p>"
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

const div=document.getElementById("rentals")
if(!div) return

div.innerHTML=""

rentals.forEach(r=>{

if(r.returned) return

div.innerHTML+=`
<div>
<strong>${r.name}</strong><br>
${r.phone}<br>
${r.start} - ${r.end}
</div><br>
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

/* ========= DATUM ========= */

function format(d){
return d.toISOString().split("T")[0]
}

function getMonday(d){
d=new Date(d)
let day=d.getDay()
let diff=d.getDate()-(day==0?6:day-1)
return new Date(d.setDate(diff))
}
