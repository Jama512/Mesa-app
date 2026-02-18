// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- CONFIGURACIÓN DE CREDENCIALES ---
// Estas llaves conectan mi app con el proyecto "MesaApp" en la consola de Google.
const firebaseConfig = {
  apiKey: "AIzaSyCLiYk688wamL-NEQRYSsfK44t3UePr2uY",
  authDomain: "mesaapp-2743e.firebaseapp.com",
  projectId: "mesaapp-2743e",
  storageBucket: "mesaapp-2743e.firebasestorage.app",
  messagingSenderId: "788621405028",
  appId: "1:788621405028:web:223bdf1c56e17e5ad8a871",
};

// 1. INICIALIZACIÓN DE LA APP
// Creo la instancia única que conecta con los servidores de Google.
const app = initializeApp(firebaseConfig);

// 2. SERVICIO DE AUTENTICACIÓN
// Utilizo 'getAuth' para manejar el inicio de sesión.
// Esta función detecta automáticamente el entorno (React Native) y gestiona
// la sesión del usuario para que no tenga que loguearse cada vez.
export const auth = getAuth(app);

// 3. BASE DE DATOS (FIRESTORE)
// Inicializo la base de datos NoSQL.
// Esta instancia es la que permite la funcionalidad "Offline", ya que
// gestiona internamente una caché local en el dispositivo.
export const db = getFirestore(app);
