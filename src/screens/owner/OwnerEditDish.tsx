// src/screens/owner/OwnerEditDish.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";

const OwnerEditDish: React.FC = () => {
  const { theme } = useTheme();

  return (
    <OwnerLayout
      title="Editar platillo"
      subtitle="En el futuro aquí editarás un platillo específico."
      showBack
    >
      <View style={styles.center}>
        <Text style={{ color: theme.colors.textSecondary }}>
          Placeholder de edición de platillo. Se puede dejar así para la
          presentación.
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

export default OwnerEditDish;
