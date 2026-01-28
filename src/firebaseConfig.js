// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ added for PDF uploads
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBVk71MroWEUlgFzrRG3X48a-PkJIGgcTw",
  authDomain: "class-hive.firebaseapp.com",
  projectId: "class-hive",
  storageBucket: "class-hive.appspot.com",
  messagingSenderId: "791062663139",
  appId: "1:791062663139:web:f7bd0733c9077d1b92dad6",
  measurementId: "G-D0PBMZC8HH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// ✅ Storage (added)
const storage = getStorage(app);

// Analytics (safe check)
let analytics;
isSupported().then((yes) => {
  if (yes) analytics = getAnalytics(app);
});

// ✅ Export everything needed
export { auth, provider, app, db, storage, analytics };
