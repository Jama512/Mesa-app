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
  Image,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useTheme } from "../../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

import { useRestaurants } from "../../context/RestaurantsContext";
import { useLocationState } from "../../context/LocationContext";

// ✅ 1. IMPORTAR REALM Y EL MODELO DISH
import { useQuery } from "../../database/realm";
import { Dish } from "../../database/models/DishModel";

type Nav = StackNavigationProp<RootStackParamList, "CategoryDetail">;
type Rte = RouteProp<RootStackParamList, "CategoryDetail">;

type Props = { navigation: Nav; route: Rte };

const headerDoodles = require("../../../assets/Background.png");
const bgDoodles = require("../../../assets/Background.png");

// --- helpers: distancia en km ---
const toRad = (x: number) => (x * Math.PI) / 180;
const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const CategoryDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { restaurantId } = route.params;
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  const { restaurants, favorites, toggleFavorite } = useRestaurants();
  const { location } = useLocationState();

  // ✅ 2. CONSULTA DE PLATILLOS (Filtrados por este restaurante)
  const dishes = useQuery(Dish).filtered("restaurantId == $0", restaurantId);

  const restaurant = useMemo(
    () => restaurants.find((r) => r.id === restaurantId),
    [restaurants, restaurantId]
  );

  const isFav = favorites.includes(restaurantId);

  const distanceLabel = useMemo(() => {
    if (!restaurant?.latitude || !restaurant?.longitude) return null;
    if (!location.coords) return null;

    const km = haversineKm(location.coords, {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    });

    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }, [restaurant?.latitude, restaurant?.longitude, location.coords]);

  const [activeTab, setActiveTab] = useState<"menu" | "events" | "info">(
    "info" // Puedes cambiar el default a "menu" si prefieres
  );

  if (!restaurant) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Restaurante no encontrado
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: theme.colors.primary }}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const coverUri = restaurant.images?.[0];

  return (
    <ImageBackground
      source={bgDoodles}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.1 : 0.18 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {/* HERO */}
          <ImageBackground
            source={coverUri ? { uri: coverUri } : headerDoodles}
            style={styles.hero}
            imageStyle={{ opacity: coverUri ? 1 : 0.35 }}
          >
            <View style={styles.heroOverlay} />

            <View style={styles.heroTopRow}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => toggleFavorite(restaurantId)}
              >
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={20}
                  color={isFav ? theme.colors.primary : "#fff"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.heroTitle}>{restaurant.name}</Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={16} color="#FFD166" />
                  <Text style={styles.heroRatingText}>
                    {restaurant.rating ?? "4.8"}
                  </Text>
                </View>

                <Text style={styles.heroMetaText}>
                  {distanceLabel ? `${distanceLabel} · ` : ""}
                  {restaurant.status ?? "Abierto ahora"}
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* TABS */}
          <View style={[styles.tabBar, { backgroundColor: theme.colors.card }]}>
            {[
              { key: "menu", label: "Menú" },
              { key: "events", label: "Eventos/Promos" },
              { key: "info", label: "Info" },
            ].map((t) => {
              const selected = activeTab === (t.key as any);
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(t.key as any)}
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
                    {t.label}
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

          {/* CONTENT */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {/* ✅ SECCIÓN MENÚ CONECTADA A REALM */}
            {activeTab === "menu" && (
              <View>
                {dishes.length === 0 ? (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      Este menú aún no tiene platillos registrados.
                    </Text>
                  </View>
                ) : (
                  dishes.map((dish) => (
                    <View
                      key={dish._id}
                      style={[
                        styles.dishCard,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: theme.colors.border,
                          opacity: dish.isAvailable ? 1 : 0.6,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dishName,
                            { color: theme.colors.text },
                          ]}
                        >
                          {dish.name}
                        </Text>
                        {!!dish.description && (
                          <Text
                            style={[
                              styles.dishDesc,
                              { color: theme.colors.textSecondary },
                            ]}
                          >
                            {dish.description}
                          </Text>
                        )}
                        {!dish.isAvailable && (
                          <Text
                            style={{
                              color: "#ef4444",
                              fontSize: 11,
                              fontWeight: "700",
                              marginTop: 4,
                            }}
                          >
                            Agotado
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dishPrice,
                          { color: theme.colors.primary },
                        ]}
                      >
                        ${dish.price.toFixed(0)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === "events" && (
              <>
                {(restaurant.events ?? []).length === 0 ? (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: theme.colors.card },
                    ]}
                  >
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                    >
                      No hay eventos todavía
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        marginTop: 6,
                      }}
                    >
                      Cuando el dueño publique promos, aparecerán aquí.
                    </Text>
                  </View>
                ) : (
                  (restaurant.events ?? []).map((e) => (
                    <View
                      key={e.id}
                      style={[
                        styles.eventRow,
                        { backgroundColor: theme.colors.card },
                      ]}
                    >
                      <View
                        style={[
                          styles.eventIconCircle,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Ionicons name="megaphone" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.eventTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          {e.title}
                        </Text>
                        <Text
                          style={[
                            styles.eventDate,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {e.dateLabel}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}

            {activeTab === "info" && (
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                {!!restaurant.address && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[styles.infoText, { color: theme.colors.text }]}
                    >
                      {restaurant.address}
                    </Text>
                  </View>
                )}

                {!!restaurant.phone && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[styles.infoText, { color: theme.colors.text }]}
                    >
                      {restaurant.phone}
                    </Text>
                  </View>
                )}

                {!!restaurant.description && (
                  <View
                    style={[
                      styles.card,
                      { backgroundColor: "transparent", paddingHorizontal: 0 },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {restaurant.description}
                    </Text>
                  </View>
                )}

                {/* Features */}
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    Servicios
                  </Text>

                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {restaurant.features?.wifi && <Chip label="Wifi" />}
                    {restaurant.features?.outdoorSeating && (
                      <Chip label="Aire libre" />
                    )}
                    {restaurant.features?.parking && <Chip label="Parking" />}
                    {restaurant.features?.reservations && (
                      <Chip label="Reservaciones" />
                    )}
                    {restaurant.features?.delivery && <Chip label="Delivery" />}
                    {restaurant.features?.cardPayment && (
                      <Chip label="Tarjeta" />
                    )}

                    {!restaurant.features && (
                      <Text style={{ color: theme.colors.textSecondary }}>
                        (Sin servicios configurados)
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* FAB: Cómo llegar */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.85}
          onPress={() => {
            // Luego abrimos Google Maps con coords del restaurante
          }}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.fabText}>Cómo llegar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
};

const Chip = ({ label }: { label: string }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

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
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroBottom: { paddingHorizontal: 16, paddingBottom: 16 },
  heroTitle: { color: "#fff", fontWeight: "800", fontSize: 20 },
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
  heroMetaText: { color: "#fff", fontSize: 12 },

  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "600" },
  tabIndicator: { marginTop: 4, height: 3, borderRadius: 999, width: 40 },

  card: { borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700" },

  // Estilos para platillos (Menú)
  dishCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dishName: { fontSize: 14, fontWeight: "700" },
  dishDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  dishPrice: { fontSize: 13, fontWeight: "800", marginLeft: 10 },

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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  eventTitle: { fontSize: 15, fontWeight: "600" },
  eventDate: { fontSize: 12, marginTop: 2 },

  infoCard: { borderRadius: 14, padding: 14, gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13 },

  chip: {
    backgroundColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

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
  fabText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

export default CategoryDetailScreen;
