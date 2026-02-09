const API_BASE = "https://pool.myyear.net";

let adminToken = null;
let currentTab = "unassigned";

/* -------------------------
   IMAGE COMPRESSION (MOBILE SAFE)
--------------------------*/
async function compressToWebP(file, maxSize = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.onload = () => {
        let { width, height } = img;

        // Resize while preserving aspect ratio
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (!blob) return reject("Image compression failed");

            const reader2 = new FileReader();
            reader2.onload = () => {
              // base64 WITHOUT data prefix
              resolve(reader2.result.split(",")[1]);
            };
            reader2.readAsDataURL(blob);
          },
          "image/webp",
          quality
        );
      };

      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* -------------------------
   SHOCK WARNING
--------------------------*/
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
   RENDER TAB
--------------------------*/
function renderTab(buckets) {
  const list = document.getElementById("user-list");
  list.innerHTML = "";

  (buckets[currentTab] || []).forEach(email => {
    const li = document.createElement("li");

    const emailSpan = document.createElement("span");
    emailSpan.textContent = email;
    emailSpan.style.cursor = "pointer";
    emailSpan.style.fontWeight = "bold";
    emailSpan.style.marginRight = "10px";
    emailSpan.onclick = () => {
      document.getElementById("report-email").value = email;
    };

    li.appendChild(emailSpan);

    const select = document.createElement("select");
    ["unassigned","monday","tuesday","wednesday","thursday","friday"].forEach(day => {
      const opt = document.createElement("option");
      opt.value = day === "unassigned" ? null : day;
      opt.textContent = day;
      select.appendChild(opt);
    });

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
   ASSIGN USER
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
   SUBMIT REPORT
--------------------------*/
document.getElementById("report-form").addEventListener("submit", async e => {
  e.preventDefault();

  const beforeFile = document.getElementById("before").files[0];
  const afterFile = document.getElementById("after").files[0];

  const payload = {
    email: document.getElementById("report-email").value,
    stats: {
      ph: document.getElementById("ph").value,
      chlorine: document.getElementById("chlorine").value,
      alkalinity: document.getElementById("alkalinity").value,
      salt: document.getElementById("salt").value,
      cya: document.getElementById("cya").value,
      calcium: document.getElementById("calcium").value
    },
    serviceType: document.getElementById("service-type").value,
    shock: document.getElementById("shock").checked,
    comments: document.getElementById("comments").value,
    before: beforeFile ? await compressToWebP(beforeFile) : null,
    after: afterFile ? await compressToWebP(afterFile) : null
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
