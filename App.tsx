// App.tsx
import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/screens/auth/AuthContext";
import { LocationProvider } from "./src/context/LocationContext";
import { RestaurantsProvider } from "./src/context/RestaurantsContext";
import { RealmProvider } from "./src/database/realm";
// ✅ IMPORTAR EL SEEDER
import { RestaurantSeeder } from "./src/database/RestaurantSeeder";

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
      <RealmProvider>
        {/* ✅ AQUÍ SE EJECUTA LA CARGA INICIAL DE DATOS */}
        <RestaurantSeeder />

        <AuthProvider>
          <LocationProvider>
            <RestaurantsProvider>
              <AppNavigator />
            </RestaurantsProvider>
          </LocationProvider>
        </AuthProvider>
      </RealmProvider>
    </ThemeProvider>
  );
};

export default App;
