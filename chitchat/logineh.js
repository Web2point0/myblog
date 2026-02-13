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

async function generateKeyPair() {
  return crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
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

  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* =========================
   LOGIN LOGIC
========================= */

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  const status = document.getElementById("status");

  if (!usernameEl || !passwordEl) {
    console.error("Login form elements missing");
    return;
  }

  const username = usernameEl.value.trim();
  const password = passwordEl.value;

  if (!username || !password) {
    status.textContent = "All fields are required";
    status.style.color = "red";
    return;
  }

  status.textContent = "Logging in...";
  status.style.color = "black";

  try {
    let account = JSON.parse(localStorage.getItem("account"));

    if (!account) {
      throw new Error("No local account found. Please register again.");
    }

    if (account.username !== username) {
      throw new Error("Username does not match stored account");
    }

    // Verify password by decrypting private key
    const encryptedBytes = Uint8Array.from(
      atob(account.encryptedPrivateKey),
      c => c.charCodeAt(0)
    );

    const salt = new Uint8Array(account.salt);
    const pwKey = await derivePasswordKey(password, salt);

    try {
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: salt },
        pwKey,
        encryptedBytes
      );
    } catch {
      throw new Error("Incorrect password");
    }

    // Cache password for dashboard
    sessionStorage.setItem("chatPassword", password);

    status.textContent = "Login successful!";
    status.style.color = "green";

    window.location.href = "/chitchat/dashboard.html";

  } catch (err) {
    console.error(err);
    status.textContent = err.message;
    status.style.color = "red";
  }
});
