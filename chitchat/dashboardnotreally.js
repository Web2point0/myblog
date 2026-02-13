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
  window.location.href = "/chitchat/dashboard.html";
}


/* =========================
   SESSION INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!account) return;

  startInboxPolling();
});

/* =========================
   HANDLE RESOLUTION
========================= */

async function resolveHandle(handle) {
  const res = await fetch(
    api(`/resolve?handle=${encodeURIComponent(handle)}`)
  );

  if (!res.ok) {
    throw new Error("User not found");
  }

  return res.json();
}

/* =========================
   MESSAGE SEND
========================= */

/* =========================
   SEND MESSAGE WITH RSA
========================= */

async function sendMessage(toHandle, plaintext) {
  // 1. Resolve recipient's public key (viewKey)
  const res = await fetch(`${WORKER_URL}/resolve?handle=${encodeURIComponent(toHandle)}`);
  if (!res.ok) throw new Error("Recipient not found");
  const { viewKey } = await res.json();

  // 2. Import recipient's public key
  const pubKey = await crypto.subtle.importKey(
    "spki",
    Uint8Array.from(atob(viewKey), c => c.charCodeAt(0)),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  // 3. Encrypt the plaintext message
  const encodedMsg = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, encodedMsg);
  const encryptedPayload = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

  // 4. Send to Worker
  const msgRes = await fetch(`${WORKER_URL}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toHandle,
      from: account.handle,
      payload: encryptedPayload
    })
  });

  if (!msgRes.ok) throw new Error("Failed to send message");
}



/* =========================
   FETCH & DECRYPT INBOX
========================= */

async function fetchAndDecryptInbox() {
  const res = await fetch(`${WORKER_URL}/inbox?viewKey=${encodeURIComponent(account.viewKey)}`);
  if (!res.ok) return [];

  const data = await res.json();
  const rawMessages = data.messages || [];

  // Decrypt each message
  const decryptedMessages = [];
  for (const msg of rawMessages) {
    try {
      const privKeyData = Uint8Array.from(
        atob(account.encryptedPrivateKey), c => c.charCodeAt(0)
      );

      // 1. Decrypt private key first
      const salt = new Uint8Array(account.salt);
      const pwKey = await derivePasswordKey(prompt("Enter your password:"), salt); // use saved password in real app
      const decryptedKeyData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: salt },
        pwKey,
        privKeyData
      );

      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        decryptedKeyData,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );

      // 2. Decrypt message payload
      const encryptedArray = Uint8Array.from(atob(msg.payload), c => c.charCodeAt(0));
      const decryptedArray = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedArray);
      const decryptedText = new TextDecoder().decode(decryptedArray);

      decryptedMessages.push({ ...msg, decrypted: decryptedText });
    } catch {
      decryptedMessages.push({ ...msg, decrypted: "[Unable to decrypt]" });
    }
  }

  renderInbox(decryptedMessages);
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
    item.textContent = `From ${msg.from}: ${msg.decrypted}`;
    list.appendChild(item);
  });
}


function openConversation(message) {
  const panel = document.getElementById("conversation");

  try {
    const decrypted = atob(message.payload);
    panel.textContent = decrypted;
  } catch (err) {
    panel.textContent = "Failed to decrypt message.";
  }
}


/* =========================
   Windows messaging tabs
========================= */
window.showTab = function (tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.style.display = "none";
  });

  const active = document.getElementById(tabName);
  if (active) {
    active.style.display = "block";
  }
};

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
      // Placeholder: encrypt before sending
      const encryptedPayload = btoa(message);

      await sendMessage(to, encryptedPayload);
      sendForm.reset();
    } catch (err) {
      alert(err.message);
    }
  });
}
