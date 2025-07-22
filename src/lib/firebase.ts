
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
