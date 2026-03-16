const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis=[]
let cart=[]

document.getElementById("saveBtn").onclick=saveBooking

startApp()

async function startApp(){

console.log("APP STARTAR")

try{
await loadSkis()
}catch(e){
alert("Fel vid start: "+e.message)
console.log(e)
}

}

async function loadSkis(){

console.log("Laddar skidor...")

const {data,error}=await supabase
.from("skis")
.select("*")

if(error){
alert("Supabase error: "+error.message)
console.log(error)
return
}

console.log("Skidor:",data)

skis=data || []

renderWall()

}

function renderWall(){

console.log("Renderar skidvägg")

const wall=document.getElementById("skiWall")

wall.innerHTML=""

if(skis.length===0){
wall.innerHTML="INGA SKIDOR FUNNA"
return
}

skis.forEach(ski=>{

const div=document.createElement("div")

div.className="ski"
div.innerText=ski.length

div.onclick=function(){

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

alert("Test: bokning funkar")

}
