/*
 * Offline-safe authentication bridge.
 *
 * Firebase is intentionally loaded only when an account operation needs it.
 * This keeps the dictionary and Sprachwelt module graph entirely local, so a
 * missing network connection cannot prevent the rest of the PWA from starting.
 */
let authModulePromise;
let authUnsubscribe = null;
let authObserverPromise = null;
const authCallbacks = new Set();

function loadAuthModule() {
  if (!authModulePromise) {
    authModulePromise = import("./auth.js").catch(error => {
      authModulePromise = null;
      throw error;
    });
  }
  return authModulePromise;
}

function attachAuthObserver(authModule) {
  if (authUnsubscribe) return;
  authUnsubscribe = authModule.listenAuth(user => {
    authCallbacks.forEach(callback => callback(user || null));
  }) || (() => {});
}

function ensureAuthObserver() {
  if (authUnsubscribe) return Promise.resolve();
  if (!authObserverPromise) {
    authObserverPromise = loadAuthModule()
      .then(authModule => attachAuthObserver(authModule))
      .catch(() => {
        // A later online event or account action will retry initialization.
        authCallbacks.forEach(callback => callback(null));
      })
      .finally(() => {
        authObserverPromise = null;
      });
  }
  return authObserverPromise;
}

window.addEventListener("online", () => {
  ensureAuthObserver();
});

async function call(name, args) {
  try {
    const authModule = await loadAuthModule();
    attachAuthObserver(authModule);
    return await authModule[name](...args);
  } catch (error) {
    if (!navigator.onLine || error?.code === "auth/network-request-failed" || error instanceof TypeError) {
      throw new Error("This account action needs an internet connection.");
    }
    throw error;
  }
}

export function listenAuth(callback) {
  if (typeof callback !== "function") return () => {};
  authCallbacks.add(callback);
  // Only Firebase may confirm an authenticated session. Cached display data is
  // intentionally not promoted to an authorized user.
  ensureAuthObserver();

  return () => {
    authCallbacks.delete(callback);
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
