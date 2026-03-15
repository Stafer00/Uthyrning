const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let cart=[]
let rentals=[]

/* längder */

const skiLengths=[
90,100,110,120,
130,140,150,160,
170,179,190,192,
194,195,197,199,
202,204,207
]

/* antal per längd */

const inventory={
90:3,
100:5,
110:6,
120:7,
130:8,
140:10,
150:12,
160:14,
170:18,
179:20,
190:8,
192:6,
194:10,
195:4,
197:7,
199:6,
202:4,
204:3,
207:2
}

function renderWall(){

const div=document.getElementById("skiWall")

div.innerHTML=""

skiLengths.forEach(length=>{

for(let i=0;i<inventory[length];i++){

const btn=document.createElement("div")

btn.className="ski"

btn.innerText=length

btn.onclick=function(){
addSki(length)
}

div.appendChild(btn)

}

})

}

function addSki(length){

cart.push(length)

renderCart()

}

function renderCart(){

const div=document.getElementById("cart")

if(cart.length===0){
div.innerHTML=""
return
}

let html=""

cart.forEach(len=>{
html+=len+" cm<br>"
})

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

if(error){
console.log(error)
return
}

rentals=data||[]

renderRentals()

}

function renderRentals(){

const div=document.getElementById("rentals")

div.innerHTML=""

rentals.forEach(r=>{

let html="<div class='card'>"

html+="<strong>"+r.name+"</strong><br>"
html+=r.phone+"<br>"
html+=r.start+" - "+r.end+"<br>"

let items=[]

try{
items=JSON.parse(r.items)
}catch{}

items.forEach(len=>{
html+=len+" cm<br>"
})

html+="</div>"

div.innerHTML+=html

})

}

renderWall()

loadBookings()
