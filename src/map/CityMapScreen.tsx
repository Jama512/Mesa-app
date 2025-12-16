// src/map/CityMapScreen.tsx
import React, { useEffect, useState } from "react";
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
import MapView, { Marker, Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../theme/ThemeContext";
import { RESTAURANTS } from "../data/restaurants";

// navegación
import {
  useNavigation,
  CompositeNavigationProp,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootTabParamList } from "../navigation/TabNavigator";
import { RootStackParamList } from "../navigation/StackNavigator";

// tipos de navegación
type MapTabNav = BottomTabNavigationProp<RootTabParamList, "SearchTab">;
type RootNav = StackNavigationProp<RootStackParamList>;
type MapNavigationProp = CompositeNavigationProp<MapTabNav, RootNav>;

// tipo de restaurante según tu arreglo
type Restaurant = (typeof RESTAURANTS)[0];

// Centro inicial (si no hay ubicación aún)
const DEFAULT_CENTER = {
  latitude: 20.076186,
  longitude: -102.271682,
};

const USER_RADIUS_METERS = 2000;
const INITIAL_DELTA = 0.05;

// Estilos de mapa (por ahora solo apagamos POIs)
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

// Icono del restaurante
const forkPin = require("../../assets/fork-pin.png");

const CityMapScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<MapNavigationProp>();

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

  // restaurante seleccionado al tocar un pin
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

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
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    askLocation();
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
          Mapa / Exploración
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}
        >
          Restaurantes de MESA cerca de ti
        </Text>
      </View>

      {/* MAPA */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFill}
          region={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={isDark ? darkMapStyle : lightMapStyle}
          showsPointsOfInterest={false}
          // si tocas el mapa en blanco, se cierra la card
          onPress={() => setSelectedRestaurant(null)}
        >
          {/* Círculo alrededor del usuario */}
          <Circle
            center={circleCenter}
            radius={USER_RADIUS_METERS}
            strokeColor={theme.colors.primary}
            fillColor="rgba(255,140,0,0.15)"
          />

          {/* Restaurantes (SOLO pin) */}
          {RESTAURANTS.map((rest) => (
            <Marker
              key={rest.id}
              coordinate={{
                latitude: rest.latitude,
                longitude: rest.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedRestaurant(rest)}
            >
              <Image source={forkPin} style={styles.restaurantMarkerImage} />
            </Marker>
          ))}

          {/* Usuario */}
          {userLocation && (
            <Marker coordinate={userLocation} title="Tú" pinColor="#00B894" />
          )}
        </MapView>
      </View>

      {/* BOTÓN UBICACIÓN + CARD DEL RESTAURANTE */}
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
                navigation.navigate("CategoryDetail", {
                  restaurantName: selectedRestaurant.name,
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  mapContainer: { flex: 1 },

  bottom: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // PIN
  restaurantMarkerImage: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  // CARD flotante del restaurante
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
  previewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
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
  previewName: {
    fontSize: 14,
    fontWeight: "700",
  },
  previewCategory: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default CityMapScreen;
