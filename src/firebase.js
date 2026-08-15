import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAt7NGrdFT8IppfoHYulqunBAzqtCiWOdU",
  authDomain: "kineapphft-13fe7.firebaseapp.com",
  projectId: "kineapphft-13fe7",
  storageBucket: "kineapphft-13fe7.firebasestorage.app",
  messagingSenderId: "6430647602",
  appId: "1:6430647602:web:2542fac02f7bb60820232b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
