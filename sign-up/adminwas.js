const API_BASE = "https://pool-service-worker.clip-devious-turf.workers.dev";

let adminToken = null;

function switchTab(day) {
  currentTab = day;
  loadUsers();
}

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
   LOAD USERS
--------------------------*/
let currentTab = "unassigned";

async function loadUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const buckets = await res.json();
  renderTab(buckets);
}

function renderTab(buckets) {
  const list = document.getElementById("user-list");
  list.innerHTML = "";

  (buckets[currentTab] || []).forEach(email => {
    const li = document.createElement("li");
    li.textContent = email;

    // Assign dropdown
    const select = document.createElement("select");
    ["unassigned","monday","tuesday","wednesday","thursday","friday"].forEach(day => {
      const opt = document.createElement("option");
      opt.value = day === "unassigned" ? null : day;
      opt.textContent = day;
      select.appendChild(opt);
    });

    select.onchange = async () => {
      await assignUser(email, select.value);
      loadUsers();
    };

    li.appendChild(select);
    list.appendChild(li);
  });
}

/* -------------------------
   IMAGE → RESIZE → WEBP → BASE64
--------------------------*/
async function fileToBase64(file) {
  if (!file) return null;

  const MAX_WIDTH = 1280;
  const MAX_HEIGHT = 1280;
  const QUALITY = 0.7; // WEBP quality
  const MAX_SIZE = 500_000; // 500 KB final safety cap

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result;
    };

    img.onload = () => {
      let { width, height } = img;

      // Maintain aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const scale = Math.min(
          MAX_WIDTH / width,
          MAX_HEIGHT / height
        );
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
          if (!blob) {
            reject("Image compression failed");
            return;
          }

          if (blob.size > MAX_SIZE) {
            alert("Image too large even after compression.");
            resolve(null);
            return;
          }

          const reader2 = new FileReader();
          reader2.onloadend = () => {
            // Remove data:image/webp;base64,
            const base64 = reader2.result.split(",")[1];
            resolve(base64);
          };
          reader2.readAsDataURL(blob);
        },
        "image/webp",
        QUALITY
      );
    };

    img.onerror = () => reject("Invalid image file");

    reader.readAsDataURL(file);
  });
}

/* -------------------------
   SUBMIT POOL REPORT
--------------------------*/
document
  .getElementById("report-form")
  .addEventListener("submit", async e => {
    e.preventDefault();

    if (!adminToken) {
      alert("Please log in first");
      return;
    }

    const beforeFile = document.getElementById("before").files[0];
    const afterFile = document.getElementById("after").files[0];

    const payload = {
      email: document.getElementById("report-email").value,
      stats: {
        ph: document.getElementById("ph").value,
        chlorine: document.getElementById("chlorine").value,
        alkalinity: document.getElementById("alkalinity").value
      },
      shock: document.getElementById("shock").checked,
      comments: document.getElementById("comments").value,
      before: await fileToBase64(beforeFile),
      after: await fileToBase64(afterFile)
    };

    try {
      const res = await fetch(`${API_BASE}/api/admin/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Send failed");

      alert("Report sent successfully!");
      e.target.reset();

    } catch {
      alert("Failed to send report");
    }
  });
