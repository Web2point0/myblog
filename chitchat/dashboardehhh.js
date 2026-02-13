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

if (!account?.viewKey) {
  alert("Session invalid. Please log in again.");
  localStorage.clear();
  window.location.href = "/chitchat/dashboard.html";
}


/* =========================
   SESSION INIT
========================= */

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
  const res = await fetch(api("/message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toHandle.trim(),        // recipient handle
      from: account.handle,       // ✅ ADD sender handle
      payload: encryptedPayload  // encrypted message object
    })
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }
}


/* =========================
   INBOX
========================= */

async function fetchInbox() {
  const res = await fetch(
    api(`/inbox?viewKey=${encodeURIComponent(account.viewKey)}`)
  );

  if (!res.ok) {
    return { messages: [] };
  }

  return res.json();
}

async function startInboxPolling() {
  await refreshInbox();

  setInterval(async () => {
    await refreshInbox();
  }, POLL_INTERVAL);
}

async function refreshInbox() {
  try {
    const data = await fetchInbox();

    const decryptedMessages = (data.messages || []).map(msg => {
      let decrypted = "[Unable to decrypt]";

      try {
        decrypted = atob(msg.payload);
      } catch (e) {}

      return {
        ...msg,
        decrypted
      };
    });

    renderInbox(decryptedMessages);
  } catch (err) {
    console.error("Inbox refresh failed", err);
  }
}


/* =========================
   UI RENDERING
========================= */

function renderInbox(messages) {
  const list = document.getElementById("messageList");
  if (!list) return;

  list.innerHTML = "";

  messages.forEach((msg, index) => {
    const item = document.createElement("div");
    item.className = "message-item";

    item.textContent = msg.decrypted;
    list.appendChild(item);
  });
}

function openConversation(message) {
  const panel = document.getElementById("conversation");

  try {
    const decrypted = atob(message.payload);
    panel.textContent = decrypted;
  } catch (err) {
    panel.textContent = "Failed to decrypt message.";
  }
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
