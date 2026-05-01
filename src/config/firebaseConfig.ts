// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore (Ignoramos el warning de TS, funciona bien en React Native)
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Importamos App Check
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// --- CONFIGURACIÓN DE CREDENCIALES ---
const firebaseConfig = {
  apiKey: "AIzaSyCLiYk688wamL-NEQRYSsfK44t3UePr2uY",
  authDomain: "mesaapp-2743e.firebaseapp.com",
  projectId: "mesaapp-2743e",
  storageBucket: "mesaapp-2743e.firebasestorage.app",
  messagingSenderId: "788621405028",
  appId: "1:788621405028:web:223bdf1c56e17e5ad8a871",
};

// 1. INICIALIZACIÓN DE LA APP
const app = initializeApp(firebaseConfig);

// 2. SERVICIO DE AUTENTICACIÓN (Persistencia Offline Configurada)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 3. BASE DE DATOS (FIRESTORE)
export const db = getFirestore(app);

// 4. ALMACENAMIENTO (FIREBASE STORAGE)
export const storage = getStorage(app);

// 5. APP CHECK 
try {
  initializeAppCheck(app, {
    // Clave genérica para entorno de desarrollo escolar
    provider: new ReCaptchaV3Provider('CLAVE_PUBLICA_DE_DESARROLLO'),
    isTokenAutoRefreshEnabled: true
  });
  console.log("Firebase App Check inicializado correctamente.");
} catch (error) {
  console.warn("Nota: App Check funciona mejor en builds compiladas (APK).", error);
}