/* =========================
   CONFIG
========================= */

const WORKER_URL = "https://message.myyear.net";

function api(path) {
  return `${WORKER_URL}${path}`;
}


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
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["decrypt"]
  );
}

async function importPrivateKey(base64Key) {
  const binary = Uint8Array.from(
    atob(base64Key),
    c => c.charCodeAt(0)
  );

  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
}

/* =========================
   LOGIN LOGIC
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const banner = document.getElementById("banner");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    banner.textContent = "";
    banner.style.color = "red";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const stored = JSON.parse(localStorage.getItem("account"));

    if (!stored) {
      banner.textContent = "No account found on this device";
      return;
    }

    if (stored.username !== username) {
      banner.textContent = "Invalid username or password";
      return;
    }

    try {
      const salt = new Uint8Array(stored.salt);
      const encryptedPrivateKey = Uint8Array.from(
        atob(stored.encryptedPrivateKey),
        c => c.charCodeAt(0)
      );

      const pwKey = await derivePasswordKey(password, salt);

      let decrypted;
      try {
        decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: salt },
          pwKey,
          encryptedPrivateKey
        );
      } catch {
        throw new Error("Invalid password");
      }

      const privateKeyBase64 = new TextDecoder().decode(decrypted);
      const privateKey = await importPrivateKey(privateKeyBase64);

      // Store active session (memory only)
      sessionStorage.setItem(
        "session",
        JSON.stringify({
          handle: stored.handle,
          viewKey: stored.viewKey
        })
      );

      banner.textContent = "Login successful!";
      banner.style.color = "green";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/chatter/dashboard.html";
      }, 500);

    } catch (err) {
      console.error(err);
      banner.textContent = err.message || "Login failed";
    }
  });
});
