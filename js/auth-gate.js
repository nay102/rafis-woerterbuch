import { login, signup, resetPasswordByEmail, listenAuth } from "./auth-client.js";

const AUTH_CACHE_EMAIL_KEY = "rw_cached_email";
const PROTECTED_PAGES = new Set([
  "course-enrollment.html", "course-module.html", "library-topic.html", "practice.html", "download-center.html"
]);
let currentUser;
let resolveAuth;
const authReady = new Promise(resolve => { resolveAuth = resolve; });
let firstAuthState = true;

listenAuth(user => {
  currentUser = user || null;
  if (user?.email) localStorage.setItem(AUTH_CACHE_EMAIL_KEY, user.email);
  else localStorage.removeItem(AUTH_CACHE_EMAIL_KEY);
  if (firstAuthState) { firstAuthState = false; resolveAuth(currentUser); }
});

function isProtectedUrl(url) {
  if (url.origin !== location.origin) return false;
  const file = url.pathname.split("/").pop();
  return PROTECTED_PAGES.has(file) || url.pathname.includes("/assets/pdfs/");
}

function currentLevel() {
  const queryLevel = (new URLSearchParams(location.search).get("level") || "").toUpperCase();
  if (["A1", "A2", "B1", "B2"].includes(queryLevel)) return queryLevel;
  const match = location.pathname.match(/\/(a1|a2|b1|b2)\.html$/i);
  return match ? match[1].toUpperCase() : "A1";
}

function ensureModal() {
  let modal = document.getElementById("authGateModal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.id = "authGateModal";
  modal.className = "hidden modal-overlay";
  modal.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="authGateTitle">
      <button id="authGateClose" class="close-btn" type="button" aria-label="Close">&#10006;</button>
      <h2 id="authGateTitle">Welcome back</h2>
      <p id="authGateSubtitle" class="auth-subtitle">Log in to access courses, exercises, PDFs, and learning materials.</p>
      <div id="authGateError" class="auth-error" aria-live="polite"></div>
      <form id="authGateForm">
        <input id="authGateEmail" type="email" autocomplete="email" placeholder="Email" required>
        <input id="authGatePassword" type="password" autocomplete="current-password" minlength="6" placeholder="Password" required>
        <button id="authGateSubmit" type="submit">Login</button>
      </form>
      <p class="switch-text"><span id="authGateSwitchText">Don't have an account?</span> <button id="authGateSwitch" type="button">Sign Up</button></p>
      <button id="authGateForgot" class="forgot-password-btn" type="button">Forgot Password?</button>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

export function initAuthGate() {
  const modal = ensureModal();
  const form = modal.querySelector("#authGateForm");
  const email = modal.querySelector("#authGateEmail");
  const password = modal.querySelector("#authGatePassword");
  const error = modal.querySelector("#authGateError");
  const submit = modal.querySelector("#authGateSubmit");
  const switchButton = modal.querySelector("#authGateSwitch");
  const forgot = modal.querySelector("#authGateForgot");
  let loginMode = true;
  let pendingUrl = "";
  let pageLocked = false;

  const setMode = isLogin => {
    loginMode = isLogin;
    modal.querySelector("#authGateTitle").textContent = isLogin ? "Welcome back" : "Create your account";
    modal.querySelector("#authGateSubtitle").textContent = isLogin ? "Log in to continue to your selected learning material." : "Sign up to unlock Rafis Sprachwelt learning resources.";
    modal.querySelector("#authGateSwitchText").textContent = isLogin ? "Don't have an account?" : "Already have an account?";
    switchButton.textContent = isLogin ? "Sign Up" : "Login";
    submit.textContent = isLogin ? "Login" : "Create Account";
    password.autocomplete = isLogin ? "current-password" : "new-password";
    forgot.hidden = !isLogin;
    error.textContent = "";
  };

  const open = (destination = "", locked = false) => {
    pendingUrl = destination;
    pageLocked = locked;
    setMode(true);
    modal.classList.remove("hidden");
    document.body.classList.add("auth-modal-open");
    email.focus();
  };

  const close = () => {
    if (pageLocked) {
      location.href = `${currentLevel().toLowerCase()}.html#resources`;
      return;
    }
    modal.classList.add("hidden");
    document.body.classList.remove("auth-modal-open");
    form.reset(); error.textContent = "";
  };

  switchButton.addEventListener("click", () => setMode(!loginMode));
  modal.querySelector("#authGateClose").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.classList.contains("hidden")) close(); });

  forgot.addEventListener("click", async () => {
    error.textContent = ""; error.style.color = ""; forgot.disabled = true;
    try { await resetPasswordByEmail(email.value); error.textContent = "Password reset email sent. Check your inbox or spam folder."; error.style.color = "#16a34a"; }
    catch (reason) { error.textContent = reason.message; error.style.color = ""; }
    finally { forgot.disabled = false; }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault(); error.textContent = ""; error.style.color = ""; submit.disabled = true;
    try {
      if (loginMode) {
        const credential = await login(email.value, password.value);
        currentUser = credential.user;
        localStorage.setItem(AUTH_CACHE_EMAIL_KEY, credential.user.email || email.value);
        modal.classList.add("hidden"); document.body.classList.remove("auth-modal-open", "auth-content-locked");
        if (pendingUrl) location.href = pendingUrl;
      } else {
        await signup(email.value, password.value);
        setMode(true);
        email.value = email.value;
        password.value = "";
        error.style.color = "#16a34a";
        error.textContent = "Account created. Verify the email we sent you, then log in to continue.";
      }
    } catch (reason) { error.textContent = reason.message; }
    finally { submit.disabled = false; }
  });

  document.addEventListener("click", async event => {
    const link = event.target.closest("a[href]");
    const loginButton = event.target.closest("#loginBtn, #panelLoginBtn");
    if (!link && !loginButton) return;
    const destination = link ? new URL(link.href, location.href) : null;
    if (!loginButton && !isProtectedUrl(destination)) return;
    if (currentUser) return;
    event.preventDefault(); event.stopImmediatePropagation();
    await authReady;
    if (currentUser) {
      if (link) location.href = destination.href;
      return;
    }
    open(link ? destination.href : "");
  }, true);

  const currentFile = location.pathname.split("/").pop();
  if (PROTECTED_PAGES.has(currentFile)) {
    document.body.classList.add("auth-content-locked");
    authReady.then(user => {
      if (user) document.body.classList.remove("auth-content-locked");
      else open("", true);
    });
  }
}
