const VERSION="1"console.log("APP STARTAR")

const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let cart=[]
let rentals=[]

document.addEventListener("DOMContentLoaded",function(){

console.log("DOM LOADED")

document.getElementById("addBtn").addEventListener("click",addSki)
document.getElementById("saveBtn").addEventListener("click",saveBooking)

loadBookings()

})

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

console.log("SAVE BOOKING")

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
name:name,
phone:phone,
start:start,
end:end,
items:JSON.stringify(cart),
returned:false
})

if(error){
alert(error.message)
console.log(error)
return
}

alert("Bokning sparad")

cart=[]
renderCart()

loadBookings()

}

async function loadBookings(){

const {data,error}=await supabase
.from("rentals")
.select("*")
.eq("returned",false)

if(error){
console.log(error)
return
}

rentals=data||[]

renderRentals()

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

try{
items=JSON.parse(r.items)
}catch{}

items.forEach(function(it){
html+=it.category+" "+it.length+" cm<br>"
})

html+="</div>"

div.innerHTML+=html

})

}
