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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/StackNavigator";

// ✅ IMPORTAR REALM Y EL MODELO (Clase)
import Realm from "realm";
import { useRealm } from "../../database/realm";
import { Dish } from "../../database/models/DishModel";

type Nav = StackNavigationProp<RootStackParamList, "OwnerAddDish">;
type Rt = RouteProp<RootStackParamList, "OwnerAddDish">;

const MAX_NAME = 50;
const MAX_DESC = 140;

const OWNER_ID = "owner-restaurant";

const sanitizePrice = (t: string) => {
  const x = t.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = x.split(".");
  if (parts.length <= 2) return x;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const OwnerAddDish: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();

  const realm = useRealm();

  const mode = route.params?.mode ?? "create";
  const editingDish = route.params?.dish;

  // Estados iniciales
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

  const cleanName = useMemo(() => name.trim().replace(/\s{2,}/g, " "), [name]);

  const priceNumber = useMemo(() => {
    const v = Number(sanitizePrice(priceText));
    return Number.isFinite(v) ? v : NaN;
  }, [priceText]);

  const cleanDesc = useMemo(
    () => description.trim().replace(/\s{2,}/g, " "),
    [description]
  );

  const nameOk = cleanName.length > 0;
  const priceOk = Number.isFinite(priceNumber) && priceNumber > 0;
  const canSave = nameOk && priceOk;

  const titleText = mode === "edit" ? "Editar platillo" : "Agregar platillo";
  const subtitleText =
    mode === "edit"
      ? "Actualiza nombre, precio y disponibilidad."
      : "Crea un nuevo platillo para tu menú.";

  const onSave = () => {
    if (!canSave) {
      Alert.alert(
        "Datos incompletos",
        !nameOk
          ? "Escribe el nombre del platillo."
          : "Escribe un precio válido (mayor a 0)."
      );
      return;
    }

    try {
      const idToSave = editingDish?.id ?? String(Date.now());

      realm.write(() => {
        // ✅ USAMOS LA CLASE 'Dish' DIRECTAMENTE PARA MAYOR SEGURIDAD
        realm.create(
          Dish,
          {
            _id: idToSave,
            restaurantId: OWNER_ID,
            name: cleanName,
            price: Number(priceNumber),
            description: cleanDesc || undefined,
            isAvailable: isAvailable,
            // Solo asignamos fecha si es nuevo para no sobrescribir
            ...(mode === "create" && { createdAt: new Date() }),
          },
          Realm.UpdateMode.Modified
        );
      });

      Alert.alert(
        mode === "edit" ? "Actualizado" : "Agregado",
        "Tu menú se ha actualizado en la base de datos.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error guardando en Realm:", error);
      Alert.alert("Error", "No se pudo guardar el platillo.");
    }
  };

  return (
    <OwnerLayout title={titleText} subtitle={subtitleText} showBack>
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
            {/* Badge modo */}
            <View style={styles.modeRow}>
              <View
                style={[
                  styles.modePill,
                  {
                    backgroundColor:
                      mode === "edit"
                        ? "rgba(59,130,246,0.12)"
                        : "rgba(34,197,94,0.12)",
                    borderColor:
                      mode === "edit"
                        ? "rgba(59,130,246,0.35)"
                        : "rgba(34,197,94,0.35)",
                  },
                ]}
              >
                <Ionicons
                  name={
                    mode === "edit" ? "create-outline" : "add-circle-outline"
                  }
                  size={14}
                  color={mode === "edit" ? "#3b82f6" : "#16a34a"}
                />
                <Text
                  style={[
                    styles.modeText,
                    { color: mode === "edit" ? "#3b82f6" : "#16a34a" },
                  ]}
                >
                  {mode === "edit" ? "Editando" : "Nuevo"}
                </Text>
              </View>

              <Text
                style={[
                  styles.helperTop,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {mode === "edit"
                  ? "Cambios se aplican al guardar."
                  : "Se agregará al inicio del menú."}
              </Text>
            </View>

            {/* Nombre */}
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
            {!nameOk ? (
              <Text style={[styles.error, { color: "#ef4444" }]}>
                El nombre es obligatorio.
              </Text>
            ) : null}

            {/* Precio */}
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
            {!priceOk && priceText.length > 0 ? (
              <Text style={[styles.error, { color: "#ef4444" }]}>
                Escribe un precio válido (mayor a 0).
              </Text>
            ) : null}

            {/* Descripción */}
            <View style={[styles.labelRow, { marginTop: 12 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descripción (opcional)
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
                placeholder="Ingredientes o nota breve"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.textArea, { color: theme.colors.text }]}
                multiline
                maxLength={MAX_DESC}
              />
            </View>

            {/* Disponible */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Disponible
                </Text>
                <Text
                  style={[styles.hint, { color: theme.colors.textSecondary }]}
                >
                  {isAvailable
                    ? "Se mostrará como disponible"
                    : "Se mostrará como no disponible"}
                </Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} />
            </View>

            {/* Guardar */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: canSave
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={onSave}
              activeOpacity={0.9}
              disabled={!canSave}
            >
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveText}>
                {mode === "edit" ? "Guardar cambios" : "Agregar platillo"}
              </Text>
            </TouchableOpacity>

            {/* Cancelar */}
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

  modeRow: {
    marginBottom: 12,
    gap: 8,
  },
  modePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modeText: { fontSize: 12, fontWeight: "900" },
  helperTop: { fontSize: 11, fontWeight: "600", opacity: 0.9 },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "900" },
  counter: { fontSize: 11, fontWeight: "800", opacity: 0.9 },

  hint: { marginTop: 2, fontSize: 11, fontWeight: "600", opacity: 0.9 },
  error: { marginTop: 6, fontSize: 11, fontWeight: "800" },

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
