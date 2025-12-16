import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "../auth/AuthContext";
import { Ionicons } from "@expo/vector-icons";

// Si quieres el pin de tenedor aquí también (opcional)
const forkPin = require("../../../assets/fork-pin.png");

// Centro fallback (Zamora)
const DEFAULT_REGION: Region = {
  latitude: 20.076186,
  longitude: -102.271682,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Ocultar POIs para que se vean “limpios” tus pines
const mapStyle = [
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

const OwnerLocationPicker: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const { state, updateRestaurant } = useAuth();

  const savedLat = state.restaurant?.latitude;
  const savedLng = state.restaurant?.longitude;

  const initialRegion = useMemo<Region>(() => {
    if (typeof savedLat === "number" && typeof savedLng === "number") {
      return {
        latitude: savedLat,
        longitude: savedLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    return DEFAULT_REGION;
  }, [savedLat, savedLng]);

  const [region, setRegion] = useState<Region>(initialRegion);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    typeof savedLat === "number" && typeof savedLng === "number"
      ? { latitude: savedLat, longitude: savedLng }
      : null
  );

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Al montar: si no hay coords guardadas, intenta ubicar al dueño
  useEffect(() => {
    if (selectedLocation) return;
    handleUseCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setSaved(false);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setSaved(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Activa la ubicación para seleccionar el pin de tu restaurante."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const r: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

      setRegion(r);
      setSelectedLocation({ latitude: r.latitude, longitude: r.longitude });
    } catch (err) {
      console.log("Error obteniendo ubicación actual:", err);
      Alert.alert(
        "Error",
        "No se pudo obtener tu ubicación. Intenta de nuevo."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCenterOnPin = () => {
    if (!selectedLocation) return;
    setRegion((prev) => ({
      ...prev,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    }));
  };

  const handleSave = async () => {
    if (!selectedLocation) return;

    try {
      setSaving(true);
      setSaved(false);

      // ✅ Guardar en AuthContext
      updateRestaurant({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      // 🔜 Luego aquí conectas Realm:
      // realm.write(() => { restaurant.latitude = ...; restaurant.longitude = ... })

      setSaved(true);
      Alert.alert("Listo", "Ubicación guardada correctamente.");
    } catch (err) {
      console.log("Error guardando ubicación:", err);
      Alert.alert("Error", "No se pudo guardar la ubicación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OwnerLayout
      title="Ubicación del restaurante"
      subtitle="Coloca el pin donde está tu negocio para que aparezca en el mapa de MESA."
      showBack
    >
      <View style={styles.container}>
        {/* MAPA */}
        <View style={[styles.mapWrap, { borderColor: theme.colors.border }]}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            customMapStyle={mapStyle}
            showsPointsOfInterest={false}
          >
            {selectedLocation && (
              <Marker coordinate={selectedLocation} title="Mi restaurante">
                {/* Si NO quieres icono custom, borra este children y deja Marker normal */}
                <Image source={forkPin} style={styles.pinImg} />
              </Marker>
            )}
          </MapView>

          {/* Botones flotantes */}
          <View style={styles.fabColumn}>
            <TouchableOpacity
              style={[
                styles.fab,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleUseCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.85}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name="locate-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fab,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  opacity: selectedLocation ? 1 : 0.45,
                },
              ]}
              onPress={handleCenterOnPin}
              disabled={!selectedLocation}
              activeOpacity={0.85}
            >
              <Ionicons
                name="navigate-outline"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTONES PRINCIPALES */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "transparent",
              },
            ]}
            onPress={handleUseCurrentLocation}
            disabled={loadingLocation}
            activeOpacity={0.85}
          >
            {loadingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.colors.primary },
                ]}
              >
                Usar mi ubicación
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: selectedLocation
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={handleSave}
            disabled={!selectedLocation || saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* INFO */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
            {selectedLocation
              ? "Ubicación seleccionada"
              : "Toca el mapa para elegir ubicación"}
          </Text>

          {selectedLocation && (
            <Text
              style={[styles.infoText, { color: theme.colors.textSecondary }]}
            >
              Lat: {selectedLocation.latitude.toFixed(5)} · Lng:{" "}
              {selectedLocation.longitude.toFixed(5)}
            </Text>
          )}

          <Text
            style={[styles.infoHint, { color: theme.colors.textSecondary }]}
          >
            Esta coordenada se usará para mostrar tu pin a los usuarios y
            calcular restaurantes cercanos.
          </Text>

          {saved && (
            <Text style={[styles.savedText, { color: theme.colors.primary }]}>
              ✓ Guardado correctamente
            </Text>
          )}
        </View>
      </View>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  mapWrap: {
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },

  pinImg: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  fabColumn: {
    position: "absolute",
    right: 10,
    top: 10,
    gap: 10,
  },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 12, fontWeight: "700" },

  primaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  infoCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoText: { fontSize: 12, marginBottom: 4 },
  infoHint: { fontSize: 11 },
  savedText: { marginTop: 6, fontSize: 12, fontWeight: "700" },
});

export default OwnerLocationPicker;
