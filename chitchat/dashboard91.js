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

/* =========================
   SESSION INIT
========================= */
function startInboxPolling() {
// refresh immediately
refreshInbox();

setInterval() => {
refreshInbox();
}, 500);
}

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

async function sendMessage(toHandle, encryptedPayload) {
  const { viewKey } = await resolveHandle(toHandle);

  const res = await fetch(api("/message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: viewKey,
      payload: encryptedPayload
    })
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }
}

/* =========================
   INBOX
========================= */

async function refreshInbox() {
  try {
    const res = await fetch(
      `${WORKER_URL}/inbox?viewKey=${encodeURIComponent(session.viewKey)}`
    );

    if (!res.ok) {
      throw new Error("Inbox fetch failed");
    }

    const data = await res.json();

    // 🔒 HARD GUARD — THIS FIXES YOUR ERROR
    const messages = Array.isArray(data.messages)
      ? data.messages
      : [];

    renderInbox(messages);

  } catch (err) {
    console.error("Inbox refresh failed", err);
  }
}

/* =========================
   UI RENDERING
========================= */

function renderInbox(messages) {
  const list = document.getElementById("messageList");
  list.innerHTML = "";

  if (messages.length === 0) {
    list.innerHTML = "<li>No messages yet</li>";
    return;
  }

  messages.forEach(msg => {
    const li = document.createElement("li");
    li.className = "message";

    li.textContent = "[Encrypted message]";
    list.appendChild(li);
  });
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
