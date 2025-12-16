// src/screens/auth/WelcomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const logoImage = require("../../../assets/LogoMesa.png");
const backgroundImage = require("../../../assets/Background.png");

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Fondo doodles */}
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        imageStyle={{ opacity: isDark ? 0.12 : 0.25 }}
      />

      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background}
        />

        {/* Logo y mensaje */}
        <View style={styles.topSection}>
          <Text
            style={[styles.smallTitle, { color: theme.colors.textSecondary }]}
          >
            Bienvenido
          </Text>

          <Image source={logoImage} style={styles.logo} />

          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: FONT_SIZES.medium,
              },
            ]}
          >
            Encuentra tu lugar
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.bottomSection}>
          {/* Explorar como invitado */}
          <TouchableOpacity
            style={[
              styles.mainButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.replace("Home", { screen: "HomeTab" })}
          >
            <Text style={styles.mainButtonText}>Explorar como invitado</Text>
          </TouchableOpacity>

          {/* Iniciar sesión (dueños / admin) */}
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.colors.primary },
              ]}
            >
              Iniciar sesión
            </Text>
          </TouchableOpacity>

          {/* Link para dueños */}
          <View style={styles.ownerRow}>
            <Text
              style={[
                styles.ownerText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: FONT_SIZES.small,
                },
              ]}
            >
              ¿Tienes un restaurante?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text
                style={[
                  styles.ownerLink,
                  { color: theme.colors.primary, fontSize: FONT_SIZES.small },
                ]}
              >
                {" "}
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  logo: {
    width: 160,
    height: 120,
    resizeMode: "contain",
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: "flex-end",
  },
  mainButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mainButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 18,
  },
  secondaryButtonText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  ownerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerText: {},
  ownerLink: {
    fontWeight: "bold",
  },
});

export default WelcomeScreen;
