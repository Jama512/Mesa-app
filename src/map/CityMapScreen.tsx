// src/map/CityMapScreen.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import MapView, {
  Marker,
  Circle,
  Region,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
// ✅ 1. CAMBIO IMPORTANTE: Importar Contexto, NO data estática
import { useRestaurants, Restaurant } from "../context/RestaurantsContext";
import { useLocationState } from "../context/LocationContext";
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootTabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/StackNavigator";

type MapTabNav = BottomTabNavigationProp<RootTabParamList, "SearchTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type MapNavigationProp = CompositeNavigationProp<MapTabNav, RootNav>;

const DEFAULT_CENTER = {
  latitude: 20.076186,
  longitude: -102.271682,
};

const USER_RADIUS_METERS = 2000;
const INITIAL_DELTA = 0.05;

// Estilos de mapa (Google Maps JSON styles)
const lightMapStyle = [
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
];

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
];

const forkPin = require("../../assets/fork-pin.png");

function buildNiceLabelFromGeocode(geo: Location.LocationGeocodedAddress[]) {
  const first = geo?.[0];
  if (!first) return "Ubicación actual";
  const best = (
    first.district ||
    first.subregion ||
    first.city ||
    "tu zona"
  ).toString();
  return `Cerca de ${best}`;
}

const CityMapScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<MapNavigationProp>();

  // ✅ 2. USAR DATOS REALES DEL CONTEXTO
  const { restaurants } = useRestaurants();
  const { setLocation } = useLocationState();

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_CENTER.latitude,
    longitude: DEFAULT_CENTER.longitude,
    latitudeDelta: INITIAL_DELTA,
    longitudeDelta: INITIAL_DELTA,
  });

  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  // ✅ 3. FILTRAR RESTAURANTES CON UBICACIÓN VÁLIDA
  const mapRestaurants = useMemo(() => {
    return restaurants.filter(
      (r) => r.latitude !== undefined && r.longitude !== undefined
    );
  }, [restaurants]);

  const askLocation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Habilita ubicación para continuar.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(current);
      setRegion((prev) => ({
        ...prev,
        latitude: current.latitude,
        longitude: current.longitude,
      }));

      let label = "Ubicación actual";
      try {
        const geo = await Location.reverseGeocodeAsync(current);
        label = buildNiceLabelFromGeocode(geo);
      } catch {}

      setLocation({ coords: current, label });
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    askLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleCenter = userLocation ?? DEFAULT_CENTER;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.header}
      />

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
          Mapa / Exploración
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          Restaurantes de MESA cerca de ti
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          region={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
          showsPointsOfInterest={false}
          onPress={() => setSelectedRestaurant(null)}
        >
          <Circle
            center={circleCenter}
            radius={USER_RADIUS_METERS}
            strokeColor={theme.colors.primary}
            fillColor="rgba(255,140,0,0.15)"
          />

          {/* ✅ 4. RENDERIZAR PINES REALES */}
          {mapRestaurants.map((rest) => (
            <Marker
              key={rest.id}
              coordinate={{
                latitude: rest.latitude!, // ! porque ya filtramos undefined
                longitude: rest.longitude!,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedRestaurant(rest)}
            >
              <Image source={forkPin} style={styles.restaurantMarkerImage} />
            </Marker>
          ))}

          {userLocation && (
            <Marker coordinate={userLocation} title="Tú" pinColor="#00B894" />
          )}
        </MapView>
      </View>

      {/* FOOTER / CARD FLOTANTE */}
      <View style={[styles.bottom, { backgroundColor: theme.colors.header }]}>
        {selectedRestaurant && (
          <View
            style={[
              styles.previewContainer,
              { borderColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.previewCard,
                { backgroundColor: theme.colors.card },
              ]}
              onPress={() =>
                // ✅ 5. NAVEGACIÓN CORRECTA CON ID
                navigation.navigate("CategoryDetail", {
                  restaurantId: selectedRestaurant.id,
                })
              }
            >
              <View style={styles.previewLeft}>
                <View
                  style={[
                    styles.previewIconCircle,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Image source={forkPin} style={styles.previewIcon} />
                </View>
                <View>
                  <Text
                    style={[styles.previewName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {selectedRestaurant.name}
                  </Text>
                  <Text
                    style={[
                      styles.previewCategory,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedRestaurant.category}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.card }]}
          onPress={askLocation}
        >
          <Ionicons
            name="locate-outline"
            size={18}
            color={theme.colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            {loading ? "Obteniendo ubicación..." : "Usar mi ubicación"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  mapContainer: { flex: 1 },

  bottom: { paddingHorizontal: 16, paddingVertical: 10 },
  button: {
    borderRadius: 999,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { fontSize: 13, fontWeight: "600" },

  restaurantMarkerImage: { width: 34, height: 34, resizeMode: "contain" },

  previewContainer: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  previewCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  previewIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
    resizeMode: "contain",
  },
  previewName: { fontSize: 14, fontWeight: "700" },
  previewCategory: { fontSize: 12, marginTop: 2 },
});

export default CityMapScreen;
