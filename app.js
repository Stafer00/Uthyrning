const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let rentals=[]
let cart=[]
let weekOffset=0

document.getElementById("saveBtn").onclick = saveBooking

start()

async function start(){
await loadSkis()
await loadBookings()
renderWall()
renderWeek()
}

// =====================
// DATA
// =====================

async function loadSkis(){
const {data} = await supabase.from("skis").select("*")
skis = data || []
}

async function loadBookings(){
const {data} = await supabase
.from("rentals")
.select("*")
.eq("returned",false)

rentals = data || []
}

// =====================
// SKIDOR
// =====================

function isBooked(skiId,start,end){

for(let r of rentals){

if(r.returned) continue

if(!(end < r.start || start > r.end)){

let items=[]
try{items=JSON.parse(r.items)}catch{}

if(items.includes(skiId)) return true

}

}

return false
}

function renderWall(){

const wall=document.getElementById("skiWall")
wall.innerHTML=""

let start=document.getElementById("start").value
let end=document.getElementById("end").value

skis.forEach(ski=>{

const btn=document.createElement("div")
btn.innerText=ski.length+" cm"

btn.style.display="inline-block"
btn.style.margin="5px"
btn.style.padding="10px"
btn.style.borderRadius="8px"
btn.style.cursor="pointer"

let blocked=false

if(start && end){
blocked = isBooked(ski.id,start,end)
}

if(blocked){
btn.style.background="red"
btn.style.color="white"
btn.style.cursor="not-allowed"
}else if(cart.includes(ski.id)){
btn.style.background="green"
btn.style.color="white"
}else{
btn.style.background="#eee"
}

btn.onclick=()=>{

if(blocked) return

if(cart.includes(ski.id)){
cart=cart.filter(id=>id!==ski.id)
}else{
cart.push(ski.id)
}

renderWall()
renderCart()

}

wall.appendChild(btn)

})

}

function renderCart(){

const div=document.getElementById("cart")
div.innerHTML=""

cart.forEach(id=>{

let ski=skis.find(s=>s.id===id)

let el=document.createElement("div")
el.innerText=ski.length+" cm"
el.style.display="inline-block"
el.style.margin="5px"
el.style.padding="5px"
el.style.background="#ddd"

div.appendChild(el)

})

}

// =====================
// SPARA
// =====================

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
if(isBooked(id,start,end)){
alert("En skida är redan bokad!")
return
}
}

await supabase.from("rentals").insert({
name,phone,start,end,
items:JSON.stringify(cart),
returned:false
})

cart=[]
renderCart()

await loadBookings()
renderWeek()
renderWall()

}

// =====================
// KALENDER
// =====================

function getMonday(d){
d=new Date(d)
let day=d.getDay()
let diff=d.getDate()-(day===0?6:day-1)
return new Date(d.setDate(diff))
}

function format(d){
return d.toISOString().split("T")[0]
}

function getWeekNumber(d){
d=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7))
let yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1))
return Math.ceil((((d-yearStart)/86400000)+1)/7)
}

function renderWeek(){

const div=document.getElementById("rentals")
div.innerHTML=""

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

html+="<tr><td>"+ski.length+"</td>"

dates.forEach(day=>{

let found=null

for(let r of rentals){

if(day>=r.start && day<=r.end){

let items=[]
try{items=JSON.parse(r.items)}catch{}

if(items.includes(ski.id)){
found=r
}

}

}

if(found){
html+=`<td style="background:red;color:white;cursor:pointer"
onclick="showBooking('${found.id}')">X</td>`
}else{
html+="<td style='background:#4caf50;color:white'>Ledig</td>"
}

})

html+="</tr>"

})

html+="</table>"

div.innerHTML=html

}

// =====================
// VISA BOKNING
// =====================

function showBooking(id){

let r=rentals.find(x=>x.id==id)

if(!r) return

let text =
r.name + "\n" +
r.phone + "\n" +
r.start + " - " + r.end

if(confirm(text + "\n\nMarkera som återlämnad?")){
returnBooking(id)
}

}

// =====================
// ÅTERLÄMNA
// =====================

async function returnBooking(id){

await supabase
.from("rentals")
.update({returned:true})
.eq("id",id)

await loadBookings()
renderWeek()
renderWall()

}
