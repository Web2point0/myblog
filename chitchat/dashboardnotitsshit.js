/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8787"
    : "https://secure-messenger-worker.clip-devious-turf.workers.dev";

/* =========================
   GLOBAL STATE
========================= */

let unlockedKeys = null;
let account = null;
let pollingInterval = null;

/* =========================
   UTILS
========================= */

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/* =========================
   PASSWORD DERIVATION
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
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/* =========================
   KEY IMPORT
========================= */

async function importPrivateKey(pkcs8, algo, usage) {
  const binary = base64ToBuf(pkcs8);

  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    algo,
    false,
    usage
  );
}

/* =========================
   UNLOCK ACCOUNT
========================= */

async function unlockAccount() {
  account = JSON.parse(localStorage.getItem("account"));

  if (!account) {
    alert("No local account found. Please register first.");
    return false;
  }

  const password = prompt("Enter your password to unlock:");

  if (!password) return false;

  try {
    const salt = new Uint8Array(account.salt);
    const pwKey = await derivePasswordKey(password, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: salt },
      pwKey,
      base64ToBuf(account.encryptedPrivate)
    );

    const { encPrivate, signPrivate } = JSON.parse(
      new TextDecoder().decode(decrypted)
    );

    const decryptKey = await importPrivateKey(
      encPrivate,
      { name: "RSA-OAEP", hash: "SHA-256" },
      ["decrypt"]
    );

    const signingKey = await importPrivateKey(
      signPrivate,
      { name: "RSA-PSS", hash: "SHA-256" },
      ["sign"]
    );

    unlockedKeys = { decryptKey, signingKey };

    return true;

  } catch (err) {
    console.error(err);
    alert("Incorrect password or corrupted account.");
    return false;
  }
}

/* =========================
   AUTHENTICATED INBOX FETCH
========================= */

async function fetchInbox() {
  if (!unlockedKeys) return;

  try {
    // 1️⃣ Request challenge
    const challengeRes = await fetch(`${WORKER_URL}/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: account.handle })
    });

    if (!challengeRes.ok) throw new Error("Challenge request failed");

    const { challenge } = await challengeRes.json();

    // 2️⃣ Sign challenge
    const signature = await crypto.subtle.sign(
      { name: "RSA-PSS", saltLength: 32 },
      unlockedKeys.signingKey,
      new TextEncoder().encode(challenge)
    );

    // 3️⃣ Request inbox
    const inboxRes = await fetch(`${WORKER_URL}/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: account.handle,
        challenge,
        signature: bufToBase64(signature)
      })
    });

    if (!inboxRes.ok) {
      throw new Error("Session invalid or authentication failed.");
    }

    const messages = await inboxRes.json();

    renderInbox(messages);

  } catch (err) {
    console.error(err);
    alert("Session expired. Reloading...");
    clearInterval(pollingInterval);
  }
}

/* =========================
   RENDER INBOX
========================= */

function renderInbox(messages) {
  const inboxEl = document.getElementById("inbox");
  if (!inboxEl) return;

  inboxEl.innerHTML = "";

  if (!Array.isArray(messages)) {
    inboxEl.innerHTML = "<p>No messages.</p>";
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message";
    div.textContent = JSON.stringify(msg);
    inboxEl.appendChild(div);
  });
}

/* =========================
   POLLING
========================= */

function startInboxPolling() {
  fetchInbox();
  pollingInterval = setInterval(fetchInbox, 10000);
}

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
  const unlocked = await unlockAccount();
  if (!unlocked) return;

  startInboxPolling();
});
