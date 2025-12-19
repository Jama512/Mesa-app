// src/screens/home/HomeScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { RootTabParamList } from "../../navigation/TabNavigator";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";

import { useLocationState } from "../../context/LocationContext";
import { useRestaurants } from "../../context/RestaurantsContext";

type HomeTabNav = BottomTabNavigationProp<RootTabParamList, "HomeTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HomeScreenNavigationProp = CompositeNavigationProp<HomeTabNav, RootNav>;

const doodleBg = require("../../../assets/Background.png");

// ---------- Distancia (Haversine) ----------
const toRad = (v: number) => (v * Math.PI) / 180;

const haversineMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => {
  const R = 6371000; // m
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
};

const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

// Mock de eventos/categorías (luego lo conectas a EventsContext o Realm)
const mockEvents = [
  {
    id: "1",
    title: "Noche de Karaoke",
    subtitle: "Hoy 9:00 PM · Bar Central",
    badge: "Solo hoy",
  },
  {
    id: "2",
    title: "2x1 Cerveza",
    subtitle: "Hasta las 11:00 PM · El Draft",
    badge: "Promo",
  },
  {
    id: "3",
    title: "Partido en Pantalla Grande",
    subtitle: "7:00 PM · La Cantera",
    badge: "Deportes",
  },
];

const mockCategories = [
  { id: "1", name: "Pizza", icon: "pizza" as const },
  { id: "2", name: "Tacos", icon: "restaurant" as const },
  { id: "3", name: "Café", icon: "cafe" as const },
  { id: "4", name: "Bar", icon: "wine" as const },
  { id: "5", name: "Postres", icon: "ice-cream" as const },
];

type RestaurantCardItem = {
  id: string;
  name: string;
  category: string;
  rating: number;
  status: string;

  latitude?: number;
  longitude?: number;

  distanceMeters?: number | null;
  distanceLabel: string;

  imageUri?: string;
  isOwnerRestaurant?: boolean;
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { location } = useLocationState();
  const { restaurants } = useRestaurants();

  const [query, setQuery] = useState("");

  const searchBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.78)";
  const searchBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)";

  // 1) convertir a items + calcular distancia
  const computedRestaurants: RestaurantCardItem[] = useMemo(() => {
    const userCoords = location.coords;

    const base: RestaurantCardItem[] = restaurants.map((r: any) => {
      const hasCoords =
        userCoords &&
        typeof r.latitude === "number" &&
        typeof r.longitude === "number";

      const distanceMeters = hasCoords
        ? haversineMeters(userCoords!, {
            latitude: r.latitude,
            longitude: r.longitude,
          })
        : null;

      return {
        id: r.id,
        name: r.name,
        category: r.category ?? "Restaurante",
        rating: typeof r.rating === "number" ? r.rating : 4.7,
        status: r.isOwnerRestaurant ? "Administrando" : "Abierto ahora",
        latitude: r.latitude,
        longitude: r.longitude,
        distanceMeters,
        distanceLabel:
          distanceMeters != null ? formatDistance(distanceMeters) : "—",
        imageUri: r.images?.[0],
        isOwnerRestaurant: !!r.isOwnerRestaurant,
      };
    });

    // 2) ordenar por distancia si ya hay coords (manteniendo owner arriba si existe)
    if (location.coords) {
      const head = base[0]?.isOwnerRestaurant ? [base[0]] : [];
      const rest = base[0]?.isOwnerRestaurant ? base.slice(1) : base;

      rest.sort((a, b) => {
        const da = a.distanceMeters ?? Number.POSITIVE_INFINITY;
        const db = b.distanceMeters ?? Number.POSITIVE_INFINITY;
        return da - db;
      });

      return [...head, ...rest];
    }

    return base;
  }, [restaurants, location.coords]);

  // 3) filtro por búsqueda
  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return computedRestaurants;
    return computedRestaurants.filter((r) =>
      `${r.name} ${r.category}`.toLowerCase().includes(q)
    );
  }, [query, computedRestaurants]);

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.1 : 0.18 }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        {/* HEADER (solo ubicación, sin notificaciones) */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.locationText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              Ubicación actual: {location.label}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* BUSCADOR */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: searchBg, borderColor: searchBorder },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Buscar lugar, comida o evento"
              placeholderTextColor={theme.colors.textSecondary}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* EVENTOS DE HOY */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              Eventos de hoy
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {mockEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.eventCard,
                    { backgroundColor: theme.colors.card },
                  ]}
                  activeOpacity={0.85}
                >
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{event.badge}</Text>
                  </View>
                  <Text
                    style={[styles.eventTitle, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {event.title}
                  </Text>
                  <Text
                    style={[
                      styles.eventSubtitle,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {event.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* CATEGORÍAS */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              Categorías
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {mockCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.colors.card },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={18} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[styles.categoryText, { color: theme.colors.text }]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* CERCA DE TI */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              Cerca de ti
            </Text>

            {filteredRestaurants.map((rest) => (
              <TouchableOpacity
                key={rest.id}
                style={[
                  styles.restaurantCard,
                  { backgroundColor: theme.colors.card },
                ]}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("CategoryDetail", {
                    restaurantId: rest.id,
                  } as any)
                }
              >
                <View style={styles.restaurantLeft}>
                  {rest.imageUri ? (
                    <Image
                      source={{ uri: rest.imageUri }}
                      style={styles.photoAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.restaurantAvatar,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Ionicons name="restaurant" size={20} color="#FFFFFF" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.restaurantName,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {rest.name}
                      </Text>

                      {rest.isOwnerRestaurant && (
                        <View
                          style={[
                            styles.ownerPill,
                            { borderColor: theme.colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.ownerPillText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Tu restaurante
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.restaurantMeta,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {rest.category} · {rest.distanceLabel}
                    </Text>

                    <Text
                      style={[
                        styles.restaurantStatus,
                        { color: theme.colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {rest.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.restaurantRight}>
                  <View
                    style={[styles.ratingBadge, { backgroundColor: searchBg }]}
                  >
                    <Ionicons name="star" size={14} color="#FFD166" />
                    <Text style={styles.ratingText}>
                      {rest.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 46 : 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 13, fontWeight: "600", flexShrink: 1 },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },

  section: { marginTop: 4, marginBottom: 16 },
  sectionTitle: { fontWeight: "600", marginBottom: 10 },

  eventCard: {
    width: 220,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    overflow: "hidden",
  },
  eventBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E67E22",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 8,
  },
  eventBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  eventTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  eventSubtitle: { fontSize: 12 },

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  categoryText: { fontSize: 13, fontWeight: "500" },

  restaurantCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  restaurantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  restaurantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  photoAvatar: { width: 44, height: 44, borderRadius: 12 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  restaurantName: { fontSize: 15, fontWeight: "600", flexShrink: 1 },

  ownerPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ownerPillText: { fontSize: 10, fontWeight: "700" },

  restaurantMeta: { fontSize: 12 },
  restaurantStatus: { fontSize: 11, marginTop: 2 },

  restaurantRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 44,
    marginLeft: 10,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  ratingText: {
    color: "#FFD166",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
});

export default HomeScreen;
