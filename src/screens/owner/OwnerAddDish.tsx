// src/screens/owner/OwnerAddDish.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";

const OwnerAddDish: React.FC = () => {
  const { theme } = useTheme();

  return (
    <OwnerLayout
      title="Agregar platillo"
      subtitle="Pantalla placeholder. Después se conectará al menú real."
      showBack
    >
      <View style={styles.center}>
        <Text
          style={{ color: theme.colors.textSecondary, textAlign: "center" }}
        >
          Aquí podrás crear nuevos platillos, categorías y precios para tu
          restaurante. Por ahora sólo es una pantalla de ejemplo para que el
          flujo de dueño quede armado.
        </Text>
      </View>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "flex-start",
  },
});

export default OwnerAddDish;
