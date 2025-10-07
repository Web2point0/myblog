// SHA-256 hash of your admin password (example: "secret123")
const ADMIN_PASSWORD_HASH = "2f2aa28633f49b1e7584c030dfd7a4028845ad57ccb136d671437d798ce739f0";

// Convert text -> SHA-256 hex string
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkPassword() {
  const input = document.getElementById("password").value;
  const remember = document.getElementById("remember").checked;
  const error = document.getElementById("error");
  const loginContainer = document.getElementById("login-container");
  const content = document.getElementById("content");

  const inputHash = await sha256(input);

  if (inputHash === ADMIN_PASSWORD_HASH) {
    if (remember) {
      localStorage.setItem("auth", "true"); // Save state
    }
    loginContainer.style.display = "none";
    content.style.display = "block";
  } else {
    error.textContent = "Incorrect password. Try again.";
  }
}

// On page load
window.addEventListener("load", () => {
  const loginContainer = document.getElementById("login-container");
  const content = document.getElementById("content");
  const loginBtn = document.getElementById("loginBtn");
  const passwordInput = document.getElementById("password");
  const logoutBtn = document.getElementById("logout");
  const togglePasswordBtn = document.getElementById("togglePassword");

  // Auto-login if remembered
  if (localStorage.getItem("auth") === "true") {
    loginContainer.style.display = "none";
    content.style.display = "block";
  }

  // Login button click
  loginBtn.addEventListener("click", checkPassword);

  // Enter key support
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      checkPassword();
    }
  });

  // Logout button
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("auth");
    content.style.display = "none";
    loginContainer.style.display = "block";
    passwordInput.value = "";
  });

  // Show/Hide password toggle
  togglePasswordBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordBtn.textContent = "🙈"; // change icon when showing
    } else {
      passwordInput.type = "password";
      togglePasswordBtn.textContent = "👁️"; // back to eye icon
    }
  });
});
