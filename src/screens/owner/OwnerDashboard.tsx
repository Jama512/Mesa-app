// src/screens/owner/OwnerDashboard.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

type OwnerNav = StackNavigationProp<RootStackParamList, "OwnerDashboard">;

const OwnerDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { state, logout } = useAuth();
  const navigation = useNavigation<OwnerNav>();

  const restaurantName = state.restaurant?.name || "Restaurante no configurado";

  const goTo = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen as any);
  };

  const handleLogout = () => {
    logout();

    // IMPORTANT: reset al root stack para volver al Welcome
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Welcome" as any }],
      })
    );
  };

  return (
    <OwnerLayout
      title="Panel del restaurante"
      subtitle="Administra tu perfil, menú y promociones."
      showBack={false}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.welcome, { color: theme.colors.text }]}>
          ¡Bienvenido, {restaurantName}!
        </Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.card }]}
          onPress={() => goTo("OwnerCreateAnnouncement")}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Publicar anuncio
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Crea eventos o promociones
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.card }]}
          onPress={() => goTo("OwnerMenuList")}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Editar menú
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Actualiza precios y platillos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.card }]}
          onPress={() => goTo("OwnerProfile")}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Mi perfil
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Datos, fotos y servicios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.card }]}
          onPress={() => goTo("OwnerStats")}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Ver estadísticas
          </Text>
          <Text
            style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
          >
            Revisa visitas y rendimiento
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleLogout}
        activeOpacity={0.9}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 14,
  },
  welcome: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginTop: 8,
  },
  card: {
    width: "48%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  logoutButton: {
    marginTop: 22,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default OwnerDashboard;
