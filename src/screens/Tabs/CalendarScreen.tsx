// src/screens/Tabs/CalendarScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";

const doodleBg = require("../../../assets/Background.png");

type CalendarItem = {
  id: string;
  title: string;
  subtitle: string; // restaurante / info
  dateLabel: string; // "Hoy 9:00 PM"
};

const MOCK_ITEMS: CalendarItem[] = [
  {
    id: "1",
    title: "Noche de Karaoke",
    subtitle: "Bar Central",
    dateLabel: "Hoy · 9:00 PM",
  },
  {
    id: "2",
    title: "2x1 Cerveza",
    subtitle: "El Draft",
    dateLabel: "Hoy · 8:00 PM",
  },
];

const CalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  const [selectedDay, setSelectedDay] = useState<"Hoy" | "Semana" | "Mes">(
    "Hoy"
  );

  const items = useMemo(() => {
    // Después aquí filtras por fecha real (Realm)
    return MOCK_ITEMS;
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.header}
      />

      <ImageBackground
        source={doodleBg}
        style={styles.bg}
        imageStyle={{ opacity: isDark ? 0.07 : 0.12 }}
      >
        {/* HEADER */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.header,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Calendario
          </Text>

          {/* Segmented control simple */}
          <View
            style={[
              styles.segment,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {(["Hoy", "Semana", "Mes"] as const).map((k) => {
              const active = selectedDay === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setSelectedDay(k)}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : "transparent",
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: active ? "#FFFFFF" : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {k}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* LISTA */}
        {items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  // luego: navegar a CategoryDetail o detalle de evento
                }}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.dateLabel}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="calendar-clear-outline"
              size={28}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              No tienes eventos guardados todavía.
            </Text>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bg: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  segment: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CalendarScreen;
