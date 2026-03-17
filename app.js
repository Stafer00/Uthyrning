alert("APP JS LADDAS")

// ✅ RÄTT SUPABASE INIT
const supabaseClient = window.supabase.createClient(
  "https://ycasdixhobiaiizevgsi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
    alert("JS KRASH – kolla console")
  }
}

/* ========= LOAD ========= */

async function loadSkis() {
  const { data, error } = await supabaseClient.from("skis").select("*")
  if (error) {
    console.log(error)
    skis = []
    return
  }
  skis = data || []
}

async function loadBookings() {
  const { data, error } = await supabaseClient.from("rentals").select("*")
  if (error) {
    console.log(error)
    rentals = []
    return
  }
  rentals = data || []
}

/* ========= SKI WALL ========= */

function renderWall() {
  const div = document.getElementById("skiWall")
  if (!div) return

  div.innerHTML = ""

  skis.forEach(ski => {
    const el = document.createElement("div")
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
