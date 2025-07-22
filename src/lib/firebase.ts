
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQN_pWuhxObBi0lgpp9Hz7pMMp6nr3ey4",
  authDomain: "duck0-98a94.firebaseapp.com",
  projectId: "duck0-98a94",
  storageBucket: "duck0-98a94.appspot.com",
  messagingSenderId: "240052734588",
  appId: "1:240052734588:web:96dce3532ad3dd580157f9",
  measurementId: "G-NZJQ1Z91MV"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
