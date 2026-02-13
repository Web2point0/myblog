/* =========================
   CONFIG
========================= */

const WORKER_URL = "https://secure-messenger-worker.clip-devious-turf.workers.dev";

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

      /* =========================
         ✅ LOGIN SUCCESS
      ========================= */

      // Store active session (memory only)
      sessionStorage.setItem(
        "session",
        JSON.stringify({
          handle: stored.handle,
          viewKey: stored.viewKey
        })
      );

      // ✅ Persist handle for dashboard & messaging
      // This is the missing link that caused "From undefined"
      localStorage.setItem("handle", stored.handle);

      banner.textContent = "Login successful!";
      banner.style.color = "green";

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/chitchat/dashboard.html";
      }, 500);

    } catch (err) {
      console.error(err);
      banner.textContent = err.message || "Login failed";
    }
  });
});

/* =========================
   ACCOUNT RECOVERY
========================= */

function showRestore() {
  document.getElementById("restoreSection").style.display = "block";
  document.getElementById("restoreToggle").style.display = "none";
}

function showRegister() {
  document.getElementById("restoreSection").style.display = "none";
  document.getElementById("restoreToggle").style.display = "block";
}

async function handleRestore() {
  const handle = document.getElementById("restoreHandle").value.trim();
  const viewKey = document.getElementById("restoreViewKey").value.trim();
  const privateKey = document.getElementById("restorePrivateKey").value.trim();

  if (!handle || !viewKey) {
    alert("Handle and View Key are required.");
    return;
  }

  try {
    const res = await fetch(api("/validate-account"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, viewKey })
    });

    if (!res.ok) {
      alert("Invalid handle or view key.");
      return;
    }

    // Save back into localStorage
    localStorage.setItem("account", JSON.stringify({
      handle,
      viewKey,
      privateKey   // will just store empty string if unused
    }));

    window.location.href = "/chitchat/dashboard.html";

  } catch (err) {
    alert("Account restore failed.");
    console.error(err);
  }
}

