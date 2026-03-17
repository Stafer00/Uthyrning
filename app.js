console.log("JS FIL LADDAD")

/* ========= SUPABASE ========= */

if(!window.supabase){
alert("Supabase laddades inte – kontrollera script i index.html")
}

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

console.log("APP STARTAR")

try{

await loadSkis()
await loadBookings()

console.log("DATA LADDAD")

renderWall()
renderWeek()
renderRentals()

}catch(e){

console.log("KRASH:", e)

document.body.innerHTML += "<p style='color:red'>Fel i app.js – öppna konsol</p>"

}

}

/* ========= LOAD ========= */

async function loadSkis(){

console.log("Laddar skidor...")

const {data,error}=await supabase.from("skis").select("*")

if(error){
console.log("SKIS ERROR:", error)
throw error
}

skis=data||[]

console.log("Skidor:", skis.length)

}

async function loadBookings(){

console.log("Laddar bokningar...")

const {data,error}=await supabase.from("rentals").select("*")

if(error){
console.log("RENTALS ERROR:", error)
throw error
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

const btn=document.createElement("div")
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

if(cart.length===0){
div.innerHTML=""
return
}

let html=""

cart.forEach(id=>{
let ski=skis.find(s=>s.id===id)
if(ski){
html+=ski.length+" cm<br>"
}
})

div.innerHTML=html

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

const {error}=await supabase
.from("rentals")
.insert({
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

if(!div){
console.log("Hittar inte #calendar")
return
}

if(!skis.length){
div.innerHTML="<p>Inga skidor laddade</p>"
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

let html="<h3>Vecka "+getWeekNumber(base)+"</h3>"
html+="<table><tr><th>Skida</th>"

dates.forEach(d=>{
html+="<th>"+d.substring(5)+"</th>"
})

html+="</tr>"

skis.forEach(ski=>{

html+="<tr><td>"+ski.length+" cm</td>"

dates.forEach(day=>{

let found=null

for(let r of rentals){

if(r.returned) continue

if(day>=r.start && day<=r.end){

let items=[]
try{items=JSON.parse(r.items)}catch{}

if(items.includes(ski.id)){
found=r
break
}

}

}

if(found){
html+=`<td class="booked" data-id="${found.id}">X</td>`
}else{
html+=`<td class="free">Ledig</td>`
}

})

html+="</tr>"

})

html+="</table>"

div.innerHTML=html

document.querySelectorAll(".booked").forEach(el=>{
el.addEventListener("click",()=>{
showBooking(el.dataset.id)
})
})

}

/* ========= LISTA ========= */

function renderRentals(){

const div=document.getElementById("rentals")
if(!div) return

div.innerHTML=""

rentals.forEach(r=>{

if(r.returned) return

let html="<div class='card'>"

html+="<strong>"+r.name+"</strong><br>"
html+=r.phone+"<br>"
html+=r.start+" - "+r.end+"<br>"

let items=[]
try{items=JSON.parse(r.items)}catch{}

items.forEach(id=>{
let ski=skis.find(s=>s.id===id)
if(ski){
html+=ski.length+" cm<br>"
}
})

html+="</div>"

div.innerHTML+=html

})

}

/* ========= POPUP ========= */

function showBooking(id){

let r=rentals.find(x=>x.id==id)
if(!r) return

alert(
r.name+"\n"+
r.phone+"\n"+
r.start+" - "+r.end
)

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

function getWeekNumber(d){
d=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))
d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7))
let yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1))
return Math.ceil((((d-yearStart)/86400000)+1)/7)
}
