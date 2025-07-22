
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHECF7oWwpRtlHNtgCI7fsh81_PaIteg0",
  authDomain: "duck111-64eb1.firebaseapp.com",
  databaseURL: "https://duck111-64eb1-default-rtdb.firebaseio.com",
  projectId: "duck111-64eb1",
  storageBucket: "duck111-64eb1.appspot.com",
  messagingSenderId: "533771377148",
  appId: "1:533771377148:web:3492ef87053fffb43dba79",
  measurementId: "G-YE1YSYGLNL"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
