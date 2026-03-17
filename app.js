alert("APP JS LADDAS")

const supabase = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYXNkaXhob2JpYWlpemV2Z3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTMxODksImV4cCI6MjA4ODkyOTE4OX0.KtJFN_RhN8WIIPPYX1TfnyZYCdlhug7SBqYnMALOw2c"
)

let skis = []
let rentals = []
let cart = []
let weekOffset = 0

window.onload = init

async function init() {

  console.log("INIT START")

  try {

    const btn = document.getElementById("saveBtn")
    if (btn) btn.onclick = saveBooking

    await loadSkis()
    await loadBookings()

    renderWall()
    renderWeek()
    renderRentals()

  } catch (e) {
    console.log("KRASH:", e)
    alert("JS KRASH - kolla console")
  }

}

/* ========= LOAD ========= */

async function loadSkis() {
  try {
    const { data } = await supabase.from("skis").select("*")
    skis = data || []
    console.log("Skidor:", skis.length)
  } catch (e) {
    console.log("Fel loadSkis", e)
  }
}

async function loadBookings() {
  try {
    const { data } = await supabase.from("rentals").select("*")
    rentals = data || []
    console.log("Bokningar:", rentals.length)
  } catch (e) {
    console.log("Fel loadBookings", e)
  }
}

/* ========= SKI WALL ========= */

function renderWall() {
  const div = document.getElementById("skiWall")
  if (!div) return

  div.innerHTML = ""

  skis.forEach(ski => {
    let el = document.createElement("div")
    el.innerText = ski.length + " cm"

    el.onclick = () => {
      cart.push(ski.id)
      renderCart()
    }

    div.appendChild(el)
  })
}

/* ========= CART ========= */

function renderCart() {
  const div = document.getElementById("cart")
  if (!div) return

  div.innerHTML = ""

  cart.forEach(id => {
    let ski = skis.find(s => s.id === id)
    if (ski) div.innerHTML += ski.length + " cm<br>"
  })
}

/* ========= SAVE ========= */

async function saveBooking() {

  let name = document.getElementById("customer")?.value
  let start = document.getElementById("start")?.value
  let end = document.getElementById("end")?.value

  if (!name || !start || !end || cart.length === 0) {
    alert("Fyll i allt")
    return
  }

  await supabase.from("rentals").insert({
    name,
    start,
    end,
    items: JSON.stringify(cart),
    returned: false
  })

  cart = []
  renderCart()

  await loadBookings()

  renderWeek()
  renderRentals()
}

/* ========= KALENDER ========= */

function renderWeek() {

  const div = document.getElementById("calendar")
  if (!div) return

  if (!skis.length) {
    div.innerHTML = "Inga skidor"
    return
  }

  let html = "<table border='1'>"

  skis.forEach(ski => {
    html += "<tr><td>" + ski.length + "</td><td>OK</td></tr>"
  })

  html += "</table>"

  div.innerHTML = html
}

/* ========= LISTA ========= */

function renderRentals() {
  const div = document.getElementById("rentals")
  if (!div) return

  div.innerHTML = rentals.length + " bokningar"
}

/* ========= NAV ========= */

function prevWeek() {}
function nextWeek() {}
