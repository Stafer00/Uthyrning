const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let cart=[]
let rentals=[]

const skis=[
{cat:"Knatte",len:90},
{cat:"Knatte",len:100},
{cat:"Knatte",len:110},
{cat:"Knatte",len:120},

{cat:"Junior",len:130},
{cat:"Junior",len:140},
{cat:"Junior",len:150},
{cat:"Junior",len:160},

{cat:"Vuxen",len:170},
{cat:"Vuxen",len:179},
{cat:"Vuxen",len:190},
{cat:"Vuxen",len:192},
{cat:"Vuxen",len:194},
{cat:"Vuxen",len:195},
{cat:"Vuxen",len:197},
{cat:"Vuxen",len:199},
{cat:"Vuxen",len:202},
{cat:"Vuxen",len:204},
{cat:"Vuxen",len:207}
]

document.addEventListener("DOMContentLoaded",init)

function init(){

renderButtons()

document
.getElementById("saveBtn")
.addEventListener("click",saveBooking)

loadBookings()

}

function renderButtons(){

const div=document.getElementById("skiButtons")

skis.forEach(s=>{

const btn=document.createElement("button")

btn.className="skiButton"

btn.innerText=s.cat+" "+s.len+"cm"

btn.onclick=()=>addSki(s)

div.appendChild(btn)

})

}

function addSki(s){

cart.push(s)

renderCart()

}

function renderCart(){

let div=document.getElementById("cart")

if(cart.length===0){
div.innerHTML=""
return
}

let html=""

cart.forEach(s=>{
html+=s.cat+" "+s.len+" cm<br>"
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

items.forEach(it=>{
html+=it.cat+" "+it.len+" cm<br>"
})

html+="</div>"

div.innerHTML+=html

})

}
