// src/screens/home/CategoryDetailScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ImageBackground,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";

type CategoryDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CategoryDetail"
>;

type CategoryDetailRouteProp = RouteProp<RootStackParamList, "CategoryDetail">;

interface CategoryDetailScreenProps {
  navigation: CategoryDetailNavigationProp;
  route: CategoryDetailRouteProp;
}

const headerBackground = require("../../../assets/Background.png");
const backgroundImage = require("../../../assets/Background.png");

const mockMenu = [
  {
    id: "1",
    name: "Pizza Margarita",
    price: "$95",
    desc: "Clásica con albahaca fresca.",
  },
  {
    id: "2",
    name: "Pizza Pepperoni",
    price: "$110",
    desc: "Queso extra y pepperoni.",
  },
  {
    id: "3",
    name: "Pizza Vegetariana",
    price: "$105",
    desc: "Verduras frescas de temporada.",
  },
];

const mockEvents = [
  { id: "1", title: "Noche de Trivia", date: "Hoy · 8:00 PM" },
  { id: "2", title: "2x1 en pizzas medianas", date: "Todos los martes" },
];

const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { restaurantName } = route.params;
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  // 👇 Leemos lo que el dueño configuró
  const { state } = useAuth();
  const ownerRestaurant = state.restaurant;

  // Si el nombre coincide, usamos sus datos (por ahora es la forma más simple)
  const isOwnerRestaurant =
    state.role === "owner" &&
    ownerRestaurant?.name &&
    ownerRestaurant.name.trim().toLowerCase() ===
      restaurantName.trim().toLowerCase();

  const features = useMemo(() => {
    if (!isOwnerRestaurant) return null;
    return ownerRestaurant?.features ?? null;
  }, [isOwnerRestaurant, ownerRestaurant?.features]);

  const address = useMemo(() => {
    if (!isOwnerRestaurant) return null;
    return ownerRestaurant?.address ?? null;
  }, [isOwnerRestaurant, ownerRestaurant?.address]);

  const [activeTab, setActiveTab] = useState<"menu" | "events" | "info">(
    "menu"
  );

  // Construimos la lista de servicios a mostrar (solo los que estén activos)
  const activeServices = useMemo(() => {
    if (!features) return [];
    const items: {
      key: string;
      label: string;
      icon: keyof typeof Ionicons.glyphMap;
    }[] = [];

    if (features.wifi)
      items.push({ key: "wifi", label: "Wifi gratis", icon: "wifi-outline" });
    if (features.outdoorSeating)
      items.push({
        key: "outdoor",
        label: "Mesas al aire libre",
        icon: "sunny-outline",
      });
    if (features.parking)
      items.push({
        key: "parking",
        label: "Estacionamiento",
        icon: "car-outline",
      });
    if (features.reservations)
      items.push({
        key: "reservations",
        label: "Reservaciones",
        icon: "calendar-outline",
      });
    if (features.delivery)
      items.push({
        key: "delivery",
        label: "Entrega a domicilio",
        icon: "bicycle-outline",
      });
    if (features.cardPayment)
      items.push({
        key: "card",
        label: "Pago con tarjeta",
        icon: "card-outline",
      });

    return items;
  }, [features]);

  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.12 : 0.2 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.header}
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* HERO / PORTADA */}
          <ImageBackground
            source={headerBackground}
            style={styles.hero}
            imageStyle={{ opacity: 0.35 }}
          >
            <View style={styles.heroOverlay} />

            {/* TOP BAR */}
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <View style={styles.backButtonInner}>
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* NOMBRE / RATING */}
            <View style={styles.heroBottom}>
              <Text style={[styles.heroTitle, { fontSize: FONT_SIZES.large }]}>
                {restaurantName}
              </Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={16} color="#FFD166" />
                  <Text style={styles.heroRatingText}>4.8</Text>
                </View>

                <Text style={styles.heroMetaText}>Abierto ahora · 450 m</Text>
              </View>
            </View>
          </ImageBackground>

          {/* TABS INTERNOS */}
          <View
            style={[styles.tabBar, { backgroundColor: theme.colors.header }]}
          >
            {["menu", "events", "info"].map((tabKey) => {
              const label =
                tabKey === "menu"
                  ? "Menú"
                  : tabKey === "events"
                  ? "Eventos/Promos"
                  : "Info";

              const selected = activeTab === tabKey;

              return (
                <TouchableOpacity
                  key={tabKey}
                  style={styles.tabItem}
                  onPress={() =>
                    setActiveTab(tabKey as "menu" | "events" | "info")
                  }
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: selected
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                  {selected && (
                    <View
                      style={[
                        styles.tabIndicator,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONTENIDO SEGÚN TAB */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {activeTab === "menu" && (
              <>
                {mockMenu.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.menuItem,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.menuName, { color: theme.colors.text }]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.menuDesc,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.menuPrice,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {item.price}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {activeTab === "events" && (
              <>
                {mockEvents.map((event) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventRow,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <View style={styles.eventIconCircle}>
                      <Ionicons name="megaphone" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.eventTitle,
                          { color: theme.colors.text },
                        ]}
                      >
                        {event.title}
                      </Text>
                      <Text
                        style={[
                          styles.eventDate,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {event.date}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {activeTab === "info" && (
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                {/* Dirección (si es el restaurante del owner y ya la puso) */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>
                    {address ? address : "Dirección no configurada"}
                  </Text>
                </View>

                {/* Servicios reales (si coincide con owner), si no, fallback */}
                {isOwnerRestaurant ? (
                  activeServices.length > 0 ? (
                    activeServices.map((s) => (
                      <View key={s.key} style={styles.infoRow}>
                        <Ionicons
                          name={s.icon}
                          size={18}
                          color={theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.infoText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        El dueño aún no selecciona servicios.
                      </Text>
                    </View>
                  )
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        Horario: 1:00 PM – 11:00 PM
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="wifi-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                      <Text
                        style={[styles.infoText, { color: theme.colors.text }]}
                      >
                        Wifi gratis · Mesas al aire libre
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* BOTÓN FLOTANTE: CÓMO LLEGAR (lo dejamos igual por ahora) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
          onPress={() => {}}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.fabText}>Cómo llegar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: 230, justifyContent: "space-between" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  backButton: { padding: 4 },
  backButtonInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBottom: { paddingHorizontal: 16, paddingBottom: 16 },
  heroTitle: { color: "#FFFFFF", fontWeight: "bold" },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  heroRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  heroRatingText: {
    color: "#FFD166",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 13,
  },
  heroMetaText: { color: "#FFFFFF", fontSize: 12 },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabIndicator: { marginTop: 4, height: 3, borderRadius: 999, width: 40 },

  menuItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  menuName: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  menuDesc: { fontSize: 12 },
  menuPrice: { fontWeight: "700", fontSize: 14, marginLeft: 10 },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  eventIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E67E22",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  eventTitle: { fontSize: 15, fontWeight: "600" },
  eventDate: { fontSize: 12, marginTop: 2 },

  infoCard: { borderRadius: 14, padding: 14, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13 },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 4,
  },
  fabText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
});

export default CategoryDetailScreen;
