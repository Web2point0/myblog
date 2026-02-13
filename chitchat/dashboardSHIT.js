/* =========================
   CONFIG
========================= */

// 🔴 IMPORTANT: your Worker origin
const WORKER_ORIGIN = "https://secure-messenger-worker.clip-devious-turf.workers.dev";

function api(path) {
  return WORKER_ORIGIN + path;
}

/* =========================
   AUTH / IDENTITY
========================= */

function requireHandle() {
  const handle = localStorage.getItem("handle");
  if (!handle) {
    alert("You are not logged in. Please log in again.");
    throw new Error("Missing handle in localStorage");
  }
  return handle;
}

/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(toHandle, encryptedPayload) {
  const from = requireHandle();

  console.log("Sending message as:", from);

  const res = await fetch(api("/message"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: toHandle.trim(),
      from,                  // ✅ always defined
      payload: encryptedPayload
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Message send failed:", err);
    throw new Error("Failed to send message");
  }
}

/* =========================
   LOAD INBOX
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
   DECRYPT + NORMALIZE
========================= */

async function decryptInboxMessages(rawMessages) {
  const messages = [];

  for (const msg of rawMessages) {
    try {
      const decrypted = await decryptMessage(msg.payload);

      messages.push({
        from: msg.from || "Unknown",
        decrypted,
        received: msg.received
      });

    } catch (err) {
      console.error("Failed to decrypt message:", err);
    }
  }

  return messages;
}

/* =========================
   RENDER INBOX
========================= */

function renderInbox(messages) {
  const list = document.getElementById("messageList");
  if (!list) return;

  list.innerHTML = "";

  if (!messages.length) {
    list.textContent = "No messages";
    return;
  }

  for (const msg of messages) {
    const item = document.createElement("div");
    item.className = "message-item";

    item.textContent = `From ${msg.from}: ${msg.decrypted}`;

    list.appendChild(item);
  }
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    requireHandle(); // 🔒 enforce login

    const rawInbox = await loadInbox();
    const decrypted = await decryptInboxMessages(rawInbox);
    renderInbox(decrypted);

  } catch (err) {
    console.error("Dashboard init failed:", err);
  }
});
