/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8787"
    : "https://secure-messenger-worker.clip-devious-turf.workers.dev";

/* =========================
   CRYPTO HELPERS
========================= */

// Generate signing + encryption key pairs
async function generateKeyPairs() {
  const encryptionKeys = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  const signingKeys = await crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );

  return { encryptionKeys, signingKeys };
}

async function exportKey(key, format) {
  const raw = await crypto.subtle.exportKey(format, key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function importPrivateKey(pkcs8, algo) {
  const binary = Uint8Array.from(atob(pkcs8), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    algo,
    false,
    ["decrypt", "sign"]
  );
}

async function importPublicKey(spki, algo, usage) {
  const binary = Uint8Array.from(atob(spki), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "spki",
    binary,
    algo,
    false,
    usage
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
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/* =========================
   REGISTRATION
========================= */

document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const handle = document.getElementById("handle").value.trim();
  const status = document.getElementById("status");

  if (!username || !password || !handle) {
    status.textContent = "All fields required";
    status.style.color = "red";
    return;
  }

  try {
    status.textContent = "Generating secure keys...";

    const { encryptionKeys, signingKeys } = await generateKeyPairs();

    const encPublic = await exportKey(encryptionKeys.publicKey, "spki");
    const encPrivate = await exportKey(encryptionKeys.privateKey, "pkcs8");

    const signPublic = await exportKey(signingKeys.publicKey, "spki");
    const signPrivate = await exportKey(signingKeys.privateKey, "pkcs8");

    // Encrypt private keys with password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pwKey = await derivePasswordKey(password, salt);

    const encryptedPrivate = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: salt },
      pwKey,
      new TextEncoder().encode(
        JSON.stringify({ encPrivate, signPrivate })
      )
    );

    localStorage.setItem(
      "account",
      JSON.stringify({
        username,
        handle,
        encPublic,
        signPublic,
        salt: Array.from(salt),
        encryptedPrivate: bufToBase64(encryptedPrivate)
      })
    );

    await fetch(`${WORKER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle,
        encPublic,
        signPublic
      })
    });

    status.textContent = "Account created securely.";
    status.style.color = "green";
  } catch (err) {
    status.textContent = err.message;
    status.style.color = "red";
  }
});

/* =========================
   AUTHENTICATED INBOX ACCESS
========================= */

async function unlockPrivateKeys(password) {
  const account = JSON.parse(localStorage.getItem("account"));
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

  const decryptKey = await importPrivateKey(encPrivate, {
    name: "RSA-OAEP",
    hash: "SHA-256"
  });

  const signingKey = await importPrivateKey(signPrivate, {
    name: "RSA-PSS",
    hash: "SHA-256"
  });

  return { decryptKey, signingKey };
}

async function fetchInbox(password) {
  const account = JSON.parse(localStorage.getItem("account"));
  const { signingKey } = await unlockPrivateKeys(password);

  // 1. Get challenge from worker
  const challengeRes = await fetch(`${WORKER_URL}/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: account.handle })
  });

  const { challenge } = await challengeRes.json();

  // 2. Sign challenge
  const signature = await crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    signingKey,
    new TextEncoder().encode(challenge)
  );

  // 3. Request inbox with signature proof
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
    throw new Error("Authentication failed");
  }

  return inboxRes.json();
}
