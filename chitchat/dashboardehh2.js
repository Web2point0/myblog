/* =========================
   HELPERS
========================= */

function api(path) {
  return path;
}

function requireHandle() {
  const handle = localStorage.getItem("handle");
  if (!handle) {
    alert("You are not logged in");
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: toHandle.trim(),
      from,                  // ✅ ALWAYS defined
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

async function loadInbox() {
  const handle = requireHandle();

  const res = await fetch(api("/inbox"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle })
  });

  if (!res.ok) {
    console.error("Failed to load inbox");
    return [];
  }

  return res.json();
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
        from: msg.from || "Unknown",   // ✅ preserve sender
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
    console.error(err);
  }
});
