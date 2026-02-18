// src/screens/owner/OwnerAddDish.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";
import * as ImagePicker from "expo-image-picker";

// Consumo del Contexto Global para operaciones CRUD
import { useRestaurants, Dish } from "../../context/RestaurantsContext";

type Nav = StackNavigationProp<RootStackParamList, "OwnerAddDish">;
type Rt = RouteProp<RootStackParamList, "OwnerAddDish">;

const MAX_NAME = 50;
const MAX_DESC = 140;

// --- UTILERÍA DE LIMPIEZA ---
// Asegura que el precio sea un número válido.
// Reemplaza comas por puntos y elimina cualquier caracter no numérico.
const sanitizePrice = (t: string) => {
  const x = t.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = x.split(".");
  // Evita múltiples puntos decimales (ej: 10.5.5)
  if (parts.length <= 2) return x;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const OwnerAddDish: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  // Funciones para escribir en la base de datos
  const { restaurants, upsertOwnerRestaurant, addDish } = useRestaurants();
  const ownerRestaurant = restaurants.find((r) => r.isOwnerRestaurant);

  // Detecto si estoy en modo "Crear" o "Editar"
  const mode = route.params?.mode ?? "create";
  const editingDish = route.params?.dish;

  // Estados locales del formulario
  const [name, setName] = useState(editingDish?.name ?? "");
  const [priceText, setPriceText] = useState(
    editingDish ? String(editingDish.price) : ""
  );
  const [description, setDescription] = useState(
    editingDish?.description ?? ""
  );
  const [isAvailable, setIsAvailable] = useState(
    editingDish?.isAvailable ?? true
  );
  const [imageUri, setImageUri] = useState<string | null>(
    (editingDish as any)?.image ?? null
  );
  const [isSaving, setIsSaving] = useState(false);

  // --- VALIDACIÓN EN TIEMPO REAL ---
  // Uso useMemo para recalcular la validez solo cuando cambian los inputs.
  const cleanName = useMemo(() => name.trim().replace(/\s{2,}/g, " "), [name]);

  const priceNumber = useMemo(() => {
    const v = Number(sanitizePrice(priceText));
    return Number.isFinite(v) ? v : NaN;
  }, [priceText]);

  const cleanDesc = useMemo(
    () => description.trim().replace(/\s{2,}/g, " "),
    [description]
  );

  // Banderas de validación
  const nameOk = cleanName.length > 0;
  const priceOk = Number.isFinite(priceNumber) && priceNumber > 0;
  const canSave = nameOk && priceOk;

  const titleText = mode === "edit" ? "Editar platillo" : "Agregar platillo";
  const subtitleText =
    mode === "edit"
      ? "Actualiza nombre, precio y foto."
      : "Crea un nuevo platillo para tu menú.";

  // --- MANEJO DE IMÁGENES ---
  const pickImage = async () => {
    try {
      // Lanzo la galería nativa del sistema
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite recortar la imagen a 4:3
        aspect: [4, 3],
        quality: 0.7, // Comprimo la calidad para no saturar la BD
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Error", "No pudimos abrir la galería.");
    }
  };

  const onSave = async () => {
    // 1. Última validación antes de enviar
    if (!canSave) {
      Alert.alert(
        "Datos incompletos",
        !nameOk
          ? "Escribe el nombre del platillo."
          : "Escribe un precio válido (mayor a 0)."
      );
      return;
    }

    setIsSaving(true);
    try {
      // --- CONSTRUCCIÓN SEGURA DEL OBJETO (Defensive Programming) ---
      // Aquí aplico la lógica para evitar campos 'undefined' antes de enviarlos a Firestore.
      // Firestore lanza error si un campo no está definido.
      const dishData: Dish = {
        id: editingDish?.id ?? String(Date.now()), // Genero ID si es nuevo
        name: cleanName,
        price: Number(priceNumber),
        isAvailable: isAvailable,
        // Spread condicional: Solo agrego la propiedad si tiene valor real.
        ...(cleanDesc ? { description: cleanDesc } : {}),
        ...(imageUri ? { image: imageUri } : {}),
      };

      if (mode === "create") {
        if (addDish) {
          // Uso la función optimizada del Contexto
          await addDish(dishData);
        } else {
          // Fallback: Si no existe addDish, actualizo el array completo (método antiguo)
          const currentMenu = ownerRestaurant?.menu || [];
          const newMenu = [...currentMenu, dishData];
          await upsertOwnerRestaurant({ menu: newMenu });
        }
      } else {
        // Modo Edición: Mapeo el array y reemplazo solo el ítem modificado
        const currentMenu = ownerRestaurant?.menu || [];
        const newMenu = currentMenu.map((d) =>
          d.id === dishData.id ? dishData : d
        );
        await upsertOwnerRestaurant({ menu: newMenu });
      }

      Alert.alert(
        mode === "edit" ? "Actualizado" : "Agregado",
        "Menú actualizado.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error guardando:", error);
      Alert.alert("Error", "No se pudo guardar el platillo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerLayout title={titleText} subtitle={subtitleText} showBack>
      {/* KeyboardAvoidingView: Evita que el teclado tape el botón de guardar */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Sección de Imagen */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.imagePlaceholder,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.imageText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Agregar foto
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={styles.removeImageBtn}
                >
                  <Text style={styles.removeImageText}>Eliminar foto</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Inputs del Formulario */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nombre
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {name.length}/{MAX_NAME}
              </Text>
            </View>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="restaurant-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={name}
                onChangeText={(t) => setName(t)}
                placeholder="Ej. Pizza Pepperoni"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                maxLength={MAX_NAME}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Precio
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                MXN
              </Text>
            </View>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={priceText}
                onChangeText={(t) => setPriceText(sanitizePrice(t))}
                placeholder="Ej. 149"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, { color: theme.colors.text }]}
                keyboardType="decimal-pad"
                maxLength={10}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descripción
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {description.length}/{MAX_DESC}
              </Text>
            </View>
            <View
              style={[
                styles.textAreaWrap,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ingredientes..."
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.textArea, { color: theme.colors.text }]}
                multiline
                maxLength={MAX_DESC}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Disponible
                </Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>

            {/* Botones de Acción */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  // Feedback visual: Si no se puede guardar, el botón se ve gris
                  backgroundColor: canSave
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={onSave}
              activeOpacity={0.9}
              disabled={!canSave || isSaving}
            >
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveText}>
                {isSaving
                  ? "Guardando..."
                  : mode === "edit"
                  ? "Guardar cambios"
                  : "Agregar platillo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.9}
            >
              <Text
                style={[styles.secondaryText, { color: theme.colors.text }]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: 18 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: "cover",
  },
  imageText: { fontSize: 12, fontWeight: "600" },
  removeImageBtn: { marginTop: 8 },
  removeImageText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "900" },
  counter: { fontSize: 11, fontWeight: "800", opacity: 0.9 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 14, fontWeight: "700" },
  textAreaWrap: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    height: 90,
    fontSize: 13,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  switchRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontWeight: "900", fontSize: 13 },
});

export default OwnerAddDish;
