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

// ✅ Importamos Firebase Auth y Firestore
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig"; // Tu archivo de configuración

// Tipos
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
  userId?: string; // ✅ Guardamos el UID de Firebase
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

  // 1. ESCUCHAR CAMBIOS DE SESIÓN (Firebase lo hace automático) 🎧
  useEffect(() => {
    console.log("AuthProvider: Iniciando listener de Firebase Auth...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Usuario detectado:", firebaseUser.email);

        // Usuario logueado: Intentamos leer su nombre de restaurante de Firestore
        let restName = DEFAULT_RESTAURANT_NAME;
        let restData: Partial<RestaurantProfile> = {};

        try {
          const docRef = doc(db, "restaurants", firebaseUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            restName = data.name || restName;
            // Cargamos datos básicos al estado global
            restData = {
              name: restName,
              latitude: data.latitude,
              longitude: data.longitude,
            };
          }
        } catch (e) {
          console.log("Error leyendo perfil al iniciar:", e);
        }

        setState({
          isAuthenticated: true,
          role: "owner",
          email: firebaseUser.email || "",
          userId: firebaseUser.uid,
          restaurant: { name: restName, ...restData },
          isLoading: false,
        });
      } else {
        console.log("No hay usuario logueado.");
        // Usuario no logueado (o logout)
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

    return () => unsubscribe(); // Limpiar al desmontar
  }, []);

  // 2. REGISTRO (Auth + Firestore) 📝
  const registerOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "La contraseña es obligatoria.");
      return false;
    }

    try {
      // a) Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = userCredential.user.uid;

      // b) Crear inmediatamente el documento en Firestore
      // Usamos el UID como ID del documento para vincularlos fácil
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
      if (error.code === "auth/email-already-in-use")
        msg = "Ese correo ya está registrado.";
      if (error.code === "auth/weak-password")
        msg = "La contraseña es muy débil (usa 6+ caracteres).";
      if (error.code === "auth/invalid-email") msg = "El correo no es válido.";

      Alert.alert("Error de registro", msg);
      return false;
    }
  }, []);

  // 3. LOGIN 🔑
  const loginAsOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "Ingresa tu contraseña.");
      return false;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // No necesitamos hacer setState aquí manual, el onAuthStateChanged lo hará solo
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

  const continueAsGuest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true, // Invitado cuenta como "dentro"
      role: "guest",
    }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // El onAuthStateChanged detectará null y limpiará el estado
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cerrar sesión.");
    }
  }, []);

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
    [
      state,
      loginAsOwner,
      registerOwner,
      continueAsGuest,
      logout,
      updateRestaurant,
    ]
  );

  // Pantalla de carga inicial mientras Firebase verifica la sesión
  if (state.isLoading) {
    return null; // O podrías poner un <ActivityIndicator /> aquí
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
