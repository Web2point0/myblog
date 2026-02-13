/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8787"
    : "https://secure-messenger-worker.clip-devious-turf.workers.dev";

/* =========================
   UTILS
========================= */

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64) {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/* =========================
   CRYPTO CORE
========================= */

async function generateKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportKey(key, type) {
  const format = type === "public" ? "spki" : "pkcs8";
  const raw = await crypto.subtle.exportKey(format, key);
  return toBase64(raw);
}

async function importPublicKey(base64Key) {
  return crypto.subtle.importKey(
    "spki",
    fromBase64(base64Key),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

async function importPrivateKey(base64Key) {
  return crypto.subtle.importKey(
    "pkcs8",
    fromBase64(base64Key),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

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
   REGISTRATION
========================= */

document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const username = username.value.trim();
  const password = password.value;
  const handle = handle.value.trim();
  const status = document.getElementById("status");

  if (!username || !password || !handle) {
    status.textContent = "All fields required";
    status.style.color = "red";
    return;
  }

  try {
    status.textContent = "Generating keys...";

    const { publicKey, privateKey } = await generateKeyPair();

    const publicKeyExport = await exportKey(publicKey, "public");
    const privateKeyExport = await exportKey(privateKey, "private");

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const pwKey = await derivePasswordKey(password, salt);

    const encryptedPrivateKey = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      pwKey,
      new TextEncoder().encode(privateKeyExport)
    );

    localStorage.setItem(
      "account",
      JSON.stringify({
        username,
        handle,
        viewKey: publicKeyExport,
        salt: Array.from(salt),
        iv: Array.from(iv),
        encryptedPrivateKey: toBase64(encryptedPrivateKey)
      })
    );

    await fetch(`${WORKER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        viewKey: publicKeyExport
      })
    });

    status.textContent = "Account created successfully!";
    status.style.color = "green";

  } catch (err) {
    console.error(err);
  }
});

/* =========================
   ENCRYPT MESSAGE (HYBRID)
========================= */

async function encryptMessage(message, recipientViewKey) {
  const recipientPublicKey = await importPublicKey(recipientViewKey);

  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedMessage = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(message)
  );

  const rawAES = await crypto.subtle.exportKey("raw", aesKey);

  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAES
  );

  return {
    encryptedMessage: toBase64(encryptedMessage),
    encryptedKey: toBase64(encryptedKey),
    iv: Array.from(iv)
  };
}

/* =========================
   DECRYPT MESSAGE
========================= */

async function decryptMessage(encryptedObj, password) {
  const account = JSON.parse(localStorage.getItem("account"));
  if (!account) throw new Error("No account found");

  const salt = new Uint8Array(account.salt);
  const ivPrivate = new Uint8Array(account.iv);

  const pwKey = await derivePasswordKey(password, salt);

  const decryptedPrivateKeyRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivPrivate },
    pwKey,
    fromBase64(account.encryptedPrivateKey)
  );

  const privateKey = await importPrivateKey(
    new TextDecoder().decode(decryptedPrivateKeyRaw)
  );

  const decryptedAESKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    fromBase64(encryptedObj.encryptedKey)
  );

  const aesKey = await crypto.subtle.importKey(
    "raw",
    decryptedAESKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedMessage = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(encryptedObj.iv) },
    aesKey,
    fromBase64(encryptedObj.encryptedMessage)
  );

  return new TextDecoder().decode(decryptedMessage);
}
