let currentGradient = null;
let currentBgUrl = null;
let currentTextColor = "#ffffff";
let currentFontFamily = "Arial, sans-serif";

// 🔧 Worker base URL – replace with your own deployed worker URL
 const WORKER_BASE = "https://rs3-banner-worker.clip-devious-turf.workers.dev";

const gradients = [
  "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
  "linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)",
  "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
  "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  "linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)"
];

function setRandomGradient() {
  currentGradient = gradients[Math.floor(Math.random() * gradients.length)];
  currentBgUrl = null;
  updateLivePreview();
}

function setTextColor(color) {
  currentTextColor = color;
  updateLivePreview();
}

function setFontFamily(font) {
  currentFontFamily = font;
  updateLivePreview();
}

// 🔧 Upload image to Cloudflare Worker
async function uploadImage(file) {
  const res = await fetch(`${WORKER_BASE}/upload`, {
    method: "POST",
    body: await file.arrayBuffer(),
  });
  if (!res.ok) throw new Error("Upload failed");
  const { id } = await res.json();
  return `${WORKER_BASE}/bg/${id}`;
}

function handleImageUpload(file) {
  uploadImage(file)
    .then(url => {
      currentBgUrl = url;
      currentGradient = null;
      updateLivePreview();
    })
    .catch(err => {
      console.error("Upload failed, falling back to base64", err);
      const reader = new FileReader();
      reader.onload = e => {
        currentBgUrl = e.target.result;
        updateLivePreview();
      };
      reader.readAsDataURL(file);
    });
}

function updateLivePreview() {
  const preview = document.getElementById("live-preview");
  preview.innerHTML = ""; // clear

  if (currentBgUrl) {
    preview.style.background = `url(${currentBgUrl}) center/cover no-repeat`;
  } else if (currentGradient) {
    preview.style.background = currentGradient;
  } else {
    preview.style.background = "linear-gradient(135deg, #ddd, #999)";
  }

  // Username
  const wrapper = document.createElement("div");
  wrapper.className = "text-wrapper";
  wrapper.style.fontFamily = currentFontFamily;

  const title = document.createElement("div");
  title.className = "banner-username";
  title.textContent = document.getElementById("username").value || "Guest";
  title.style.color = currentTextColor;

  const skills = document.createElement("ul");
  skills.className = "skills-grid";

  // simulate all 29 skills
  for (let i = 0; i < 29; i++) {
    const li = document.createElement("li");
    li.textContent = "99";
    li.style.color = currentTextColor;
    skills.appendChild(li);
  }

  wrapper.appendChild(title);
  wrapper.appendChild(skills);
  preview.appendChild(wrapper);
}

function generateIframe(username) {
  if (!username) {
    alert("Please enter a RuneScape username first.");
    return;
  }

  let src = `https://myyear.net/hiscore/Test13/your-template.html?user=${encodeURIComponent(username)}&color=${encodeURIComponent(currentTextColor)}&font=${encodeURIComponent(currentFontFamily)}`;

  if (currentBgUrl) {
    src += `&bgUrl=${encodeURIComponent(currentBgUrl)}`;
  } else {
    if (!currentGradient) setRandomGradient();
    src += `&gradient=${encodeURIComponent(currentGradient)}`;
  }

  const iframeHtml = `
<iframe 
  src="${src}" 
  width="335" 
  height="249" 
  style="border:none;border-radius:8px;overflow:hidden;" 
  scrolling="no">
</iframe>`;

  document.getElementById("iframe-code").value = iframeHtml.trim();
  document.getElementById("iframe-preview").innerHTML = iframeHtml;
}
