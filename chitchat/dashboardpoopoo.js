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
      from: account.handle,          // worker will hash this
      payload: encryptedPayload      // encrypted structured object
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
          // Backwards compatibility (old plain text messages)
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

    if (!msg.content) return;

    /* ========= TEXT ========= */
    if (msg.content.type === "text") {
      item.textContent = `From ${msg.content.from}: ${msg.content.message}`;
    }

    /* ========= IMAGE (legacy base64 support) ========= */
    else if (msg.content.type === "image" && msg.content.data) {
      const label = document.createElement("div");
      label.textContent = `From ${msg.content.from}:`;
      item.appendChild(label);

      const img = document.createElement("img");
      img.src = "data:image/webp;base64," + msg.content.data;
      img.style.maxWidth = "250px";
      img.style.marginTop = "5px";
      item.appendChild(img);
    }

    /* ========= NEW MEDIA SYSTEM ========= */
    else if (msg.content.type === "media") {
      const label = document.createElement("div");
      label.textContent = `From ${msg.content.from}:`;
      item.appendChild(label);

      const mediaUrl = api(`/media/${msg.content.mediaId}`);

      // Image
      if (msg.content.fileType.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = mediaUrl;
        img.style.maxWidth = "250px";
        img.style.marginTop = "5px";
        item.appendChild(img);
      }

      // Video
      else if (msg.content.fileType.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = mediaUrl;
        video.controls = true;
        video.style.maxWidth = "250px";
        video.style.marginTop = "5px";
        item.appendChild(video);
      }

      // Fallback download link
      else {
        const link = document.createElement("a");
        link.href = mediaUrl;
        link.textContent = "Download file";
        link.target = "_blank";
        item.appendChild(link);
      }
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
   FORM BINDINGS
========================= */

const sendForm = document.getElementById("sendForm");

if (sendForm) {
  sendForm.addEventListener("submit", async e => {
    e.preventDefault();

    const to = document.getElementById("toHandle").value;
    const message = document.getElementById("messageText").value;

    try {

      // NEW: structured message object
      const messageObject = {
        type: "text",
        from: account.handle,
        message: message
      };

      // Placeholder encryption (replace with real crypto later)
      const encryptedPayload = btoa(JSON.stringify(messageObject));

      await sendMessage(to, encryptedPayload);

      sendForm.reset();

    } catch (err) {
      alert(err.message);
    }
  });
}

/* =========================
   IMAGE SEND + MEDIA MESSAGE FLOW (Relay-only)
========================= */

/**
 * Converts any image File into compressed WebP
 * Returns base64 string directly
 */
async function fileToBase64WebP(file) {
  const bitmap = await createImageBitmap(file);

  const maxWidth = 1280; // resize if too wide
  const scale = Math.min(1, maxWidth / bitmap.width);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1]; // strip data:image/...;base64,
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      },
      "image/webp",
      0.7
    );
  });
}

/**
 * Sends a media message directly as base64
 * @param {string} toHandle - recipient
 * @param {File} file - image/video file
 */
async function sendMediaMessage(toHandle, file) {
  let payloadObj;

  if (file.type.startsWith("image/")) {
    // Convert image to base64 WebP
    const base64Data = await fileToBase64WebP(file);
    payloadObj = {
      type: "image",
      from: account.handle,
      data: base64Data,
      fileType: "image/webp"
    };
  } else {
    // For small videos, optionally convert to base64 (if under ~5MB)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    payloadObj = {
      type: "video",
      from: account.handle,
      data: base64Data,
      fileType: file.type
    };
  }

  const encryptedPayload = btoa(JSON.stringify(payloadObj));

  await sendMessage(toHandle, encryptedPayload);
}

/* =========================
   FORM BINDING FOR MEDIA
========================= */
const mediaForm = document.getElementById("sendMediaForm");
if (mediaForm) {
  mediaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const toHandle = document.getElementById("toHandleMedia").value;
    const fileInput = document.getElementById("mediaFile");

    if (!fileInput.files.length) {
      alert("Please select a file to send");
      return;
    }

    const file = fileInput.files[0];

    // Limit file size (Worker relay only handles small files)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      alert("File too large (5MB max for relay)");
      return;
    }

    try {
      await sendMediaMessage(toHandle, file);
      alert("Media sent successfully!");
      mediaForm.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to send media: " + err.message);
    }
  });
}
