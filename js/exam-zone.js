import { mountExamLibrary } from "./exam-zone-library.js";

const root = document.getElementById("examZone");
const timeout = setTimeout(() => {
  const status = document.getElementById("examGateStatus");
  if (status) status.textContent = "Still checking your login. Please check your connection; the library stays locked until your account is confirmed.";
}, 12000);

try {
  const [, { listenAuth }, { auth }] = await Promise.all([
    import("./app.js"), import("./auth.js"), import("./firebase.js")
  ]);
  clearTimeout(timeout);
  mountExamLibrary(root, {
    subscribe: listenAuth,
    openLogin: () => document.getElementById("loginBtn")?.click(),
    download: async (item, user) => {
      if (!auth.currentUser?.emailVerified || auth.currentUser.uid !== user.uid) throw new Error("Login required");
      const { getStorage, ref, getBlob } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js");
      return getBlob(ref(getStorage(), item.storagePath), 100 * 1024 * 1024);
    }
  });
} catch {
  clearTimeout(timeout);
  root.innerHTML = '<section class="exam-gate"><span class="exam-eyebrow">EXAM ZONE</span><h1>Let’s reconnect.</h1><p role="alert">The login service could not load. Check your internet connection and try again.</p><button class="exam-primary" type="button" id="examRetry">Try again</button><a class="exam-home" href="../">Back to the dictionary</a></section>';
  document.getElementById("examRetry").addEventListener("click", () => location.reload());
}
