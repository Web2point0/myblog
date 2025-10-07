let currentGradient = null;
let currentBgUrl = null;
let currentTextColor = "#ffffff";

function setRandomGradient() {
  const gradients = [
    "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
  ];
  currentGradient = gradients[Math.floor(Math.random() * gradients.length)];
  currentBgUrl = null;

  document.getElementById("banner-container").style.background = currentGradient;
}

function setTextColor(color) {
  currentTextColor = color;
  document.getElementById("banner-container").style.color = currentTextColor;
}

function handleImageUpload(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const preview = document.getElementById("banner-container");
    preview.style.backgroundImage = `url(${e.target.result})`;
    preview.style.backgroundSize = "cover";
    preview.style.backgroundPosition = "center";
    currentBgUrl = e.target.result;
    currentGradient = null;
  };
  reader.readAsDataURL(file);
}

function generateIframe(username) {
  if (!username) {
    alert("Please enter a RuneScape username first.");
    return;
  }

  // --- Live Preview update ---
  const liveBanner = document.getElementById("banner-container");
  if (currentBgUrl) {
    liveBanner.style.background = `url(${currentBgUrl}) center/cover no-repeat`;
  } else if (currentGradient) {
    liveBanner.style.background = currentGradient;
  } else {
    setRandomGradient();
    liveBanner.style.background = currentGradient;
  }

  // Fetch stats + render for live preview
  fetchHiscores(username).then(data => {
    renderBanner(liveBanner, username, data, currentTextColor);
  }).catch(err => {
    liveBanner.innerHTML = `<p style="color:${currentTextColor}; text-align:center;">Error loading stats</p>`;
    console.error(err);
  });

  // --- Iframe Preview update ---
  let src = `https://myyear.net/hiscore/osrs/alpha/ink/your-template.html?user=${encodeURIComponent(username)}&color=${encodeURIComponent(currentTextColor)}`;

  if (currentBgUrl) {
    src += `&bgUrl=${encodeURIComponent(currentBgUrl)}`;
  } else {
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
