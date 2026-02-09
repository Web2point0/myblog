// script.js
const MAX_RAW_BYTES = Math.floor(25 * 1024 * 1024 * 0.75); // ~18.75 MiB limit

// 🔹 Change this to where your static site (special.html, index.html) is hosted
const SITE_BASE = "https://myyear.net/upload/"; 

// 🔹 Change this to your Cloudflare Worker endpoint
const UPLOAD_URL = "https://uploader.myyear.net/upload";  

const fileInput = document.getElementById('fileInput');
const summary = document.getElementById('summary');
const uploadForm = document.getElementById('uploadForm');
const result = document.getElementById('result');
const uploadBtn = document.getElementById('uploadBtn');

function formatBytes(n){
  if (n < 1024) return n + ' B';
  if (n < 1024*1024) return (n/1024).toFixed(2)+' KiB';
  return (n/(1024*1024)).toFixed(2)+' MiB';
}

fileInput.addEventListener('change', updateSummary);

function updateSummary(){
  const files = Array.from(fileInput.files || []);
  const total = files.reduce((s,f)=> s + f.size, 0);
  let html = '';
  if(files.length === 0) html = '<em>No files selected</em>';
  else {
    html = `<strong>${files.length}</strong> file(s) — total ${formatBytes(total)}<ul>`;
    for(const f of files){
      html += `<li>${f.name} — ${formatBytes(f.size)}</li>`;
    }
    html += '</ul>';
  }
  html += `<p class="small">Client limit: ${formatBytes(MAX_RAW_BYTES)}</p>`;
  summary.innerHTML = html;
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.innerHTML = '';
  const files = Array.from(fileInput.files || []);
  if(files.length === 0){
    result.textContent = 'No files selected.';
    return;
  }
  const total = files.reduce((s,f)=> s + f.size, 0);
  if(total > MAX_RAW_BYTES){
    result.innerHTML = `<strong style="color:crimson">Total exceeds limit:</strong> ${formatBytes(total)} > ${formatBytes(MAX_RAW_BYTES)}.`;
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading…';

  try {
    // Convert files to base64
    const readPromises = files.map(f => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const dataUrl = r.result;
        const comma = dataUrl.indexOf(',');
        const base64 = dataUrl.slice(comma+1);
        res({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, base64 });
      };
      r.onerror = () => rej(r.error);
      r.readAsDataURL(f);
    }));

    const payloadFiles = await Promise.all(readPromises);

    // Upload to Worker
    const resp = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: payloadFiles })
    });

    if(!resp.ok){
      const txt = await resp.text();
      throw new Error(`Upload failed: ${resp.status} ${resp.statusText} — ${txt}`);
    }

    const j = await resp.json(); // { ids: [...] }
    let html = '<h3>Uploaded</h3><ul>';
    for(const item of j.ids){
      const share = `${SITE_BASE}special.html?id=${encodeURIComponent(item.id)}`;
      html += `<li><strong>${item.name}</strong> — ${formatBytes(item.size)} — id: <code>${item.id}</code> — <a href="${share}" target="_blank">view/share</a></li>`;
    }
    html += '</ul>';
    result.innerHTML = html;

  } catch (err){
    console.error(err);
    result.innerHTML = `<strong style="color:crimson">Error:</strong> ${err.message}`;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload';
  }
});
