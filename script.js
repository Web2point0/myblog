let page = 1
const API = "https://news-updates-worker.clip-devious-turf.workers.dev"

async function loadNews() {
  const res = await fetch(`${API}?page=${page}`)
  const data = await res.json()

  const container = document.getElementById("news")
  container.innerHTML = ""

  data.posts.forEach(post => {
    const div = document.createElement("div")
    div.className = "post"

    const preview = post.message.slice(0, 120) + "..."

    div.innerHTML = `
      <h4>${post.subject}</h4>
      <p class="preview">${preview}</p>
      <p class="full" style="display:none">${post.message}</p>
    `

    div.onclick = () => {
      const full = div.querySelector(".full")
      const prev = div.querySelector(".preview")
      full.style.display = full.style.display === "none" ? "block" : "none"
      prev.style.display = prev.style.display === "none" ? "block" : "none"
    }

    container.appendChild(div)
  })
}

async function postNews() {
  const password = document.getElementById("password").value
  const subject = document.getElementById("subject").value
  const message = document.getElementById("message").value

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, subject, message })
  })

  if (res.ok) {
    alert("Posted!")
    loadNews()
  } else {
    alert("Invalid password")
  }
}

document.getElementById("next").onclick = () => {
  page++
  loadNews()
}

document.getElementById("prev").onclick = () => {
  if (page > 1) page--
  loadNews()
}

loadNews()
