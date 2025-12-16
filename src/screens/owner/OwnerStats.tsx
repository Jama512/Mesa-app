// src/screens/owner/OwnerStats.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";

const fakeVisits = [20, 30, 45, 60, 35, 28, 22];

const OwnerStats: React.FC = () => {
  const { theme } = useTheme();

  return (
    <OwnerLayout
      title="Estadísticas"
      subtitle="Visitas de ejemplo (últimos 7 días)."
      showBack
    >
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          Visitas por día (dummy)
        </Text>

        <View style={styles.barRow}>
          {fakeVisits.map((v, idx) => (
            <View key={idx} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  {
                    height: 10 + v,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
              <Text
                style={[styles.barLabel, { color: theme.colors.textSecondary }]}
              >
                {"LMXJVSD"[idx]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  barItem: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default OwnerStats;
