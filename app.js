let supabase

let cart=[]
let rentals=[]
let weekOffset=0

const inventory={
90:5,100:5,110:5,120:5,
130:5,140:5,150:5,160:5,
170:5,179:5,190:6,192:6,
194:6,195:4,197:4,199:4,
202:3,204:3,207:2
}

document.addEventListener("DOMContentLoaded",init)

function init(){

supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

document.getElementById("addBtn").onclick=addSki
document.getElementById("saveBtn").onclick=saveBooking
document.getElementById("prevWeek").onclick=()=>changeWeek(-1)
document.getElementById("nextWeek").onclick=()=>changeWeek(1)

loadBookings()

}

function addSki(){

let cat=document.getElementById("category").value
let len=document.getElementById("length").value
let qty=parseInt(document.getElementById("qty").value)

for(let i=0;i<qty;i++){
cart.push({category:cat,length:len})
}

renderCart()

}

function renderCart(){

let div=document.getElementById("cart")

if(cart.length===0){
div.innerHTML=""
return
}

let html="<table><tr><th>Kategori</th><th>Längd</th></tr>"

cart.forEach(function(s){
html+="<tr><td>"+s.category+"</td><td>"+s.length+" cm</td></tr>"
})

html+="</table>"

div.innerHTML=html

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

const {error}=await supabase
.from("rentals")
.insert([{
name:name,
phone:phone,
start:start,
end:end,
items:JSON.stringify(cart),
returned:false
}])

if(error){
alert(error.message)
return
}

cart=[]
renderCart()

loadBookings()

}

async function loadBookings(){

const {data,error}=await supabase
.from("rentals")
.select("*")
.eq("returned",false)
.order("start",{ascending:true})

if(error){
console.log(error)
return
}

rentals=data||[]

renderRentals()
renderCalendar()

}

function renderRentals(){

let div=document.getElementById("rentals")
div.innerHTML=""

rentals.forEach(function(r){

let html="<div class='card'>"

html+="<strong>"+r.name+"</strong><br>"
html+=r.phone+"<br>"
html+=r.start+" - "+r.end+"<br>"

let items=[]

if(typeof r.items === "string"){
items = JSON.parse(r.items)
}else{
items = r.items || []
}

items.forEach(function(it){

if(it.length==length){
booked++
}

})

}

function changeWeek(n){

weekOffset+=n
renderCalendar()

}

function getMonday(d){

d=new Date(d)

let day=d.getDay()
let diff=d.getDate()-(day===0?6:day-1)

return new Date(d.setDate(diff))

}

function formatDate(d){
return d.toISOString().split("T")[0]
}

function renderCalendar(){

let div=document.getElementById("calendar")

let base=getMonday(new Date())
base.setDate(base.getDate()+weekOffset*7)

let days=[]

for(let i=0;i<7;i++){

let d=new Date(base)
d.setDate(base.getDate()+i)

days.push(formatDate(d))

}

document.getElementById("weekLabel").innerHTML=
days[0]+" - "+days[6]

let html="<table><tr><th>Längd</th>"

days.forEach(function(d){
html+="<th>"+d.substring(5)+"</th>"
})

html+="</tr>"

Object.keys(inventory).forEach(function(length){

html+="<tr><td>"+length+"</td>"

days.forEach(function(day){

let total=inventory[length]
let booked=0

rentals.forEach(function(r){

if(day>=r.start && day<=r.end){

let items=[]

try{
items=JSON.parse(r.items)
}catch{}

items.forEach(function(it){

if(it.length==length){
booked++
}

})

}

})

let available=total-booked

let css="good"

if(available===0) css="full"
else if(available<=Math.ceil(total/2)) css="low"

html+="<td class='"+css+"'>"+available+"</td>"

})

html+="</tr>"

})

html+="</table>"

div.innerHTML=html

}
