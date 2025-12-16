// src/navigation/TabNavigator.tsx
import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/home/HomeScreen";
import FavoritesScreen from "../screens/Tabs/FavoritesScreen";
import ProfileScreen from "../screens/Tabs/ProfileScreen";
import CalendarScreen from "../screens/Tabs/CalendarScreen"; // 👈 NUEVO
import CityMapScreen from "../map/CityMapScreen";

import { useTheme } from "../theme/ThemeContext";

export type RootTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CalendarTab: undefined; // 👈 NUEVO
  FavoritesTab: undefined;
  ProfileTab: undefined; // (lo vamos a mostrar como "Más")
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  // 👇 En claro NO uses header si se ve oscuro; usa card.
  const tabBg = isDark ? theme.colors.header : theme.colors.card;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: theme.colors.border,
          borderTopWidth: Platform.OS === "android" ? 0 : 0.5,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,

          // se ve mejor en claro (Android)
          elevation: isDark ? 0 : 8,

          // iOS shadow
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "HomeTab") iconName = "home-outline";
          if (route.name === "SearchTab") iconName = "map-outline";
          if (route.name === "CalendarTab") iconName = "calendar-outline"; // 👈
          if (route.name === "FavoritesTab") iconName = "heart-outline";
          if (route.name === "ProfileTab")
            iconName = "ellipsis-horizontal-outline"; // 👈 "Más"

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />

      <Tab.Screen
        name="SearchTab"
        component={CityMapScreen}
        options={{ tabBarLabel: "Mapa" }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{ tabBarLabel: "Calendario" }}
      />

      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ tabBarLabel: "Favoritos" }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Más" }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
