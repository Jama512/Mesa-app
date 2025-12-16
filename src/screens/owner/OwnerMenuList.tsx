// src/screens/owner/OwnerDashboard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Image,
  ScrollView,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

// Navigation types
type OwnerNav = StackNavigationProp<RootStackParamList, "OwnerDashboard">;

// Assets
const background = require("../../../assets/Background.png"); // 👈 USANDO TU NOMBRE REAL
const logoMesa = require("../../../assets/LogoMesa.png");

const OwnerDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { state, logout } = useAuth();
  const navigation = useNavigation<OwnerNav>();
  const isDark = theme.name === "dark";

  const goTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as any);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      {/* Fondo con doodles */}
      <ImageBackground
        source={background}
        style={styles.bg}
        imageStyle={{ opacity: isDark ? 0.06 : 0.12 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- HEADER ---------- */}
          <View style={styles.header}>
            <Image source={logoMesa} style={styles.logo} resizeMode="contain" />

            <Text
              style={[
                styles.roleText,
                { color: theme.colors.textSecondary ?? theme.colors.text },
              ]}
            >
              Administrador
            </Text>

            <Text
              style={[styles.welcome, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              ¡Bienvenido,{" "}
              {state.restaurant?.name || "Restaurante no configurado"}!
            </Text>
          </View>

          {/* ---------- ACCIONES EN CUADROS ---------- */}
          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => goTo("OwnerCreateAnnouncement")}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Publicar anuncio
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Crea eventos o promociones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => goTo("OwnerMenuList")}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Editar menú
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Actualiza precios y platillos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => goTo("OwnerProfile")}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Mi perfil
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Datos y ubicación del restaurante
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => goTo("OwnerStats")}
            >
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Ver estadísticas
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Revisar visitas y rendimiento
              </Text>
            </TouchableOpacity>
          </View>

          {/* ---------- BOTÓN CERRAR SESIÓN ---------- */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={logout}
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 95,
    height: 48,
    marginBottom: 6,
  },
  roleText: {
    fontSize: 11,
  },
  welcome: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
    marginBottom: 30,
  },
  card: {
    width: "48%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
  },
  logoutButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default OwnerDashboard;
