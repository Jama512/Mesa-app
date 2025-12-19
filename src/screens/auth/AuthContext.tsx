// src/screens/auth/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ Importar
import { Alert } from "react-native";

// Clave para guardar en el disco del celular
const AUTH_STORAGE_KEY = "MESA_AUTH_STATE_V1";

type UserRole = "guest" | "owner";

export interface RestaurantProfile {
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  features?: any;
  images?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  email?: string;
  restaurant?: RestaurantProfile;
  isLoading: boolean; // ✅ Nuevo estado para no mostrar Login mientras carga
}

interface LoginPayload {
  email: string;
  restaurantName?: string;
}

interface AuthContextValue {
  state: AuthState;
  loginAsOwner: (data: LoginPayload) => Promise<void>;
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
    isLoading: true, // Empieza cargando
  });

  // 1. CARGAR SESIÓN AL INICIAR LA APP (Offline Login) 🔄
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Restauramos la sesión guardada
          setState({ ...parsed, isLoading: false });
        } else {
          // No había sesión
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        console.error("Error cargando sesión", e);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };
    loadSession();
  }, []);

  // 2. GUARDAR SESIÓN CADA VEZ QUE CAMBIA 💾
  useEffect(() => {
    if (!state.isLoading) {
      const saveState = {
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        email: state.email,
        restaurant: state.restaurant,
      };
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(saveState)).catch(
        (e) => console.error("Error guardando auth", e)
      );
    }
  }, [
    state.isAuthenticated,
    state.role,
    state.email,
    state.restaurant,
    state.isLoading,
  ]);

  // LOGIN (Actualiza estado + Persistencia automática por el useEffect de arriba)
  const loginAsOwner = useCallback(async (data: LoginPayload) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      role: "owner",
      email: data.email,
      restaurant: {
        name: data.restaurantName || DEFAULT_RESTAURANT_NAME,
      },
    }));
  }, []);

  const continueAsGuest = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true, // Invitado también cuenta como "dentro" para navegar
      role: "guest",
    }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY); // Borrar del disco
      setState({
        isAuthenticated: false,
        role: "guest",
        email: undefined,
        restaurant: undefined,
        isLoading: false,
      });
    } catch (e) {
      Alert.alert("Error", "No se pudo cerrar sesión");
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
      continueAsGuest,
      logout,
      updateRestaurant,
    }),
    [state, loginAsOwner, continueAsGuest, logout, updateRestaurant]
  );

  // Evitamos renderizar la app hasta saber si hay usuario guardado
  // (Opcional: podrías mostrar un Splash Screen aquí)
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
