/*
 * Offline-safe authentication bridge.
 *
 * Firebase is intentionally loaded only when an account operation needs it.
 * This keeps the dictionary and Sprachwelt module graph entirely local, so a
 * missing network connection cannot prevent the rest of the PWA from starting.
 */
const CACHED_EMAIL_KEY = "rw_cached_email";
let authModulePromise;

function loadAuthModule() {
  if (!navigator.onLine) {
    return Promise.reject(new Error("This account action needs an internet connection."));
  }
  if (!authModulePromise) {
    authModulePromise = import("./auth.js").catch(error => {
      authModulePromise = null;
      throw error;
    });
  }
  return authModulePromise;
}

async function call(name, args) {
  try {
    const auth = await loadAuthModule();
    return await auth[name](...args);
  } catch (error) {
    if (!navigator.onLine || error instanceof TypeError) {
      throw new Error("This account action needs an internet connection.");
    }
    throw error;
  }
}

export function listenAuth(callback) {
  let stopped = false;
  let unsubscribe = () => {};
  const cachedEmail = localStorage.getItem(CACHED_EMAIL_KEY);

  // Restore the last verified session immediately while offline. Firebase will
  // replace this lightweight value with the real user whenever it is reachable.
  callback(cachedEmail ? { email: cachedEmail, uid: `offline:${cachedEmail}` } : null);

  if (navigator.onLine) {
    loadAuthModule()
      .then(auth => {
        if (!stopped) unsubscribe = auth.listenAuth(callback) || (() => {});
      })
      .catch(() => {});
  }

  return () => {
    stopped = true;
    unsubscribe();
  };
}

export const signup = (...args) => call("signup", args);
export const login = (...args) => call("login", args);
export const logout = (...args) => call("logout", args);
export const ensureUserProfile = (...args) => call("ensureUserProfile", args);
export const touchUserLastLogin = (...args) => call("touchUserLastLogin", args);
export const getUserProfile = (...args) => call("getUserProfile", args);
export const resetPasswordByEmail = (...args) => call("resetPasswordByEmail", args);
export const changePasswordWithConfirmation = (...args) => call("changePasswordWithConfirmation", args);
export const deleteAccountWithPassword = (...args) => call("deleteAccountWithPassword", args);
export const saveUserAppSettings = (...args) => call("saveUserAppSettings", args);
export const saveUserFavorites = (...args) => call("saveUserFavorites", args);
export const saveUserProfilePatch = (...args) => call("saveUserProfilePatch", args);
export const saveUserWordNote = (...args) => call("saveUserWordNote", args);
export const submitWordSuggestion = (...args) => call("submitWordSuggestion", args);
export const submitWordReport = (...args) => call("submitWordReport", args);
