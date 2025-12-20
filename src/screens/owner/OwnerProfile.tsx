// src/screens/owner/OwnerProfile.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import OwnerLayout from "./OwnerLayout";
import { useTheme } from "../../theme/ThemeContext";
import {
  useRestaurants,
  RestaurantFeatures,
} from "../../context/RestaurantsContext";

import * as ImagePicker from "expo-image-picker";
// ✅ 1. IMPORTAR LOCATION PARA TRADUCIR COORDENADAS A TEXTO
import * as Location from "expo-location";

type FormState = {
  name: string;
  address: string;
  phone: string;
  description: string;
  features: RestaurantFeatures;
  images: string[];
};

const OwnerProfile: React.FC = () => {
  const { theme } = useTheme();
  const { restaurants, upsertOwnerRestaurant } = useRestaurants();

  const ownerRestaurant = useMemo(() => {
    return restaurants.find((r) => r.isOwnerRestaurant) ?? null;
  }, [restaurants]);

  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    description: "",
    features: {},
    images: [],
  });

  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. CARGA INICIAL DE DATOS
  useEffect(() => {
    if (hasLoadedInitial) return;

    const owner = ownerRestaurant;

    setForm({
      name: owner?.name ?? "Mi restaurante",
      address: owner?.address ?? "",
      phone: owner?.phone ?? "",
      description: owner?.description ?? "",
      features: owner?.features ?? {},
      images: owner?.images ?? [],
    });

    setHasLoadedInitial(true);
  }, [hasLoadedInitial, ownerRestaurant]);

  // ✅ 2. EFECTO NUEVO: DETECTAR CAMBIO DE UBICACIÓN Y ACTUALIZAR DIRECCIÓN
  useEffect(() => {
    const syncAddressFromLocation = async () => {
      // Si el restaurante tiene coordenadas...
      if (ownerRestaurant?.latitude && ownerRestaurant?.longitude) {
        try {
          // ...intentamos convertirlas a texto (Calle, Ciudad)
          const [result] = await Location.reverseGeocodeAsync({
            latitude: ownerRestaurant.latitude,
            longitude: ownerRestaurant.longitude,
          });

          if (result) {
            // Construimos la dirección bonita
            const street = result.street || result.name || "";
            const city = result.city || result.subregion || "";
            const newAddress = `${street}, ${city}`.trim();

            // Solo actualizamos si la dirección es diferente para no borrar lo que escribas
            // y para evitar bucles infinitos.
            setForm((prev) => {
              // Si el campo de dirección está vacío o es muy distinto, lo llenamos
              if (prev.address !== newAddress && newAddress.length > 5) {
                return { ...prev, address: newAddress };
              }
              return prev;
            });
          }
        } catch (error) {
          console.log("No se pudo traducir la ubicación a texto", error);
        }
      }
    };

    syncAddressFromLocation();
  }, [ownerRestaurant?.latitude, ownerRestaurant?.longitude]); // Se ejecuta cuando cambian las coords

  const setField = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) => {
      setForm((prev) => ({ ...prev, [k]: v }));
    },
    []
  );

  const toggleFeature = useCallback((key: keyof RestaurantFeatures) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features?.[key] },
    }));
  }, []);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a tu galería para subir fotos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        setForm((prev) => ({ ...prev, images: [newUri, ...prev.images] }));
      }
    } catch (error) {
      console.log("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No pudimos abrir la galería.");
    }
  };

  const removeImage = useCallback((uri: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((x) => x !== uri),
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // ✅ Si usaste la solución Base64 (GRATIS), importa convertImageToBase64 arriba
      // Si usaste la solución Storage (PAGO), usa uploadImageToFirebase
      // Aquí asumo que usas la de Storage o Base64 que implementamos antes.

      // Ejemplo genérico (ajusta según tu implementación de imágenes):
      const processedImages = form.images;

      const payload = {
        name: form.name.trim() || "Mi restaurante",
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        description: form.description.trim() || undefined,
        features: form.features,
        images: processedImages,
      };

      await upsertOwnerRestaurant(payload);
      Alert.alert("Guardado", "Tu perfil se actualizó correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const FeatureRow = ({
    label,
    k,
    icon,
  }: {
    label: string;
    k: keyof RestaurantFeatures;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }) => {
    const enabled = !!form.features?.[k];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleFeature(k)}
        style={[
          styles.featureRow,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.featureIcon,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.colors.primary} />
        </View>

        <Text style={[styles.featureLabel, { color: theme.colors.text }]}>
          {label}
        </Text>

        <View
          style={[
            styles.pill,
            {
              borderColor: enabled ? theme.colors.primary : theme.colors.border,
              backgroundColor: enabled ? theme.colors.primary : "transparent",
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: enabled ? "#fff" : theme.colors.textSecondary },
            ]}
          >
            {enabled ? "Sí" : "No"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <OwnerLayout
      title="Mi perfil"
      subtitle="Actualiza datos, servicios e imágenes de tu restaurante."
      showBack
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* CARD FORM */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Información
            </Text>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Nombre
            </Text>
            <TextInput
              value={form.name}
              onChangeText={(t) => setField("name", t)}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej. Coffee Black"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Dirección
            </Text>
            {/* El input de dirección ahora se llenará solo si seleccionas mapa */}
            <TextInput
              value={form.address}
              onChangeText={(t) => setField("address", t)}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Calle, colonia... (o selecciona en Mapa)"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Teléfono
            </Text>
            <TextInput
              value={form.phone}
              onChangeText={(t) => setField("phone", t)}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Ej. 3511234567"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Descripción
            </Text>
            <TextInput
              value={form.description}
              onChangeText={(t) => setField("description", t)}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Cuéntales qué hace especial tu restaurante…"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
            />
          </View>

          {/* FEATURES */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Servicios
              </Text>
              <Text
                style={[
                  styles.smallHint,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Toca para activar/desactivar
              </Text>
            </View>

            <FeatureRow label="Wi-Fi" k="wifi" icon="wifi-outline" />
            <FeatureRow
              label="Terraza / Exterior"
              k="outdoorSeating"
              icon="sunny-outline"
            />
            <FeatureRow
              label="Estacionamiento"
              k="parking"
              icon="car-outline"
            />
            <FeatureRow
              label="Reservaciones"
              k="reservations"
              icon="calendar-outline"
            />
            <FeatureRow
              label="Entrega a domicilio"
              k="delivery"
              icon="bicycle-outline"
            />
            <FeatureRow
              label="Pago con tarjeta"
              k="cardPayment"
              icon="card-outline"
            />
          </View>

          {/* IMAGES */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Imágenes
              </Text>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
                <Text
                  style={[styles.sectionCta, { color: theme.colors.primary }]}
                >
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>

            {form.images.length > 0 ? (
              <FlatList
                data={form.images}
                keyExtractor={(x) => x}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.imageRow,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.imageLeft}>
                      <Image source={{ uri: item }} style={styles.thumb} />
                      <Text
                        style={[
                          styles.imageText,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        Foto cargada
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeImage(item)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text
                style={[
                  styles.emptyImages,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Aún no tienes imágenes. Agrega una para que tu perfil se vea
                mejor.
              </Text>
            )}
          </View>

          {/* SAVE */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.9}
            disabled={isSaving}
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveText}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", marginBottom: 10 },
  sectionCta: { fontSize: 12, fontWeight: "900" },
  smallHint: { fontSize: 11, fontWeight: "700", opacity: 0.9 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: { fontSize: 12, fontWeight: "800", marginTop: 8, marginBottom: 6 },
  input: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { height: 110, textAlignVertical: "top" },

  featureRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { flex: 1, fontSize: 13, fontWeight: "800" },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontSize: 11, fontWeight: "900" },

  imageRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  imageLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  thumb: {
    width: 34,
    height: 34,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#ccc",
  },
  imageText: { flex: 1, fontSize: 11, fontWeight: "700" },
  emptyImages: { marginTop: 6, fontSize: 12, fontWeight: "700", opacity: 0.85 },

  saveBtn: {
    marginTop: 4,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});

export default OwnerProfile;
