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
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../screens/auth/AuthContext";

import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

type ProfileNav = StackNavigationProp<RootStackParamList>;

const doodleBg = require("../../../assets/Background.png");
const logoMesa = require("../../../assets/LogoMesa.png");

const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.name === "dark";

  const { state, logout } = useAuth();
  const navigation = useNavigation<ProfileNav>();

  const isOwner = state.role === "owner";
  const ownerEmail = state.email ?? "Usuario";

  const handleOwnerButton = () => {
    if (isOwner) {
      logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" }],
      });
    } else {
      navigation.navigate("Login");
    }
  };

  const goToOwnerDashboard = () => {
    navigation.navigate("OwnerDashboard");
  };

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.08 : 0.14 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.header}
        />

        {/* HEADER (coherente con Home/Favorites) */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.header,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={logoMesa} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Perfil
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Ajustes de la app y sesión
              </Text>
            </View>
          </View>

          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>

        {/* CARD: Apariencia */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Apariencia
          </Text>

          <View
            style={[
              styles.rowItem,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons
                name={isDark ? "moon-outline" : "sunny-outline"}
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                Modo oscuro
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              thumbColor={isDark ? theme.colors.primary : "#F5F5F5"}
              trackColor={{
                false: "rgba(0,0,0,0.25)",
                true: theme.colors.primary,
              }}
            />
          </View>
        </View>

        {/* CARD: Legal / soporte */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
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
            activeOpacity={0.9}
            style={[
              styles.listItem,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.listItemText, { color: theme.colors.text }]}>
              Términos y Condiciones
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.listItem,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.listItemText, { color: theme.colors.text }]}>
              Política de privacidad
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* CTA Dueño */}
        <View style={styles.footer}>
          <Text style={[styles.footerLabel, { color: theme.colors.text }]}>
            ¿Eres dueño de un restaurante?
          </Text>

          {isOwner && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { borderColor: theme.colors.primary },
              ]}
              onPress={goToOwnerDashboard}
              activeOpacity={0.9}
            >
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Ir a mi panel (Owner)
              </Text>
            </TouchableOpacity>
          )}

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
            style={[
              styles.footerCaption,
              { color: theme.colors.textSecondary },
            ]}
          >
            {isOwner
              ? `Sesión iniciada como: ${ownerEmail}`
              : "Estás navegando como invitado."}
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 44,
    height: 28,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 18,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },

  rowItem: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  subSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    marginTop: 18,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 18,
  },
  footerLabel: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: "600",
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontWeight: "800",
    fontSize: 12,
  },

  ownerButton: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 999,
    width: "100%",
    alignItems: "center",
  },
  ownerButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  footerCaption: {
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
    opacity: 0.9,
  },
});

export default ProfileScreen;
