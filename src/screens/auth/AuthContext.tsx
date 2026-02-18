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

  // 1. LISTENER DE SESION (Persistencia)
  // Este efecto se ejecuta al montar el componente.
  // Escucha cambios en el estado de autenticacion de Firebase.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Si hay usuario (sesion persistente o login reciente)
        let restName = DEFAULT_RESTAURANT_NAME;
        let restData: Partial<RestaurantProfile> = {};

        try {
          // Buscamos el documento del restaurante usando el UID como llave
          const docRef = doc(db, "restaurants", firebaseUser.uid);
          const snap = await getDoc(docRef);

          if (snap.exists()) {
            const data = snap.data();
            restName = data.name || restName;

            // Cargamos datos criticos al estado global para acceso rapido
            restData = {
              name: restName,
              latitude: data.latitude,
              longitude: data.longitude,
            };
          }
        } catch (e) {
          console.log("Error recuperando perfil:", e);
        }

        // Actualizamos el estado global de la aplicacion
        setState({
          isAuthenticated: true,
          role: "owner",
          email: firebaseUser.email || "",
          userId: firebaseUser.uid,
          restaurant: { name: restName, ...restData },
          isLoading: false,
        });
      } else {
        // No hay sesion activa
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

  // 2. REGISTRO DE USUARIO
  const registerOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "La contraseña es obligatoria.");
      return false;
    }

    try {
      // Paso A: Crear la cuenta de acceso (Email/Pass)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const uid = userCredential.user.uid;

      // Paso B: Crear el documento de datos en Firestore
      // Uso el mismo UID para vincular ambas entidades
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

      // Manejo de errores especificos de Firebase
      if (error.code === "auth/email-already-in-use")
        msg = "Ese correo ya está registrado.";
      if (error.code === "auth/weak-password")
        msg = "La contraseña es muy débil (usa 6+ caracteres).";
      if (error.code === "auth/invalid-email") msg = "El correo no es válido.";

      Alert.alert("Error de registro", msg);
      return false;
    }
  }, []);

  // 3. INICIO DE SESION
  const loginAsOwner = useCallback(async (data: LoginPayload) => {
    if (!data.password) {
      Alert.alert("Error", "Ingresa tu contraseña.");
      return false;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // El cambio de estado lo maneja el listener onAuthStateChanged
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

  // Acceso como invitado (sin persistencia de datos propios)
  const continueAsGuest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: "guest",
    }));
  }, []);

  // Cierre de sesion
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // El listener detectara el cierre y limpiara el estado
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cerrar sesión.");
    }
  }, []);

  // Actualizacion local optimista del perfil
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

  // Evitamos renderizar la UI hasta saber el estado de la sesion
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
