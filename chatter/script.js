/* =========================
   CONFIG
========================= */

const WORKER_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8787"
    : "https://message.myyear.net";

/* =========================
   CRYPTO HELPERS
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
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
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
    status.textContent = "All fields are required";
    status.style.color = "red";
    return;
  }

  status.textContent = "Creating account...";
  status.style.color = "black";

  try {
    // 1. Generate keys
    const { publicKey, privateKey } = await generateKeyPair();

    const viewKey = await exportKey(publicKey, "public");
    const privateKeyExport = await exportKey(privateKey, "private");

    // 2. Encrypt private key with password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const pwKey = await derivePasswordKey(password, salt);

    const encryptedPrivateKey = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: salt },
      pwKey,
      new TextEncoder().encode(privateKeyExport)
    );

    // 3. Store locally (client-only)
    localStorage.setItem(
      "account",
      JSON.stringify({
        username,
        handle,
        viewKey,
        salt: Array.from(salt),
        encryptedPrivateKey: btoa(
          String.fromCharCode(...new Uint8Array(encryptedPrivateKey))
        )
      })
    );

    // 4. Register with Worker (ALIGNED PAYLOAD)
    const res = await fetch(`${WORKER_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, viewKey })
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Registration failed");
    }

    status.textContent = "Account creation was a success!";
    status.style.color = "green";
    setTimeout(() => {
      window.location.href = "/chatter/";
      }, 1200);

  } catch (err) {
    console.error(err);
    status.textContent = err.message;
    status.style.color = "red";
  }
});
