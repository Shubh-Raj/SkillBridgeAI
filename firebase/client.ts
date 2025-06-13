// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqd8tED1rkFjYksc9iz6bmlghUjQrHwPI",
  authDomain: "skillbridge-3705c.firebaseapp.com",
  projectId: "skillbridge-3705c",
  storageBucket: "skillbridge-3705c.firebasestorage.app",
  messagingSenderId: "737664871616",
  appId: "1:737664871616:web:9eb5de4d31ec6e3d26d125",
  measurementId: "G-1M8G1LVEQG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);