const API_BASE = "https://pool-service-worker.clip-devious-turf.workers.dev"

document.getElementById("signup-form").addEventListener("submit", async e => {
  e.preventDefault()

  const email = document.getElementById("email").value
  const status = document.getElementById("status")

  try {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    })

    if (!res.ok) throw new Error("Request failed")

    status.textContent = "Thanks for signing up!"
  } catch (err) {
    status.textContent = "Signup failed. Please try again."
  }
})
