const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let cart=[]
let rentals=[]

document.getElementById("saveBtn").onclick=saveBooking

init()

async function init(){
await loadSkis()
await loadBookings()
}

async function loadSkis(){

const {data,error}=await supabase
.from("skis")
.select("*")
.order("length",{ascending:true})

if(error){
alert("Fel vid laddning av skidor")
console.log(error)
return
}

skis=data
renderWall()

}

function renderWall(){

const wall=document.getElementById("skiWall")
wall.innerHTML=""

skis.forEach(ski=>{

const div=document.createElement("div")
div.className="ski"
div.innerText=ski.length

if(ski.status==="rented"){
div.classList.add("rented")
}

if(cart.includes(ski.id)){
div.classList.add("selected")
}

div.onclick=function(){

if(ski.status==="rented") return

if(cart.includes(ski.id)){
cart=cart.filter(id=>id!==ski.id)
}else{
cart.push(ski.id)
}

renderWall()
renderCart()

}

wall.appendChild(div)

})

}

function renderCart(){

const div=document.getElementById("cart")
div.innerHTML=""

cart.forEach(id=>{
const ski=skis.find(s=>s.id===id)
if(ski){
div.innerHTML+=ski.length+" cm<br>"
}
})

}

async function saveBooking(){

let name=document.getElementById("customer").value
let phone=document.getElementById("phone").value
let start=document.getElementById("start").value
let end=document.getElementById("end").value

if(!name||!start||!end||cart.length===0){
alert("Fyll i alla fält")
return
}

const {data,error}=await supabase
.from("rentals")
.insert({
name:name,
phone:phone,
start_date:start,
end_date:end
})
.select()

if(error){
alert("Fel: "+error.message)
return
}

const rentalId=data[0].id

for(const skiId of cart){

await supabase
.from("rental_items")
.insert({
rental_id:rentalId,
ski_id:skiId
})

await supabase
.from("skis")
.update({status:"rented"})
.eq("id",skiId)

}

cart=[]

await loadSkis()
await loadBookings()

alert("Bokning sparad")

}

async function loadBookings(){

const {data,error}=await supabase
.from("rentals")
.select("*")
.order("start_date",{ascending:true})

if(error){
console.log(error)
return
}

rentals=data
renderRentals()

}

function renderRentals(){

const div=document.getElementById("rentals")
div.innerHTML=""

rentals.forEach(r=>{

let html="<div class='card'>"

html+="<strong>"+r.name+"</strong><br>"
html+=r.start_date+" - "+r.end_date+"<br>"

html+="</div>"

div.innerHTML+=html

})

}
