const supabase = window.supabase.createClient(
"https://ycasdixhobiaiizevgsi.supabase.co",
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis = []
let cart = []

document.getElementById("saveBtn").onclick = saveBooking

startApp()

// =========================
// START
// =========================

async function startApp(){
await loadSkis()
}

// =========================
// LADDA SKIDOR
// =========================

async function loadSkis(){

const {data, error} = await supabase
.from("skis")
.select("*")

if(error){
alert("Fel från Supabase: " + error.message)
return
}

skis = data || []

renderWall()

}

// =========================
// VISA ALLA SKIDOR
// =========================

function renderWall(){

const wall = document.getElementById("skiWall")
wall.innerHTML = ""

skis.forEach(ski => {

const btn = document.createElement("div")

btn.innerText = ski.length + " cm"

btn.style.display = "inline-block"
btn.style.margin = "5px"
btn.style.padding = "12px"
btn.style.borderRadius = "8px"
btn.style.cursor = "pointer"
btn.style.minWidth = "60px"
btn.style.textAlign = "center"

/* FÄRG */
if(cart.includes(ski.id)){
btn.style.background = "green"
btn.style.color = "white"
}else{
btn.style.background = "#eee"
}

/* KLICK */
btn.onclick = function(){

if(cart.includes(ski.id)){
cart = cart.filter(id => id !== ski.id)
}else{
cart.push(ski.id)
}

renderWall()
renderCart()

}

wall.appendChild(btn)

})

}

// =========================
// VISA VALDA SKIDOR
// =========================

function renderCart(){

const div = document.getElementById("cart")
div.innerHTML = ""

cart.forEach(id => {

const ski = skis.find(s => s.id === id)

if(ski){

const item = document.createElement("div")

item.innerText = ski.length + " cm"

item.style.display = "inline-block"
item.style.margin = "5px"
item.style.padding = "8px"
item.style.background = "#ddd"
item.style.borderRadius = "6px"

div.appendChild(item)

}

})

}

// =========================
// SPARA (placeholder)
// =========================

function saveBooking(){
alert("Nästa steg: spara bokning")
}
