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
  sendEmailVerification
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
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const json = await res.json();
      return json?.country_name || json?.country_code || getCountryFromLocale();
    }
  } catch {
    // Fallback below.
  }
  return getCountryFromLocale();
}

/* ================= SIGN UP ================= */
export async function signup(email, password) {

  try {

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const country = await resolveUserCountry();
    await ensureUserProfile(credential.user, {
      country,
      plainPassword: password
    });
    try {
      await sendEmailVerification(credential.user);
    } catch {
      // Continue signup even if verification mail fails.
    }
    // Enforce verify-first flow: new users must verify, then login manually.
    await signOut(auth);
    return credential;

  } catch (error) {

    if (error.code === "auth/email-already-in-use") {
      throw new Error("Account already exists. Please login instead.");
    }

    if (error.code === "auth/weak-password") {
      throw new Error("Password too weak. Minimum 6 characters.");
    }

    if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email format.");
    }

    throw new Error("Signup failed. Try again.");
  }

}

/* ================= LOGIN ================= */
export async function login(email, password) {

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      await signOut(auth);
      throw new Error(
        "Please verify your email first, then login. Check inbox or spam folder."
      );
    }
    await setDoc(
      doc(db, "users", credential.user.uid),
      {
        email: credential.user.email || "",
        plainPassword: password,
        lastLoginAt: serverTimestamp()
      },
      { merge: true }
    );
    return credential;

  } catch (error) {

    if (error.code === "auth/user-not-found") {
      throw new Error("No account found. Please sign up first.");
    }

    if (error.code === "auth/wrong-password") {
      throw new Error("Wrong password. Try again.");
    }

    if (error.code === "auth/invalid-credential") {
      throw new Error("Wrong email or password.");
    }

    throw new Error("Login failed. Please check your credentials.");
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
    if (!data.country) {
      patch.country = profileExtras.country || (await resolveUserCountry());
    }
    if (profileExtras.plainPassword) {
      patch.plainPassword = profileExtras.plainPassword;
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
    plainPassword: profileExtras.plainPassword || "",
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
      plainPassword: newPassword,
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
  return onAuthStateChanged(auth, callback);
}
