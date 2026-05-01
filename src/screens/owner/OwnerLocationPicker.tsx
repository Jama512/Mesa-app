// src/screens/owner/OwnerLocationPicker.tsx
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

// --- MAPAS GRATUITOS (Open Source Strategy) ---
// Importo UrlTile para poder dibujar capas de mapas personalizados (OSM).
// NO importo 'PROVIDER_GOOGLE' para evitar la dependencia de Play Services y costos.
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  UrlTile,
} from "react-native-maps";
import * as Location from "expo-location";
import { useAuth } from "../auth/AuthContext";
import { useRestaurants } from "../../context/RestaurantsContext";
import { Ionicons } from "@expo/vector-icons";

const forkPin = require("../../../assets/fork-pin.png");

// Centro por defecto (Zamora, Michoacán) para evitar que el mapa cargue en medio del océano
const DEFAULT_REGION: Region = {
  latitude: 20.076186,
  longitude: -102.271682,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const OwnerLocationPicker: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  // Consumo los contextos para leer la ubicación actual y guardar la nueva
  const { state, updateRestaurant } = useAuth();
  const { upsertOwnerRestaurant } = useRestaurants();

  // Recupero coordenadas guardadas (si existen) para centrar el mapa al abrir
  const savedLat = (state.restaurant as any)?.latitude;
  const savedLng = (state.restaurant as any)?.longitude;

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

  // Al montar el componente, si no hay ubicación previa, intento buscar la del GPS
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

  // --- GEOLOCALIZACIÓN (GPS) ---
  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      setSaved(false);

      // 1. Solicitar permisos al sistema operativo (Android/iOS)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Activa la ubicación para seleccionar el pin de tu restaurante."
        );
        return;
      }

      // 2. Obtener coordenadas precisas
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

  // --- PERSISTENCIA DE DATOS ---
  const handleSave = async () => {
    if (!selectedLocation) return;

    try {
      setSaving(true);
      setSaved(false);

      const newCoords = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      };

      // Guardo en dos lugares:
      // 1. Contexto Auth (Memoria): Para que la UI se actualice rápido
      // 2. Firestore (Nube): Para que el dato persista
      updateRestaurant(newCoords as any);
      await upsertOwnerRestaurant(newCoords);

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
        <View style={[styles.mapWrap, { borderColor: theme.colors.border }]}>
          {/* --- IMPLEMENTACIÓN DE MAPA HÍBRIDO --- */}
          <MapView
            style={StyleSheet.absoluteFill}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsPointsOfInterest={false}
            // ⚠️ TRUCO CLAVE: 'mapType="none"' desactiva el mapa base de Google
            // Esto evita errores de API Key y pantalla gris.
            mapType="none"
          >
            {/* INYECCIÓN DE CAPAS (Tiles) */}
            {/* Uso CartoDB (basado en OpenStreetMap) para renderizar el mapa */}
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />

            {selectedLocation && (
              <Marker coordinate={selectedLocation} title="Mi restaurante">
                <Image source={forkPin} style={styles.pinImg} />
              </Marker>
            )}
          </MapView>

          {/* Controles Flotantes (FABs) */}
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

        {/* ... (Botones de acción guardar/cancelar) ... */}
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

        {/* INFO CARD: Feedback visual de coordenadas */}
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
            Esta coordenada se usará para mostrar tu pin a los usuarios.
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
  pinImg: { width: 34, height: 34, resizeMode: "contain" },
  fabColumn: { position: "absolute", right: 10, top: 10, gap: 10 },
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
