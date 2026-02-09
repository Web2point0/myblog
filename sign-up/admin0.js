const API_BASE = "https://pool-service-worker.clip-devious-turf.workers.dev"

let adminToken = null

/* -------------------------
   ADMIN LOGIN
--------------------------*/
async function login() {
  const password = document.getElementById("password").value

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    })

    if (!res.ok) throw new Error("Login failed")

    const data = await res.json()
    adminToken = data.token

    document.getElementById("password").value = ""
    loadUsers()
  } catch (err) {
    alert("Invalid admin password")
  }
}

/* -------------------------
   LOAD USERS
--------------------------*/
async function loadUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      "Authorization": `Bearer ${adminToken}`
    }
  })

  if (!res.ok) {
    alert("Unauthorized")
    return
  }

  const users = await res.json()
  const list = document.getElementById("user-list")

  list.innerHTML = ""
  users.forEach(email => {
    const li = document.createElement("li")
    li.textContent = email
    li.style.cursor = "pointer"
    li.onclick = () => {
      document.getElementById("report-email").value = email
    }
    list.appendChild(li)
  })
}

/* -------------------------
   IMAGE TO BASE64 (WEBP)
--------------------------*/
async function fileToBase64(file) {
  if (!file) return null

  // Hard limit safety check (~750 KB before base64)
  if (file.size > 750_000) {
    alert("Image too large. Please upload a smaller WEBP.")
    return null
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  let binary = ""
  bytes.forEach(b => binary += String.fromCharCode(b))

  return btoa(binary)
}

/* -------------------------
   SUBMIT POOL REPORT
--------------------------*/
document
  .getElementById("report-form")
  .addEventListener("submit", async e => {
    e.preventDefault()

    if (!adminToken) {
      alert("Please log in first")
      return
    }

    const payload = {
      email: document.getElementById("report-email").value,
      stats: {
        ph: document.getElementById("ph").value,
        chlorine: document.getElementById("chlorine").value,
        alkalinity: document.getElementById("alkalinity").value
      },
      shock: document.getElementById("shock").checked,
      comments: document.getElementById("comments").value,
      before: await fileToBase64(
        document.getElementById("before").files[0]
      ),
      after: await fileToBase64(
        document.getElementById("after").files[0]
      )
    }

    const res = await fetch(`${API_BASE}/api/admin/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      alert("Failed to send report")
      return
    }

    alert("Report sent successfully!")
    e.target.reset()
  })
