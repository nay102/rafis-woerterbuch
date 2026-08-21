import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  deleteField,
  getDoc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function getCountryFromLocale() {
  try {
    const lang = navigator.language || "";
    if (typeof Intl !== "undefined" && Intl.Locale) {
      const region = new Intl.Locale(lang).region;
      if (region) return region;
    }
    const parts = lang.split("-");
    return parts[1] ? parts[1].toUpperCase() : "Unknown";
  } catch {
    return "Unknown";
  }
}

async function resolveUserCountry() {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;
  try {
    const res = await fetch("https://ipapi.co/json/", controller ? { signal: controller.signal } : {});
    if (res.ok) {
      const json = await res.json();
      return json?.country_name || json?.country_code || getCountryFromLocale();
    }
  } catch {
    // Fallback below.
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return getCountryFromLocale();
}

function authError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function friendlyAuthError(error, fallback) {
  const messages = {
    "auth/email-already-in-use": "Account already exists. Please login instead.",
    "auth/weak-password": "Password too weak. Minimum 6 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/user-not-found": "No account found. Please sign up first.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Could not reach the login service. Check your connection and try again.",
    "auth/operation-not-allowed": "Email login is temporarily unavailable. Please contact support.",
    "auth/unauthorized-domain": "Login is not enabled for this website address. Please contact support."
  };
  if (error?.code === "auth/email-not-verified" || error?.code === "auth/verification-email-failed") {
    return error;
  }
  return authError(error?.code || "auth/unknown", messages[error?.code] || fallback);
}

/* ================= SIGN UP ================= */
export async function signup(email, password) {
  const cleanEmail = String(email || "").trim();
  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    try {
      await sendEmailVerification(credential.user);
    } catch (verificationError) {
      await signOut(auth).catch(() => {});
      throw authError(
        "auth/verification-email-failed",
        "Your account was created, but the verification email could not be sent. Try logging in again to resend it."
      );
    }
    // Enforce verify-first flow: new users must verify, then login manually.
    await signOut(auth).catch(() => {});
    return credential;
  } catch (error) {
    throw friendlyAuthError(error, "Signup failed. Please try again.");
  }
}

/* ================= LOGIN ================= */
export async function login(email, password) {
  const cleanEmail = String(email || "").trim();
  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (!credential.user.emailVerified) {
      let verificationResent = false;
      try {
        await sendEmailVerification(credential.user);
        verificationResent = true;
      } catch {
        // The original verification email may still be valid.
      }
      await signOut(auth).catch(() => {});
      throw authError(
        "auth/email-not-verified",
        verificationResent
          ? "Please verify your email first. A new verification email was sent; check your inbox or spam folder."
          : "Please verify your email first. Check your inbox or spam folder, then try again."
      );
    }
    // Authentication success must not depend on an analytics/profile write.
    touchUserLastLogin(credential.user).catch(() => {});
    return credential;
  } catch (error) {
    throw friendlyAuthError(error, "Login failed. Please try again.");
  }
}

/* ================= LOGOUT ================= */
export function logout() {
  return signOut(auth);
}

/* ================= USER PROFILE HELPERS ================= */
export async function ensureUserProfile(user, profileExtras = {}) {
  if (!user?.uid) return;

  const profileRef = doc(db, "users", user.uid);
  const snap = await getDoc(profileRef);

  if (snap.exists()) {
    const data = snap.data() || {};
    const patch = {};
    if (Object.prototype.hasOwnProperty.call(data, "plainPassword")) {
      patch.plainPassword = deleteField();
    }
    if (!data.country) {
      patch.country = profileExtras.country || (await resolveUserCountry());
    }
    if (Object.keys(patch).length > 0) {
      await setDoc(profileRef, patch, { merge: true });
    }
    return;
  }

  const displayName = (user.email || "User").split("@")[0];
  await setDoc(profileRef, {
    uid: user.uid,
    email: user.email || "",
    displayName,
    country: profileExtras.country || (await resolveUserCountry()),
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  });
}

