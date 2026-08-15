import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const firebaseConfig = {
  apiKey: "AIzaSyAt7NGrdFT8IppfoHYulqunBAzqtCiWOdU",
  authDomain: "kineapphft-13fe7.firebaseapp.com",
  projectId: "kineapphft-13fe7",
  storageBucket: "kineapphft-13fe7.firebasestorage.app",
  messagingSenderId: "6430647602",
  appId: "1:6430647602:web:2542fac02f7bb60820232b",
};

export async function crearKinesiologo({ nombre, email, password, telefono, montoMensual, proximoPago }) {
  const secondaryApp = initializeApp(firebaseConfig, "secondary-" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: nombre });

    await setDoc(doc(db, "kinesiologos", cred.user.uid), {
      nombre,
      email,
      telefono: telefono || "",
      montoMensual: Number(montoMensual) || 0,
      proximoPago: proximoPago || null,
      activo: true,
      creadoEl: serverTimestamp(),
      creadoPorAdmin: true,
    });

    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
