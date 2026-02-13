/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8787"
    : "https://secure-messenger-worker.clip-devious-turf.workers.dev";

const POLL_INTERVAL = 5000;

/* =========================
   HELPERS
========================= */

function api(path) {
  return `${WORKER_URL}${path}`;
}

// Load local account
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

// Derive AES key from password
async function derivePasswordKey(password, salt) {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* =========================
   SESSION INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!account) return;
  fetchAndDecryptInbox();       // initial fetch
  startInboxPolling();
});

/* =========================
   INBOX POLLING
========================= */

function startInboxPolling() {
  setInterval(fetchAndDecryptInbox, POLL_INTERVAL);
}

/* =========================
   SEND MESSAGE WITH RSA
========================= */

async function sendMessage(toHandle, plaintext) {
  // 1. Resolve recipient's public key
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

  // 3. Encrypt message
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
  try {
    const res = await fetch(`${WORKER_URL}/inbox?viewKey=${encodeURIComponent(account.viewKey)}`);
    if (!res.ok) return;

    const data = await res.json();
    const messages = data.messages || [];

    const decryptedMessages = [];

    // Ask for password to decrypt private key
    const password = sessionStorage.getItem("chatPassword") || prompt("Enter your password to decrypt messages:");

    if (!password) return;

    sessionStorage.setItem("chatPassword", password);

    // Import private key
    const privKeyData = Uint8Array.from(atob(account.encryptedPrivateKey), c => c.charCodeAt(0));
    const salt = new Uint8Array(account.salt);
    const pwKey = await derivePasswordKey(password, salt);
    const decryptedKeyData = await crypto.subtle.decrypt({ name: "AES-GCM", iv: salt }, pwKey, privKeyData);

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      decryptedKeyData,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );

    // Decrypt each message
    for (const msg of messages) {
      try {
        const encryptedArray = Uint8Array.from(atob(msg.payload), c => c.charCodeAt(0));
        const decryptedArray = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, encryptedArray);
        const decryptedText = new TextDecoder().decode(decryptedArray);

        decryptedMessages.push({ ...msg, decrypted: decryptedText });
      } catch {
        decryptedMessages.push({ ...msg, decrypted: "[Unable to decrypt]" });
      }
    }

    renderInbox(decryptedMessages);
  } catch (err) {
    console.error("Inbox decryption failed:", err);
  }
}

/* =========================
   UI RENDERING
========================= */

function renderInbox(messages) {
  const list = document.getElementById("messageList");
  if (!list) return;

  list.innerHTML = "";
  messages.forEach(msg => {
    const item = document.createElement("div");
    item.className = "message-item";
    item.textContent = `From ${msg.from}: ${msg.decrypted}`;
    list.appendChild(item);
  });
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
      await sendMessage(to, message);
      sendForm.reset();
      fetchAndDecryptInbox();
    } catch (err) {
      alert(err.message);
    }
  });
}
