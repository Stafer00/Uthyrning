const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis = []
let cart = []

document.getElementById("saveBtn").onclick = saveBooking

startApp()

async function startApp(){

alert("APP STARTAR")

try{
await loadSkis()
}catch(e){
alert("FEL I START: " + e.message)
console.log(e)
}

}

// =========================
// LADDA SKIDOR
// =========================

async function loadSkis(){

alert("Laddar skidor från Supabase...")

const {data, error} = await supabase
.from("skis")
.select("*")

if(error){
alert("SUPABASE ERROR: " + error.message)
console.log(error)
return
}

// 🔍 VISA EXAKT VAD SOM KOMMER
alert("DATA: " + JSON.stringify(data))

console.log("DATA:", data)

skis = data || []

renderWall()

}

// =========================
// RITA SKIDOR
// =========================

function renderWall(){

const wall = document.getElementById("skiWall")

wall.innerHTML = ""

if(skis.length === 0){
wall.innerHTML = "<b>INGA SKIDOR FRÅN SUPABASE</b>"
return
}

skis.forEach(ski => {

const div = document.createElement("div")

div.style.padding = "10px"
div.style.margin = "5px"
div.style.background = "#eee"
div.style.display = "inline-block"

div.innerText = ski.length + " cm"

div.onclick = function(){

if(cart.includes(ski.id)){
cart = cart.filter(id => id !== ski.id)
}else{
cart.push(ski.id)
}

renderCart()

}

wall.appendChild(div)

})

}

// =========================
// VISA VALDA
// =========================

function renderCart(){

const div = document.getElementById("cart")

div.innerHTML = ""

cart.forEach(id => {

const ski = skis.find(s => s.id === id)

if(ski){
div.innerHTML += ski.length + " cm<br>"
}

})

}

// =========================
// SPARA (TEST)
// =========================

function saveBooking(){
alert("KNAPP FUNKAR")
}
