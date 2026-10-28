import {listenAuth, ensureUserProfile, getUserProfile, syncUserLearningProgress} from "./auth-client.js";
import {accountSaveError, validateProgress} from "./account-data.js";
import {learningOwner, selectLearningOwner, progressRecords, applyProgressRecords, mergeProgressRecords} from "./learning-storage.js";

let user = null, enabled = false, running = null, timer, started = false;
let authGeneration = 0;
export let learningSyncStatus = "Progress is saved on this device. Sign in to sync across devices.";
function status(message) { learningSyncStatus = message; window.dispatchEvent(new Event("learning-sync-status")); }
export function syncLearningProgress({pull = false} = {}) {
  const generation = authGeneration;
  if (running) return running.then(() => generation === authGeneration && user && enabled ? syncLearningProgress({pull}) : undefined);
  if (!user || !enabled || user.uid !== learningOwner()) return Promise.resolve();
  const account = user;
  status("Syncing learning progress…");
  running = (async () => {
    try {
      const sent = progressRecords(account.uid);
      validateProgress(sent);
      const merged = await syncUserLearningProgress(account, sent);
      if (generation !== authGeneration || user?.uid !== account.uid || !enabled) return;
      // Never replace an exercise's in-memory state in the middle of a session.
      if (pull) applyProgressRecords(mergeProgressRecords(progressRecords(account.uid), merged), account.uid);
      status("Learning progress synced. Open My A1 Progress on another device to restore it.");
    } catch (error) {
      if (generation === authGeneration && user?.uid === account.uid) status(accountSaveError(error, "Learning progress"));
    } finally { running = null; }
  })();
  return running;
}
export function importGuestProgress() {
  if (!user || user.uid !== learningOwner()) return;
  const own = progressRecords(), guest = progressRecords("guest");
  // Existing account records, including resets, take precedence.
  applyProgressRecords({...guest, ...own});
  return syncLearningProgress({pull:true});
}
export function initLearningSync() {
  if (started) return;
  started = true;
  listenAuth(async (next, context) => {
    if (context?.unavailable) { status("Saved on this device. Connect to the internet to sync your account."); return; }
    const generation = ++authGeneration;
    enabled = false;
    clearTimeout(timer);
    user = next;
    const owner = next?.uid || "guest";
    if (owner !== learningOwner()) {
      selectLearningOwner(owner);
      // A full restart keeps all activity closures bound to the correct account.
      location.reload();
      return;
    }
    enabled = false;
    if (!next) { status("Progress is saved on this device. Sign in to sync across devices."); return; }
    try {
      await ensureUserProfile(next);
      if (generation !== authGeneration || user?.uid !== next.uid) return;
      const profile = await getUserProfile(next);
      if (generation !== authGeneration || user?.uid !== next.uid) return;
      enabled = profile?.appSettings?.cloudSync !== false;
      if (!enabled) { status("Cloud sync is turned off in your account settings."); return; }
      await syncLearningProgress({pull: Boolean(document.getElementById("progressDashboard"))});
    } catch (error) { if (generation === authGeneration) status(accountSaveError(error, "Account initialization")); }
  });
  window.addEventListener("learning-progress-changed", () => { clearTimeout(timer); timer = setTimeout(() => syncLearningProgress(), 500); });
  window.addEventListener("app-settings-changed", event => {
    enabled = Boolean(user) && event.detail?.cloudSync !== false;
    if (!enabled) { clearTimeout(timer); status(user ? "Cloud sync is turned off in your account settings." : "Progress is saved on this device. Sign in to sync across devices."); }
    else syncLearningProgress();
  });
  window.addEventListener("online", () => syncLearningProgress({pull:Boolean(document.getElementById("progressDashboard"))}));
  window.addEventListener("learning-storage-full", () => status("Browser storage is unavailable or full. Progress is only held on this page; free some browser storage before leaving."));
  window.addEventListener("storage", event => { if (event.key === "rw_learning_owner_v2") location.reload(); });
}
