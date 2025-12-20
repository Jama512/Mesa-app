// src/navigation/StackNavigator.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigatorScreenParams } from "@react-navigation/native";

// Auth
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";

// Tabs
import TabNavigator, { RootTabParamList } from "./TabNavigator";

// Guest detail
import CategoryDetailScreen from "../screens/home/CategoryDetailScreen";

// Owner flow
import OwnerDashboard from "../screens/owner/OwnerDashboard";
import OwnerCreateAnnouncement from "../screens/owner/OwnerCreateAnnouncement";
import OwnerMenuList from "../screens/owner/OwnerMenuList";
import OwnerStats from "../screens/owner/OwnerStats";
import OwnerProfile from "../screens/owner/OwnerProfile";
import OwnerAddDish from "../screens/owner/OwnerAddDish";
import OwnerLocationPicker from "../screens/owner/OwnerLocationPicker";

// Auth global
import { useAuth } from "../screens/auth/AuthContext";

// ✅ CORRECCIÓN: Importamos el tipo Dish desde el contexto para que coincida
// (Borramos el "export type Dish = {...}" que estaba aquí antes)
import { Dish } from "../context/RestaurantsContext";

export type RootStackParamList = {
  // Guest/auth stack
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: NavigatorScreenParams<RootTabParamList>;
  CategoryDetail: { restaurantId: string };

  // Owner stack
  OwnerDashboard: undefined;
  OwnerCreateAnnouncement: undefined;
  OwnerMenuList: undefined;
  OwnerStats: undefined;
  OwnerProfile: undefined;
  // Ahora "Dish" es el mismo tipo que usa OwnerAddDish y el Contexto
  OwnerAddDish: { mode?: "create" | "edit"; dish?: Dish } | undefined;
  OwnerLocationPicker: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  const { state } = useAuth();
  const isOwner = state.isAuthenticated && state.role === "owner";

  return (
    <Stack.Navigator
      key={isOwner ? "owner-stack" : "guest-stack"}
      screenOptions={{ headerShown: false }}
    >
      {isOwner ? (
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

          {/* ✅ IMPORTANTE: también disponible para owner (para CalendarTab, etc.) */}
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetailScreen}
          />
        </>
      ) : (
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
