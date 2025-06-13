import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqd8tED1rkFjYksc9iz6bmlghUjQrHwPI",
  authDomain: "skillbridge-3705c.firebaseapp.com",
  projectId: "skillbridge-3705c",
  storageBucket: "skillbridge-3705c.firebasestorage.app",
  messagingSenderId: "737664871616",
  appId: "1:737664871616:web:9eb5de4d31ec6e3d26d125",
  measurementId: "G-1M8G1LVEQG"
};
//making calls from the server
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);