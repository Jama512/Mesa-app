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
import { useAuth } from "../auth/AuthContext";

type HomeTabNav = BottomTabNavigationProp<RootTabParamList, "HomeTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type HomeScreenNavigationProp = CompositeNavigationProp<HomeTabNav, RootNav>;

const doodleBg = require("../../../assets/Background.png");

// ✅ Cuando tengas imágenes en assets, descomenta:
const RESTAURANT_IMAGES: Record<string, any> = {
  // "1": require("../../../assets/restaurants/luka.jpg"),
  // "2": require("../../../assets/restaurants/coffee-black.jpg"),
  // "3": require("../../../assets/restaurants/buen-taco.jpg"),
};

const EVENT_IMAGES: Record<string, any> = {
  // "1": require("../../../assets/events/karaoke.jpg"),
  // "2": require("../../../assets/events/beer.jpg"),
  // "3": require("../../../assets/events/game.jpg"),
};

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
  distance: string;
  rating: number;
  category: string;
  status: string;

  // ✅ lo que suba el owner (Realm) normalmente será URI
  imageUri?: string;

  // ✅ mientras, assets locales
  imageSource?: any;

  isOwnerRestaurant?: boolean;
};

const mockRestaurants: RestaurantCardItem[] = [
  {
    id: "1",
    name: "Pizzería Luka",
    distance: "450 m",
    rating: 4.8,
    category: "Pizza",
    status: "Abierto ahora",
    imageSource: RESTAURANT_IMAGES["1"],
  },
  {
    id: "2",
    name: "Coffee Black",
    distance: "650 m",
    rating: 4.6,
    category: "Café",
    status: "Cierra a las 10:00 PM",
    imageSource: RESTAURANT_IMAGES["2"],
  },
  {
    id: "3",
    name: "El Buen Taco",
    distance: "900 m",
    rating: 4.7,
    category: "Tacos",
    status: "Abierto ahora",
    imageSource: RESTAURANT_IMAGES["3"],
  },
];

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state } = useAuth();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const [query, setQuery] = useState("");

  // ✅ Inserta el restaurante del owner arriba (si está logueado como owner)
  const restaurants: RestaurantCardItem[] = useMemo(() => {
    const list = [...mockRestaurants];

    if (state.role === "owner" && state.restaurant?.name) {
      const ownerName = state.restaurant.name.trim();

      const ownerItem: RestaurantCardItem = {
        id: "owner-restaurant",
        name: ownerName,
        distance: "—",
        rating: 5.0,
        category: "Tu restaurante",
        status:
          ownerName === "Restaurante no configurado"
            ? "Configúralo en Mi perfil"
            : "Administrando",
        isOwnerRestaurant: true,
        imageUri: state.restaurant.images?.[0], // ✅ primera foto
      };

      const exists = list.some(
        (r) => r.name.trim().toLowerCase() === ownerName.toLowerCase()
      );

      return exists ? list : [ownerItem, ...list];
    }

    return list;
  }, [state.role, state.restaurant]);

  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) =>
      `${r.name} ${r.category}`.toLowerCase().includes(q)
    );
  }, [query, restaurants]);

  // ✅ Buscador con buen contraste en claro/oscuro
  const searchBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)";
  const searchBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.1 : 0.18 }}
    >
      <SafeAreaView style={styles.container}>
        {/* ✅ evita “mancha” arriba en tema claro */}
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        {/* HEADER (solo ubicación, sin campana) */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.locationText, { color: theme.colors.text }]}>
              Ubicación actual: Cerca de Zona Centro
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
              {mockEvents.map((event) => {
                const img = EVENT_IMAGES[event.id];
                return (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventCard,
                      { backgroundColor: theme.colors.card },
                    ]}
                    activeOpacity={0.85}
                  >
                    {img ? (
                      <ImageBackground
                        source={img}
                        style={styles.eventImg}
                        imageStyle={{ borderRadius: 16, opacity: 0.92 }}
                      >
                        <View style={styles.eventOverlay} />
                      </ImageBackground>
                    ) : null}

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
                );
              })}
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
                    restaurantName: rest.name,
                  })
                }
              >
                <View style={styles.restaurantLeft}>
                  {/* ✅ Imagen (uri / asset) */}
                  {rest.imageUri ? (
                    <Image
                      source={{ uri: rest.imageUri }}
                      style={styles.photoAvatar}
                    />
                  ) : rest.imageSource ? (
                    <Image
                      source={rest.imageSource}
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
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
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
                      {rest.category}
                      {rest.distance !== "—" ? ` · ${rest.distance}` : ""}
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
  locationText: { fontSize: 13, fontWeight: "600" },

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

  // Eventos
  eventCard: {
    width: 220,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    overflow: "hidden",
  },
  eventImg: { ...StyleSheet.absoluteFillObject },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
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

  // Categorías
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

  // Restaurantes
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
  restaurantName: { fontSize: 15, fontWeight: "600" },
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
