// src/navigation/StackNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorScreenParams } from "@react-navigation/native";

// Auth
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";

// Tabs (Navegación Principal)
import TabNavigator, { RootTabParamList } from "./TabNavigator";

// Guest detail
import CategoryDetailScreen from "../screens/home/CategoryDetailScreen";

// Owner flow (Pantallas administrativas)
import OwnerDashboard from "../screens/owner/OwnerDashboard";
import OwnerCreateAnnouncement from "../screens/owner/OwnerCreateAnnouncement";
import OwnerMenuList from "../screens/owner/OwnerMenuList";
import OwnerStats from "../screens/owner/OwnerStats";
import OwnerProfile from "../screens/owner/OwnerProfile";
import OwnerAddDish from "../screens/owner/OwnerAddDish";
import OwnerLocationPicker from "../screens/owner/OwnerLocationPicker";

// Consumo el estado global de autenticación
import { useAuth } from "../screens/auth/AuthContext";
import { Dish } from "../context/RestaurantsContext";

// --- TIPADO ESTRICTO DE RUTAS ---
// Defino qué parámetros acepta cada pantalla para evitar errores de navegación.
export type RootStackParamList = {
  // Flujo de Invitado / Auth
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: NavigatorScreenParams<RootTabParamList>; // Anido el TabNavigator aquí
  CategoryDetail: { restaurantId: string };

  // Flujo de Dueño (Admin)
  OwnerDashboard: undefined;
  OwnerCreateAnnouncement: undefined;
  OwnerMenuList: undefined;
  OwnerStats: undefined;
  OwnerProfile: undefined;
  // Defino params opcionales para reutilizar la pantalla de "Agregar Platillo" para "Editar"
  OwnerAddDish: { mode?: "create" | "edit"; dish?: Dish } | undefined;
  OwnerLocationPicker: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  // 1. Obtengo el estado del usuario desde el Contexto Global
  const { state } = useAuth();

  // 2. Verifico Rol y Autenticación
  const isOwner = state.isAuthenticated && state.role === "owner";

  return (
    <Stack.Navigator
      // TRUCO TÉCNICO: Cambio la 'key' cuando cambia el rol.
      // Esto fuerza a React Navigation a destruir el stack anterior y crear uno nuevo.
      // Así evito que queden pantallas de "Dueño" en el historial si cierro sesión.
      key={isOwner ? "owner-stack" : "guest-stack"}
      screenOptions={{ headerShown: false }}
    >
      {/* --- NAVEGACIÓN PROTEGIDA (RBAC) --- */}
      {isOwner ? (
        // Si es DUEÑO, inyecto las rutas administrativas
        <>
          <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
          <Stack.Screen
            name="OwnerCreateAnnouncement"
            component={OwnerCreateAnnouncement}
          />
          <Stack.Screen name="OwnerMenuList" component={OwnerMenuList} />
          <Stack.Screen name="OwnerAddDish" component={OwnerAddDish} />
          <Stack.Screen name="OwnerStats" component={OwnerStats} />
          <Stack.Screen name="OwnerProfile" component={OwnerProfile} />
          <Stack.Screen
            name="OwnerLocationPicker"
            component={OwnerLocationPicker}
          />

          {/* El dueño también puede ver la vista de usuario para previsualizar */}
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetailScreen}
          />
        </>
      ) : (
        // Si es INVITADO, solo muestro Login y Exploración
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetailScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;
