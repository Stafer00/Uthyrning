self.addEventListener("install", event => {
  console.log("Service Worker installerad")
  self.skipWaiting()
})

self.addEventListener("activate", event => {
  console.log("Service Worker aktiv")
})

self.addEventListener("fetch", event => {
  // Viktigt: alltid hämta från nätet (undviker cache-problem)
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Offline", {
        status: 503,
        statusText: "Offline"
      })
    })
  )
})
