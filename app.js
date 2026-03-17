alert("APP JS LADDAS")

const supabaseClient = window.supabase.createClient(
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

    console.log("SKIS DATA:", skis)

    renderWall()
    renderWeek()
    renderRentals()

  } catch (e) {
    console.log("KRASH:", e)
    alert("JS KRASH – kolla console")
  }
}

/* ========= LOAD ========= */

async function loadSkis() {
  try {
    const { data, error } = await supabaseClient.from("skis").select("*")

    if (error) {
      console.log("SKIS ERROR:", error)
      skis = []
      return
    }

    skis = data || []

  } catch (e) {
    console.log("LOAD SKIS CRASH:", e)
    skis = []
  }
}

async function loadBookings() {
  try {
    const { data, error } = await supabaseClient.from("rentals").select("*")

    if (error) {
      console.log("RENTALS ERROR:", error)
      rentals = []
      return
    }

    rentals = data || []

  } catch (e) {
    console.log("LOAD BOOKINGS CRASH:", e)
    rentals = []
  }
}

/* ========= SKI WALL ========= */

function renderWall() {
  const div = document.getElementById("skiWall")
  if (!div) return

  div.innerHTML = ""

  skis.forEach(ski => {
    const el = document.createElement("div")
    el.style.padding = "10px"
    el.style.border = "1px solid #ccc"
    el.style.margin = "5px"
    el.style.cursor = "pointer"

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
    const ski = skis.find(s => s.id === id)
    if (ski) div.innerHTML += ski.length + " cm<br>"
  })
}

/* ========= SAVE ========= */

async function saveBooking() {

  const name = document.getElementById("customer").value
  const start = document.getElementById("start").value
  const end = document.getElementById("end").value

  if (!name || !start || !end || cart.length === 0) {
    alert("Fyll i alla fält")
    return
  }

  const { error } = await supabaseClient.from("rentals").insert({
    name,
    start,
    end,
    items: JSON.stringify(cart),
    returned: false
  })

  if (error) {
    alert(error.message)
    return
  }

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
    div.innerHTML = "<p>❌ Inga skidor laddade</p>"
    return
  }

  let html = "<table border='1' style='margin-top:10px'>"

  skis.forEach(ski => {
    html += `<tr>
      <td>${ski.length} cm</td>
      <td style="color:green">Ledig</td>
    </tr>`
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
