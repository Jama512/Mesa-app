// src/screens/owner/OwnerProfile.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth, RestaurantFeatures } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type ProfileNav = StackNavigationProp<RootStackParamList, "OwnerProfile">;

const doodleBg = require("../../../assets/Background.png");
const logoMesa = require("../../../assets/LogoMesa.png");

const DEFAULT_FEATURES: RestaurantFeatures = {
  wifi: false,
  outdoorSeating: false,
  parking: false,
  reservations: false,
  delivery: false,
  cardPayment: false,
};

const OwnerProfile: React.FC = () => {
  const { theme } = useTheme();
  const { state, updateRestaurant } = useAuth();
  const navigation = useNavigation<ProfileNav>();
  const isDark = theme.name === "dark";

  const restaurant = state.restaurant;

  const [name, setName] = useState(restaurant?.name ?? "");
  const [address, setAddress] = useState(restaurant?.address ?? "");
  const [phone, setPhone] = useState(restaurant?.phone ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");

  const [features, setFeatures] = useState<RestaurantFeatures>({
    ...DEFAULT_FEATURES,
    ...(restaurant?.features ?? {}),
  });

  const [images, setImages] = useState<string[]>(restaurant?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const locationLabel = useMemo(() => {
    const lat = restaurant?.latitude;
    const lng = restaurant?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;
    }
    return "Ubicación no configurada";
  }, [restaurant?.latitude, restaurant?.longitude]);

  const toggleFeature = (key: keyof RestaurantFeatures) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenLocationPicker = () => {
    navigation.navigate("OwnerLocationPicker");
  };

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Necesitas permitir acceso a tu galería para subir fotos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;

        // evita duplicados
        const newImages = images.includes(uri) ? images : [...images, uri];
        setImages(newImages);
        updateRestaurant({ images: newImages });
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo seleccionar la imagen.");
    }
  };

  const handleRemoveImage = (uri: string) => {
    const newImages = images.filter((x) => x !== uri);
    setImages(newImages);
    updateRestaurant({ images: newImages });
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("El nombre del restaurante es obligatorio.");
      return;
    }

    setError(null);
    setSaving(true);

    updateRestaurant({
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      description: description.trim() || undefined,
      features,
      images,
    });

    // 🔜 Luego aquí conectas Realm (write)
    setTimeout(() => {
      setSaving(false);
      Alert.alert("Listo", "Perfil actualizado.");
      navigation.goBack();
    }, 350);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.background}
      />

      <ImageBackground
        source={doodleBg}
        style={styles.bg}
        imageStyle={{ opacity: isDark ? 0.06 : 0.12 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={theme.colors.text}
                />
              </TouchableOpacity>

              <Image
                source={logoMesa}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerTexts}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Mi perfil
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                Completa la información que verán los usuarios de MESA.
              </Text>
            </View>

            {/* CARD */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Nombre */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nombre del restaurante *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. Pizzería Luka"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
              />

              {/* Dirección */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Dirección
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Calle, número, colonia, ciudad"
                placeholderTextColor={theme.colors.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
              />

              {/* Teléfono */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Teléfono
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej. 351 000 0000"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
              />

              {/* Descripción */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descripción
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe comida, ambiente, etc."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
              />

              {/* Ubicación */}
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Ubicación en el mapa
              </Text>
              <View style={styles.locationRow}>
                <Text
                  style={[
                    styles.locationLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {locationLabel}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    { borderColor: theme.colors.primary },
                  ]}
                  onPress={handleOpenLocationPicker}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.locationButtonText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Elegir en mapa
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Servicios */}
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Servicios
              </Text>

              <View style={styles.featuresGrid}>
                {(
                  [
                    ["wifi", "Wifi gratis", "wifi-outline"],
                    ["outdoorSeating", "Aire libre", "sunny-outline"],
                    ["parking", "Estacionamiento", "car-outline"],
                    ["reservations", "Reservaciones", "calendar-outline"],
                    ["delivery", "Delivery", "bicycle-outline"],
                    ["cardPayment", "Tarjeta", "card-outline"],
                  ] as const
                ).map(([key, label, icon]) => {
                  const active = features[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.featureChip,
                        {
                          backgroundColor: active
                            ? theme.colors.primary
                            : theme.colors.background,
                          borderColor: active
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => toggleFeature(key)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={icon}
                        size={16}
                        color={active ? "#FFFFFF" : theme.colors.text}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: active ? "#FFFFFF" : theme.colors.text },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Fotos */}
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Fotos del restaurante
              </Text>

              <TouchableOpacity
                style={[
                  styles.addPhotoButton,
                  { borderColor: theme.colors.primary },
                ]}
                onPress={handlePickImage}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="image-outline"
                  size={18}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.addPhotoText, { color: theme.colors.primary }]}
                >
                  Subir imagen
                </Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <FlatList
                  data={images}
                  keyExtractor={(uri) => uri}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 12 }}
                  renderItem={({ item }) => (
                    <View style={styles.photoItem}>
                      <Image source={{ uri: item }} style={styles.photoThumb} />
                      <TouchableOpacity
                        style={[
                          styles.removePhotoBtn,
                          { backgroundColor: theme.colors.card },
                        ]}
                        onPress={() => handleRemoveImage(item)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="close"
                          size={14}
                          color={theme.colors.text}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: saving ? 0.75 : 1,
                  },
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.9}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  bg: { flex: 1 },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  backButton: { paddingRight: 8, paddingVertical: 4 },
  logo: { width: 92, height: 40, marginLeft: 4 },

  headerTexts: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },

  formCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },

  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 8,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  locationLabel: { fontSize: 12, flex: 1 },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  locationButtonText: { fontSize: 12, fontWeight: "800", marginLeft: 6 },

  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureText: { fontSize: 11, fontWeight: "700" },

  addPhotoButton: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  addPhotoText: { fontSize: 12, fontWeight: "800" },

  photoItem: { marginRight: 10 },
  photoThumb: { width: 86, height: 86, borderRadius: 14 },
  removePhotoBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
  },

  saveButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});

export default OwnerProfile;
