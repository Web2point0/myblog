/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.protocol === "https:"
    ? "https://secure-messenger-worker.clip-devious-turf.workers.dev"
    : "http://127.0.0.1:8787";

/* =========================
   CRYPTO HELPERS
========================= */

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
    ["decrypt"]
  );
}

async function importPrivateKey(base64Key) {
  const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

async function decryptPrivateKey(password) {
  const stored = JSON.parse(localStorage.getItem("account"));
  if (!stored) throw new Error("Account not found");

  const salt = new Uint8Array(stored.salt);
  const encrypted = Uint8Array.from(
    atob(stored.encryptedPrivateKey),
    c => c.charCodeAt(0)
  );

  const pwKey = await derivePasswordKey(password, salt);

  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: salt },
      pwKey,
      encrypted
    );
  } catch {
    throw new Error("Invalid password");
  }

  return importPrivateKey(new TextDecoder().decode(decrypted));
}

async function decryptMessage(privateKey, base64Payload) {
  const encrypted = Uint8Array.from(
    atob(base64Payload),
    c => c.charCodeAt(0)
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

/* =========================
   DASHBOARD LOGIC
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const banner = document.getElementById("banner");
  const list = document.getElementById("messageList");

  const session = JSON.parse(sessionStorage.getItem("session"));
  const stored = JSON.parse(localStorage.getItem("account"));

  if (!session || !stored) {
    location.href = "/index.html";
    return;
  }

  // Ask user for password ONCE to unlock messages
  const password = prompt("Enter your password to unlock messages:");
  if (!password) {
    banner.textContent = "Password required to decrypt messages";
    return;
  }

  let privateKey;
  try {
    privateKey = await decryptPrivateKey(password);
  } catch (err) {
    banner.textContent = err.message;
    banner.style.color = "red";
    return;
  }

  // Fetch inbox
  const res = await fetch(
    `${WORKER_URL}/inbox?viewKey=${encodeURIComponent(session.viewKey)}`
  );

  if (!res.ok) {
    banner.textContent = "Failed to load inbox";
    banner.style.color = "red";
    return;
  }

  const { messages } = await res.json();

  if (!messages.length) {
    list.innerHTML = "<li>No messages yet</li>";
    return;
  }

  // Decrypt and render messages
  for (const msg of messages.reverse()) {
    try {
      const text = await decryptMessage(privateKey, msg.payload);

      const li = document.createElement("li");
      li.className = "message";

      li.innerHTML = `
        <div class="meta">
          <span>${new Date(msg.received).toLocaleString()}</span>
        </div>
        <div class="body">${escapeHtml(text)}</div>
      `;

      list.appendChild(li);
    } catch {
      const li = document.createElement("li");
      li.textContent = "[Unable to decrypt message]";
      list.appendChild(li);
    }
  }
});

/* =========================
   SAFETY
========================= */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
