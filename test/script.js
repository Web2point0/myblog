// 🔴 CHANGE THIS
const API = "https://invite-chat.clip-devious-turf.workers.dev"; 
// example: https://board-api.yourdomain.workers.dev

async function login() {
  const user = u.value.trim();
  const pass = p.value;
  const invite = i.value.trim();

  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pass)
  );

  const pwHash = [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const res = await fetch(`${API}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, pwHash, invite })
  });

  if (!res.ok) {
    msg.textContent = "Login failed";
    return;
  }

  const data = await res.json();

  if (data.ok) {
    showDash(user);
  } else {
    msg.textContent = "Login failed";
  }
  
}


function logout() {
  location.href = `${API}/logout`;
}

function showDash(username) {
  login.style.display = "none";
  dash.style.display = "block";
  user.textContent = username;
  loadCats();
  loadPosts();
  checkAdmin();
}

async function loadCats() {
  const r = await fetch(`${API}/categories`, { credentials:"include" });
  const c = await r.json();
  cat.innerHTML = c.map(x=>`<option>${x.name}</option>`).join("");
}

async function loadPosts() {
  const r = await fetch(`${API}/posts`, { credentials:"include" });
  const p = await r.json();

  posts.innerHTML = p.map(x => `
    <div>
      <b>${x.title}</b> — <i>${x.author}</i>
      <div>${marked.parse(x.body)}</div>
      <button onclick="del('${x.id}')">Delete</button>
    </div><hr>
  `).join("");
}

async function createPost() {
  await fetch(`${API}/posts`, {
    method:"POST",
    credentials:"include",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      title:title.value,
      body:body.value,
      category:cat.value,
      media:[]
    })
  });
  body.value="";
  loadPosts();
}

async function del(id) {
  await fetch(`${API}/posts/${id}`, {
    method:"DELETE",
    credentials:"include"
  });
  loadPosts();
}

async function checkAdmin() {
  const r = await fetch(`${API}/admin/invites`, { credentials:"include" });
  if (!r.ok) return;
  admin.style.display="block";
  loadInvites();
}

async function makeInvite() {
  const r = await fetch(`${API}/admin/invite`, {
    method:"POST",
    credentials:"include"
  });
  const d = await r.json();
  alert("Invite: " + d.code);
  loadInvites();
}

async function loadInvites() {
  const r = await fetch(`${API}/admin/invites`, { credentials:"include" });
  const i = await r.json();
  invites.innerHTML = i.map(x =>
    `<li>${x.code} — ${x.usedBy||"UNUSED"}</li>`
  ).join("");
}
