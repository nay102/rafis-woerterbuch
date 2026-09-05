const APP_SETTINGS_KEY = "rw_app_settings_v1";
export const DEFAULT_APP_SETTINGS = Object.freeze({theme:"system",textSize:"normal",reducedMotion:false,cloudSync:true});
export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(APP_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_APP_SETTINGS, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function saveStoredSettings(settings) {
  localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("app-settings-changed", {detail:settings}));
}
