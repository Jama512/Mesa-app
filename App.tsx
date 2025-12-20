// App.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";

// Contextos
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/screens/auth/AuthContext";
import { LocationProvider } from "./src/context/LocationContext";
import { RestaurantsProvider } from "./src/context/RestaurantsContext"; // ✅ El nuevo con Firebase

// ❌ ELIMINAMOS REALM Y EL SEEDER (Ya no se usan)
// import { RealmProvider } from "./src/database/realm";
// import { RestaurantSeeder } from "./src/database/RestaurantSeeder";

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  const navigationTheme = {
    ...(theme.name === "light" ? DefaultTheme : DarkTheme),
    colors: {
      ...(theme.name === "light" ? DefaultTheme.colors : DarkTheme.colors),
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      <StackNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      {/* ✅ Estructura limpia para Firebase */}
      {/* AuthProvider debe envolver a RestaurantsProvider para que este pueda leer el usuario actual */}
      <AuthProvider>
        <RestaurantsProvider>
          <LocationProvider>
            <AppNavigator />
          </LocationProvider>
        </RestaurantsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
