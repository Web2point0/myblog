/* =========================
   CONFIG
========================= */

const WORKER_URL = "https://secure-messenger-worker.clip-devious-turf.workers.dev";
const POLL_INTERVAL = 5000;


/* =========================
   HELPERS
========================= */

function api(path) {
  return `${WORKER_URL}${path}`;
}

function loadAccount() {
  const raw = localStorage.getItem("account");
  if (!raw) {
    window.location.href = "/index.html";
    return null;
  }
  return JSON.parse(raw);
}

const account = loadAccount();

if (!account?.viewKey) {
  alert("Session invalid. Please log in again.");
  localStorage.clear();
  window.location.href = "/index.html";
}


/* =========================
   IMAGE COMPRESSION (WebP)
========================= */

async function compressImageToWebPBase64(file, quality = 0.7) {
  const bitmap = await createImageBitmap(file);

  // Resize large images (max width 1280px for performance)
  const maxWidth = 1280;
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = Math.round((maxWidth / width) * height);
    width = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/webp", quality)
  );

  // 5MB safety limit
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error("Image too large after compression (max 5MB)");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}


/* =========================
   SESSION INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!account) return;

  const welcomeEl = document.getElementById("userHandle");
  if (welcomeEl) {
    welcomeEl.textContent = `Welcome, ${account.handle}`;
  }

  startInboxPolling();
});


/* =========================
   MESSAGE SEND
========================= */

async function sendMessage(toHandle, encryptedPayload) {
  const res = await fetch(api("/message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toHandle.trim(),
      from: account.handle,
      payload: encryptedPayload
    })
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }
}


/* =========================
   INBOX
========================= */

async function fetchInbox() {
  const res = await fetch(
    api(`/inbox?viewKey=${encodeURIComponent(account.viewKey)}`)
  );

  if (!res.ok) {
    return { messages: [] };
  }

  return res.json();
}

async function startInboxPolling() {
  await refreshInbox();

  setInterval(async () => {
    await refreshInbox();
  }, POLL_INTERVAL);
}

async function refreshInbox() {
  try {
    const data = await fetchInbox();

    const processedMessages = (data.messages || []).map(msg => {
      let decryptedObj = null;

      try {
        const decoded = atob(msg.payload);

        try {
          decryptedObj = JSON.parse(decoded);
        } catch {
          decryptedObj = {
            type: "text",
            from: "[Unknown]",
            message: decoded
          };
        }

      } catch {
        decryptedObj = {
          type: "text",
          from: "[Corrupted]",
          message: "Unable to decrypt message"
        };
      }

      return {
        ...msg,
        content: decryptedObj
      };
    });

    renderInbox(processedMessages);

  } catch (err) {
    console.error("Inbox refresh failed", err);
  }
}


/* =========================
   UI RENDERING
========================= */

function renderInbox(messages) {
  const list = document.getElementById("messageList");
  if (!list) return;

  list.innerHTML = "";

  messages.forEach((msg) => {
    const item = document.createElement("div");
    item.className = "message-item";

    // TEXT MESSAGE
    if (msg.content.type === "text") {
      item.textContent = `From ${msg.content.from}: ${msg.content.message}`;
    }

    // IMAGE MESSAGE
    if (msg.content.type === "image") {
      const label = document.createElement("div");
      label.textContent = `From ${msg.content.from}:`;
      item.appendChild(label);

      const img = document.createElement("img");

      // Strict WebP data URI only
      img.src = `data:image/webp;base64,${msg.content.data}`;
      img.style.maxWidth = "250px";
      img.style.marginTop = "5px";
      img.loading = "lazy";

      item.appendChild(img);
    }

    list.appendChild(item);
  });
}


/* =========================
   SETTINGS ACTIONS
========================= */

async function deleteAllMessages() {
  const res = await fetch(api("/delete-messages"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      viewKey: account.viewKey
    })
  });

  if (!res.ok) {
    alert("Failed to delete messages");
    return;
  }

  renderInbox([]);
}

async function deleteAccount() {
  const confirmed = confirm(
    "This will permanently delete your account and all messages. Continue?"
  );

  if (!confirmed) return;

  const res = await fetch(api("/delete-account"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      viewKey: account.viewKey,
      handle: account.handle
    })
  });

  if (!res.ok) {
    alert("Account deletion failed");
    return;
  }

  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/index.html";
}


/* =========================
   LOGOUT
========================= */

function logout() {
  sessionStorage.clear();
  localStorage.clear();
  window.privateKey = null;
  window.location.href = "/";
}


/* =========================
   FORM BINDINGS
========================= */

const sendForm = document.getElementById("sendForm");

if (sendForm) {
  sendForm.addEventListener("submit", async e => {
    e.preventDefault();

    const to = document.getElementById("toHandle").value.trim();
    const message = document.getElementById("messageText").value;
    const imageFile = document.getElementById("imageInput")?.files[0];

    try {

      let messageObject;

      // IMAGE MESSAGE
      if (imageFile) {

        const base64Image = await compressImageToWebPBase64(imageFile);

        messageObject = {
          type: "image",
          from: account.handle,
          data: base64Image
        };

      } else {

        messageObject = {
          type: "text",
          from: account.handle,
          message: message
        };
      }

      const encryptedPayload = btoa(JSON.stringify(messageObject));

      await sendMessage(to, encryptedPayload);

      sendForm.reset();

    } catch (err) {
      alert(err.message);
    }
  });
}
