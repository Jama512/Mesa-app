// src/screens/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";

// Importacion de servicios de Firebase
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

// IMPORTANTE: Importamos nuestro servicio Offline-First (SQLite)
import { 
  initDB, 
  saveSessionLocally, 
  getLocalSession, 
  clearLocalSession 
} from "../../services/database.service";

// Definicion de Tipos
type UserRole = "guest" | "owner";

export interface RestaurantProfile {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  features?: any;
  images?: string[];
  latitude?: number;
  longitude?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  email?: string;
  restaurant?: RestaurantProfile;
  isLoading: boolean;
  userId?: string;
}

interface LoginPayload {
  email: string;
  password?: string;
  restaurantName?: string;
}

interface AuthContextValue {
  state: AuthState;
  loginAsOwner: (data: LoginPayload) => Promise<boolean>;
  registerOwner: (data: LoginPayload) => Promise<boolean>;
  continueAsGuest: () => void;
  logout: () => void;
  updateRestaurant: (data: Partial<RestaurantProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_RESTAURANT_NAME = "Mi Restaurante";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    role: "guest",
    isLoading: true,
  });

  // 1. LISTENER DE SESION Y OFFLINE-FIRST
  useEffect(() => {
    // A) Inicializamos la base de datos local SQLite
    initDB();

    // B) Intentamos un "Fast Boot" leyendo la sesión de SQLite (Modo Offline)
    const loadOfflineSession = async () => {
      try {
        const session: any = await getLocalSession();
        if (session && session.user_data) {
          const userData = JSON.parse(session.user_data);
          setState({
            isAuthenticated: true,
            role: "owner",
            email: userData.email,
            userId: userData.userId,
            restaurant: userData.restaurant,
            isLoading: false,
          });
          console.log("⚡ Sesión cargada desde SQLite (Offline-First)");
        }
      } catch (error) {
        console.log("No hay sesión local previa.");
      }
    };

    loadOfflineSession();

    // C) Sincronización con Firebase (Segundo plano)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let restName = DEFAULT_RESTAURANT_NAME;
        let restData: Partial<RestaurantProfile> = {};

        try {
          const docRef = doc(db, "restaurants", firebaseUser.uid);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            restName = data.name || restName;
            restData = {
              name: restName,
              latitude: data.latitude,
              longitude: data.longitude,
            };
          }

          // Obtenemos el Token seguro de Firebase
          const token = await firebaseUser.getIdToken();
          
          // Preparamos los datos completos para guardar en caché
          const fullUserData = {
            email: firebaseUser.email,
            userId: firebaseUser.uid,
            restaurant: { name: restName, ...restData }
          };

          // D) ¡MAGIA OFFLINE! Guardamos el token y datos actualizados en SQLite
          saveSessionLocally(token, fullUserData);

          setState({
            isAuthenticated: true,
            role: "owner",
            email: firebaseUser.email || "",
            userId: firebaseUser.uid,
            restaurant: fullUserData.restaurant,
            isLoading: false,
          });

        } catch (e) {
          console.log("Error de red con Firebase (¿Modo offline en curso?):", e);
          // Si falla por falta de internet, NO borramos el estado porque 
          // la función `loadOfflineSession` ya lo cargó en memoria al abrir la app.
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        // No hay usuario en Firebase
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          role: "guest",
          email: undefined,
          userId: undefined,
          restaurant: undefined,
          isLoading: false,
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. REGISTRO DE USUARIO (Se mantiene igual, la persistencia se maneja en el listener)
  const registerOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "La contraseña es obligatoria.");
      return false;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "restaurants", uid), {
        ownerId: uid,
        name: data.restaurantName || "Nuevo Restaurante",
        email: data.email,
        createdAt: new Date().toISOString(),
        status: "Abierto ahora",
        rating: 5.0,
        category: "General",
      });

      return true;
    } catch (error: any) {
      console.error("Error en registro:", error);
      let msg = "No se pudo crear la cuenta.";
      if (error.code === "auth/email-already-in-use") msg = "Ese correo ya está registrado.";
      if (error.code === "auth/weak-password") msg = "La contraseña es muy débil (usa 6+ caracteres).";
      if (error.code === "auth/invalid-email") msg = "El correo no es válido.";
      Alert.alert("Error de registro", msg);
      return false;
    }
  }, []);

  // 3. INICIO DE SESIÓN
  const loginAsOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "Ingresa tu contraseña.");
      return false;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      return true;
    } catch (error: any) {
      console.error("Error en login:", error);
      let msg = "Error al iniciar sesión.";
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        msg = "Correo o contraseña incorrectos.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Demasiados intentos fallidos. Intenta más tarde.";
      }
      Alert.alert("Error de acceso", msg);
      return false;
    }
  }, []);

  // Acceso como invitado
  const continueAsGuest = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: true, role: "guest" }));
  }, []);

  // Cierre de sesion
  const logout = useCallback(async () => {
    try {
      // Borramos de Firebase
      await signOut(auth);
      // Borramos la caja fuerte de SQLite para que no entre offline
      clearLocalSession();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cerrar sesión.");
    }
  }, []);

  // Actualizacion local optimista
  const updateRestaurant = useCallback((data: Partial<RestaurantProfile>) => {
    setState((prev) => {
      const prevRest = prev.restaurant ?? { name: DEFAULT_RESTAURANT_NAME };
      return {
        ...prev,
        restaurant: { ...prevRest, ...data },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      state,
      loginAsOwner,
      registerOwner,
      continueAsGuest,
      logout,
      updateRestaurant,
    }),
    [state, loginAsOwner, registerOwner, continueAsGuest, logout, updateRestaurant]
  );

  if (state.isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};