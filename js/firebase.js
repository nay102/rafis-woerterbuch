import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =====================================================
   🔥 PASTE YOUR FIREBASE CONFIG HERE
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyCglT-jWryTxcjS6lFwlEYVwfX1bpJxnG0",
  authDomain: "rafis-woerterbuch.firebaseapp.com",
  projectId: "rafis-woerterbuch",
  storageBucket: "rafis-woerterbuch.firebasestorage.app",
  messagingSenderId: "878452035840",
  appId: "1:878452035840:web:15b85acb5419108328e3e5",
  measurementId: "G-8BMY1DW9T5"
};

/* ===================================================== */

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);