import "./firebase.js";
import { initUI } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {

  try {
    await initUI();
    console.log("✅ App Initialized Successfully");
  } catch (error) {
    console.error("❌ App Init Error:", error);
  }

});