let currentGradient = null;
let currentBgUrl = null;
let currentTextColor = "#ffffff";
let currentFont = "Arial, sans-serif";
let currentMode = "text"; // text, icons, iconsText

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

function setFontFamily(font) {
  currentFont = font;
  document.getElementById("banner-container").style.fontFamily = currentFont;
}

function setMode(mode) {
  currentMode = mode;
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

function generateIframe(username, game) {
  if (!username) {
    alert("Please enter a RuneScape username first.");
    return;
  }

  let src = `https://myyear.net/hiscore/Baseline/your-template.html?user=${encodeURIComponent(username)}&color=${encodeURIComponent(currentTextColor)}&game=${encodeURIComponent(game)}&font=${encodeURIComponent(currentFont)}&mode=${encodeURIComponent(currentMode)}`;

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