export async function touchUserLastLogin(user) {
  if (!user?.uid) return;

  const profileRef = doc(db, "users", user.uid);
  await setDoc(
    profileRef,
    {
      uid: user.uid,
      email: user.email || "",
      lastLoginAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getUserProfile(user) {
  if (!user?.uid) return null;

  const profileRef = doc(db, "users", user.uid);
  const snap = await getDoc(profileRef);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserAppSettings(user, appSettings) {
  if (!user?.uid || !appSettings) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      appSettings
    },
    { merge: true }
  );
}

export async function saveUserFavorites(user, favorites) {
  if (!user?.uid) return;
  await setDoc(
    doc(db, "users", user.uid),
    {
      favorites: Array.isArray(favorites) ? favorites : []
    },
    { merge: true }
  );
}

export async function saveUserProfilePatch(user, patch) {
  if (!user?.uid || !patch || typeof patch !== "object") return;
  await setDoc(doc(db, "users", user.uid), patch, { merge: true });
}

export async function saveUserWordNote(user, wordId, noteText) {
  if (!user?.uid || !wordId) return;
  if (!noteText || !String(noteText).trim()) {
    await setDoc(
      doc(db, "users", user.uid),
      { notes: { [wordId]: deleteField() } },
      { merge: true }
    );
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      notes: {
        [wordId]: String(noteText).trim()
      }
    },
    { merge: true }
  );
}

export async function submitWordSuggestion(user, payload) {
  if (!user?.uid) throw new Error("Login required.");
  if (!payload?.word || !payload?.message) {
    throw new Error("Word and suggestion text are required.");
  }
  await addDoc(collection(db, "wordSuggestions"), {
    uid: user.uid,
    email: user.email || "",
    word: payload.word,
    message: payload.message,
    createdAt: serverTimestamp()
  });
}

export async function submitWordReport(user, payload) {
  if (!user?.uid) throw new Error("Login required.");
  if (!payload?.wordId || !payload?.word || !payload?.reason) {
    throw new Error("Report reason is required.");
  }
  await addDoc(collection(db, "wordReports"), {
    uid: user.uid,
    email: user.email || "",
    wordId: payload.wordId,
    word: payload.word,
    reason: payload.reason,
    createdAt: serverTimestamp()
  });
}

export async function resendVerificationEmail(user) {
  if (!user) throw new Error("No active user.");
  if (user.emailVerified) return;
  await sendEmailVerification(user);
}

export async function resetPasswordByEmail(email) {
  const cleanEmail = String(email || "").trim();
  if (!cleanEmail) {
    throw new Error("Enter your email first, then tap Forgot Password.");
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    if (error.code === "auth/invalid-email") {
      throw new Error("Enter a valid email address.");
    }

    if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email.");
    }

    if (error.code === "auth/too-many-requests") {
      throw new Error("Too many reset attempts. Please wait a few minutes and try again.");
    }

    if (error.code === "auth/network-request-failed") {
      throw new Error("Could not reach the password reset service. Check your connection and try again.");
    }

    throw new Error("Password reset email could not be sent. Try again.");
  }
}

export async function changePasswordWithConfirmation(
  user,
  currentPassword,
  newPassword
) {
  if (!user?.email) throw new Error("No active user found.");
  if (!currentPassword || !newPassword) {
    throw new Error("Current and new password are required.");
  }
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);

  await setDoc(
    doc(db, "users", user.uid),
    {
      passwordUpdatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteAccountWithPassword(user, password) {
  if (!user?.email) throw new Error("No active user found.");
  if (!password) throw new Error("Password is required for account deletion.");

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);

  const uid = user.uid;
  await deleteDoc(doc(db, "users", uid));
  await deleteUser(user);
}

/* ================= AUTH STATE LISTENER ================= */
export function listenAuth(callback) {
  return onAuthStateChanged(auth, user => {
    callback(user?.emailVerified ? user : null);
  });
}
