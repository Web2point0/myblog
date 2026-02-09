// ==========================
// Config
// ==========================
const WORKER_URL = "https://rs3-banner-worker.myyear.net"; // replace with your worker URL
const GRADIENTS = [
  "linear-gradient(135deg, #1abc9c, #16a085)",
  "linear-gradient(135deg, #3498db, #2980b9)",
  "linear-gradient(135deg, #9b59b6, #8e44ad)",
  "linear-gradient(135deg, #f39c12, #d35400)",
  "linear-gradient(135deg, #e74c3c, #c0392b)",
  "linear-gradient(135deg, #2ecc71, #27ae60)",
  "linear-gradient(135deg, #34495e, #2c3e50)"
];

// ==========================
// DOM References
// ==========================
const usernameInput = document.getElementById("username");
const gameSelect = document.getElementById("game");
const colorInput = document.getElementById("textColor");
const fontSelect = document.getElementById("fontFamily");
const modeSelect = document.getElementById("displayMode");
const uploadInput = document.getElementById("uploadBg");
const randomBgBtn = document.getElementById("randomBgBtn");
const generateBtn = document.getElementById("generateBtn");

const preview = document.getElementById("preview");
const embedCodeArea = document.getElementById("embedCode");

// ==========================
// Background State
// ==========================
let currentBgId = null;       // for Worker-stored image
let currentGradient = null;   // for gradient fallback

// ==========================
// Helpers
// ==========================
function pickRandomGradient() {
  return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${WORKER_URL}/upload`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.id; // Worker returns { id: "shortId" }
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

// ==========================
// Event Handlers
// ==========================
uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    const id = await uploadImage(file);
    if (id) {
      currentBgId = id;
      currentGradient = null;
      updatePreview();
    }
  }
});

randomBgBtn.addEventListener("click", () => {
  currentGradient = pickRandomGradient();
  currentBgId = null;
  updatePreview();
});

generateBtn.addEventListener("click", () => {
  updatePreview();
  updateEmbedCode();
});

// ==========================
// Preview + Embed
// ==========================
function updatePreview() {
  const username = usernameInput.value.trim() || "Player";
  const game = gameSelect.value;
  const color = colorInput.value;
  const font = fontSelect.value;
  const mode = modeSelect.value;

  let bgStyle = "";
  if (currentBgId) {
    bgStyle = `background-image:url(${WORKER_URL}/bg/${currentBgId}); background-size:cover;`;
  } else if (currentGradient) {
    bgStyle = `background:${currentGradient};`;
  } else {
    bgStyle = `background:${pickRandomGradient()};`; // default
  }

  preview.innerHTML = `
    <div id="banner" style="${bgStyle} width:335px; height:249px; border-radius:8px; overflow:hidden; color:${color}; font-family:${font}; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; padding:8px; box-sizing:border-box;">
      <h2 style="margin:0; padding:4px 0;">${username}</h2>
      <ul class="banner-skills" style="flex-grow:1; list-style:none; display:grid; grid-template-columns:repeat(3, auto); justify-content:center; align-content:start; gap:4px 8px; padding:0; margin:0; overflow:hidden; font-size:85%;">
        <li>Attack 99</li>
        <li>Strength 99</li>
        <li>Defence 99</li>
        <!-- demo only, actual stats populated in your-template.html -->
      </ul>
    </div>
  `;
}

function updateEmbedCode() {
  const username = usernameInput.value.trim() || "Player";
  const game = gameSelect.value;
  const color = colorInput.value;
  const font = fontSelect.value;
  const mode = modeSelect.value;

  let bgParam = "";
  if (currentBgId) {
    bgParam = `&bg=${currentBgId}`;
  } else if (currentGradient) {
    bgParam = `&gradient=${encodeURIComponent(currentGradient)}`;
  }

  const iframeCode = `<iframe src="https://myyear.net/hiscore/rs3/beta3/your-template.html?username=${encodeURIComponent(username)}&game=${game}&color=${encodeURIComponent(color)}&font=${encodeURIComponent(font)}&mode=${mode}${bgParam}" width="335" height="249" style="border-radius:8px; border:none; overflow:hidden;" scrolling="no"></iframe>`;

  embedCodeArea.value = iframeCode;
  embedCodeArea.addEventListener("click", () => embedCodeArea.select());
}


