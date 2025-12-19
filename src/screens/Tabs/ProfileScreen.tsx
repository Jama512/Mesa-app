// src/screens/Tabs/ProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../screens/auth/AuthContext";

import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { CompositeNavigationProp } from "@react-navigation/native";

import { RootTabParamList } from "../../navigation/TabNavigator";
import { RootStackParamList } from "../../navigation/StackNavigator";

type TabNav = BottomTabNavigationProp<RootTabParamList, "ProfileTab">;
type StackNav = StackNavigationProp<RootStackParamList>;
type Nav = CompositeNavigationProp<TabNav, StackNav>;

const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.name === "dark";

  const { state, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const isOwner = state.role === "owner";
  const ownerEmail = state.email ?? "Usuario invitado";

  const handleOwnerButton = () => {
    if (isOwner) {
      // ✅ Importante: NO reset a "Welcome"
      // Tu StackNavigator se remonta solo por el key guest/owner
      logout();
      return;
    }

    // ✅ Ir a login de dueños (Stack)
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* CARD MESA + Apariencia */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#111111" : "#FFFFFF" },
        ]}
      >
        <Text style={[styles.logoText, { color: theme.colors.primary }]}>
          MESA
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Apariencia
        </Text>

        <View
          style={[
            styles.toggleRow,
            { backgroundColor: isDark ? "#1E1E1E" : "#222222" },
          ]}
        >
          <Text style={[styles.toggleLabel, { color: "#FFFFFF" }]}>
            Modo oscuro
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#FFA726" : "#F5F5F5"}
            trackColor={{ false: "#888888", true: "#FFA726" }}
          />
        </View>
      </View>

      {/* LEGAL Y SOPORTE */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#111111" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[
            styles.subSectionTitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          LEGAL Y SOPORTE
        </Text>

        <TouchableOpacity
          style={[
            styles.listItem,
            { backgroundColor: isDark ? "#1E1E1E" : "#F3F3F3" },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.listItemText, { color: theme.colors.text }]}>
            Términos y Condiciones
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            &gt;
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.listItem,
            { backgroundColor: isDark ? "#1E1E1E" : "#F3F3F3" },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.listItemText, { color: theme.colors.text }]}>
            Política de privacidad
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
            &gt;
          </Text>
        </TouchableOpacity>
      </View>

      {/* CTA DUEÑO / SESIÓN */}
      <View style={styles.footer}>
        <Text style={[styles.footerLabel, { color: theme.colors.text }]}>
          ¿Eres dueño?
        </Text>

        <TouchableOpacity
          style={[
            styles.ownerButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleOwnerButton}
          activeOpacity={0.9}
        >
          <Text style={styles.ownerButtonText}>
            {isOwner ? "Cerrar sesión" : "Inicia sesión como dueño"}
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.footerCaption, { color: theme.colors.textSecondary }]}
        >
          {isOwner
            ? `Sesión iniciada como: ${ownerEmail}`
            : "Estás navegando como invitado."}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleLabel: { fontSize: 14, fontWeight: "500" },
  subSectionTitle: { fontSize: 11, fontWeight: "600", marginBottom: 8 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  listItemText: { flex: 1, fontSize: 14, fontWeight: "500" },
  chevron: { fontSize: 18, fontWeight: "600" },
  footer: { marginTop: 24, alignItems: "center", paddingHorizontal: 24 },
  footerLabel: { fontSize: 13, marginBottom: 8 },
  ownerButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  ownerButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  footerCaption: { fontSize: 11, marginTop: 6, textAlign: "center" },
});

export default ProfileScreen;
