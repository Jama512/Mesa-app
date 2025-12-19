// src/screens/owner/OwnerCreateAnnouncement.tsx
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

import Realm from "realm";
import { useRealm } from "../../database/realm";
import { Event } from "../../database/models/EventModel";

type Nav = StackNavigationProp<RootStackParamList, "OwnerCreateAnnouncement">;

const OWNER_RESTAURANT_ID = "owner-restaurant";

const MAX_TITLE = 60;
const MAX_WHEN = 40;
const MAX_DESC = 220;

const OwnerCreateAnnouncement: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const realm = useRealm();

  const [title, setTitle] = useState("");
  const [whenLabel, setWhenLabel] = useState("");
  const [description, setDescription] = useState("");

  const cleanTitle = useMemo(() => title.trim(), [title]);
  const cleanWhen = useMemo(() => whenLabel.trim(), [whenLabel]);
  const cleanDesc = useMemo(() => description.trim(), [description]);

  const canPublish = cleanTitle.length > 0;

  const handlePublish = () => {
    if (!canPublish) {
      Alert.alert("Falta título", "Ingresa el título del evento o promo.");
      return;
    }

    realm.write(() => {
      realm.create(Event, {
        _id: new Realm.BSON.ObjectId(),
        restaurantId: OWNER_RESTAURANT_ID,
        title: cleanTitle,
        dateLabel: cleanWhen || "Próximamente",
        description: cleanDesc || undefined,
        createdAt: new Date(),
      });
    });

    setTitle("");
    setWhenLabel("");
    setDescription("");

    Alert.alert("Publicado", "Tu anuncio ya aparece en el Calendario.", [
      {
        text: "Ver calendario",
        onPress: () => navigation.navigate("Home", { screen: "CalendarTab" }),
      },
      { text: "OK", style: "cancel", onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <OwnerLayout
      title="Publicar anuncio"
      subtitle="Crea un evento o promoción para que aparezca en MESA."
      showBack
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
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Título */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Título del evento/promo
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {title.length}/{MAX_TITLE}
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
                name="megaphone-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej. Noche de Karaoke"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={(t) => setTitle(t.replace(/\s{2,}/g, " "))}
                maxLength={MAX_TITLE}
                returnKeyType="next"
              />
            </View>

            {/* Cuándo */}
            <View style={[styles.labelRow, { marginTop: 10 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                ¿Cuándo?
              </Text>
              <Text
                style={[styles.counter, { color: theme.colors.textSecondary }]}
              >
                {whenLabel.length}/{MAX_WHEN}
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
                name="time-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Ej. Hoy · 9:00 PM / Todos los martes"
                placeholderTextColor={theme.colors.textSecondary}
                value={whenLabel}
                onChangeText={(t) => setWhenLabel(t.replace(/\s{2,}/g, " "))}
                maxLength={MAX_WHEN}
                returnKeyType="next"
              />
            </View>

            {/* Descripción */}
            <View style={[styles.labelRow, { marginTop: 10 }]}>
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
                style={[styles.textArea, { color: theme.colors.text }]}
                placeholder="Detalles, condiciones, horario, etc."
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={MAX_DESC}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: canPublish
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              onPress={handlePublish}
              activeOpacity={0.9}
              disabled={!canPublish}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.primaryText}>Publicar anuncio</Text>
            </TouchableOpacity>

            <Text
              style={[styles.helper, { color: theme.colors.textSecondary }]}
            >
              Tip: Si aún no tienes hora exacta, deja “¿Cuándo?” vacío y se
              pondrá “Próximamente”.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 18 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
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
    height: 120,
    fontSize: 13,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  helper: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.9,
    textAlign: "center",
  },
});

export default OwnerCreateAnnouncement;
