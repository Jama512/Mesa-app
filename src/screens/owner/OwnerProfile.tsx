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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import OwnerLayout from "./OwnerLayout";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import {
  useRestaurants,
  RestaurantFeatures,
} from "../../context/RestaurantsContext";

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
  const { state, updateRestaurant } = useAuth();
  const { restaurants, upsertOwnerRestaurant } = useRestaurants();

  const ownerRestaurant = useMemo(() => {
    return restaurants.find((r) => r.isOwnerRestaurant) ?? null;
  }, [restaurants]);

  // ✅ Form local (NO actualizar context en render)
  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    description: "",
    features: {},
    images: [],
  });

  // ✅ evita re-inicializar el form en cada render
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Inicializa form UNA VEZ cuando ya tengas data
  useEffect(() => {
    if (hasLoadedInitial) return;

    const base = state.restaurant;
    const owner = ownerRestaurant;

    setForm({
      name: base?.name ?? owner?.name ?? "Mi restaurante",
      address: base?.address ?? owner?.address ?? "",
      phone: base?.phone ?? owner?.phone ?? "",
      description: base?.description ?? owner?.description ?? "",
      features: base?.features ?? owner?.features ?? {},
      images: base?.images ?? owner?.images ?? [],
    });

    setHasLoadedInitial(true);
  }, [hasLoadedInitial, state.restaurant, ownerRestaurant]);

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

  // ✅ Dummy: agrega “imagen” (luego conectas ImagePicker + Firebase Storage)
  const addDummyImage = useCallback(() => {
    const uri = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setForm((prev) => ({ ...prev, images: [uri, ...prev.images] }));
  }, []);

  const removeImage = useCallback((uri: string) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((x) => x !== uri),
    }));
  }, []);

  const handleSave = async () => {
    const payload = {
      name: form.name.trim() || "Mi restaurante",
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      description: form.description.trim() || undefined,
      features: form.features,
      images: form.images,
    };

    setIsSaving(true);
    try {
      // ✅ 1) AuthContext (dueño)
      updateRestaurant(payload);

      upsertOwnerRestaurant(payload);

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
              placeholder="Calle, colonia..."
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
              <TouchableOpacity onPress={addDummyImage} activeOpacity={0.85}>
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
                      <View
                        style={[
                          styles.thumb,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Ionicons name="image-outline" size={18} color="#fff" />
                      </View>
                      <Text
                        style={[
                          styles.imageText,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item}
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
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
