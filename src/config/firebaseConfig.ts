// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
// Tu configuración (la que me pasaste)
const firebaseConfig = {
  apiKey: "AIzaSyCLiYk688wamL-NEQRYSsfK44t3UePr2uY",
  authDomain: "mesaapp-2743e.firebaseapp.com",
  projectId: "mesaapp-2743e",
  storageBucket: "mesaapp-2743e.firebasestorage.app",
  messagingSenderId: "788621405028",
  appId: "1:788621405028:web:223bdf1c56e17e5ad8a871",
};

// 1. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializar Auth
// Usamos getAuth directo para evitar el error de tipos.
// Firebase suele detectar React Native automáticamente.
export const auth = getAuth(app);

// 3. Inicializar Base de Datos (Firestore)
export const db = getFirestore(app);
