const API_BASE = "https://pool-service-worker.clip-devious-turf.workers.dev";

let adminToken = null;
let currentTab = "unassigned";

function updateShockWarning() {
  const checkbox = document.getElementById("shock");
  const banner = document.getElementById("shock-warning");

  if (!checkbox || !banner) return;

  banner.style.display = checkbox.checked ? "block" : "none";
}

/* -------------------------
   ADMIN LOGIN
--------------------------*/
async function login() {
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    adminToken = data.token;

    document.getElementById("password").value = "";
    loadUsers();
  } catch {
    alert("Invalid admin password");
  }
}

/* -------------------------
   TAB SWITCH
--------------------------*/
function switchTab(day) {
  currentTab = day;
  loadUsers();
}

/* -------------------------
   LOAD USERS
--------------------------*/
async function loadUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  if (!res.ok) {
    alert("Unauthorized");
    return;
  }

  const buckets = await res.json();
  renderTab(buckets);
}

/* -------------------------
   RENDER TAB CONTENT
--------------------------*/
function renderTab(buckets) {
  const list = document.getElementById("user-list");
  list.innerHTML = "";

  (buckets[currentTab] || []).forEach(email => {
    const li = document.createElement("li");

    /* ---- EMAIL (click to autofill) ---- */
    const emailSpan = document.createElement("span");
    emailSpan.textContent = email;
    emailSpan.style.cursor = "pointer";
    emailSpan.style.fontWeight = "bold";
    emailSpan.style.marginRight = "10px";

    emailSpan.onclick = () => {
      document.getElementById("report-email").value = email;
    };

    li.appendChild(emailSpan);

    /* ---- ASSIGN DROPDOWN ---- */
    const select = document.createElement("select");

    ["unassigned", "monday", "tuesday", "wednesday", "thursday", "friday"].forEach(day => {
      const opt = document.createElement("option");
      opt.value = day === "unassigned" ? null : day;
      opt.textContent = day;
      select.appendChild(opt);
    });

    // prevent dropdown clicks from triggering email click
    select.onclick = e => e.stopPropagation();

    select.onchange = async () => {
      await assignUser(email, select.value);
      loadUsers();
    };

    li.appendChild(select);
    list.appendChild(li);
  });
}

/* -------------------------
   ASSIGN / UNASSIGN USER
--------------------------*/
async function assignUser(email, day) {
  await fetch(`${API_BASE}/api/admin/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ email, day })
  });
}

/* -------------------------
   IMAGE TO BASE64
--------------------------*/
async function fileToBase64(file) {
  if (!file) return null;
  if (file.size > 750_000) {
    alert("Image too large");
    return null;
  }

  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/* -------------------------
   SUBMIT REPORT
--------------------------*/
document.getElementById("report-form").addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    email: document.getElementById("report-email").value,
    stats: {
      ph: document.getElementById("ph").value,
      chlorine: document.getElementById("chlorine").value,
      alkalinity: document.getElementById("alkalinity").value,
      salt: document.getElementById("salt").value,
      cya: document.getElementById("cya").value,
      calcium: document.getElementById("calcium").value,
      serviceType: document.getElementById("service-type").value,
    },
    shock: document.getElementById("shock").checked,
    comments: document.getElementById("comments").value,
    before: await fileToBase64(document.getElementById("before").files[0]),
    after: await fileToBase64(document.getElementById("after").files[0])
  };

  const res = await fetch(`${API_BASE}/api/admin/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Failed to send report");
    return;
  }

  alert("Report sent successfully!");
  e.target.reset();
  updateShockWarning();
});

document.getElementById("shock").addEventListener("change", updateShockWarning);
