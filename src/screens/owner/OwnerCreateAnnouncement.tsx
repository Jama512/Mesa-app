// src/screens/owner/OwnerCreateAnnouncement.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";

const OwnerCreateAnnouncement: React.FC = () => {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handlePublish = () => {
    if (!title.trim()) {
      Alert.alert("Falta título", "Ingresa el título del evento o promo.");
      return;
    }
    // aquí luego se conecta a Realm/BD
    Alert.alert("Publicado", "El anuncio se ha registrado (dummy).");
    setTitle("");
    setDescription("");
  };

  return (
    <OwnerLayout
      title="Publicar anuncio"
      subtitle="Crea un evento o promoción para que aparezca en MESA."
      showBack
    >
      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Título del evento/promo
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
            },
          ]}
          placeholder="Ej. Noche de Karaoke"
          placeholderTextColor={theme.colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>
          Descripción
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
            },
          ]}
          placeholder="Detalles, condiciones, horario, etc."
          placeholderTextColor={theme.colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handlePublish}
        >
          <Text style={styles.primaryText}>Publicar</Text>
        </TouchableOpacity>
      </View>
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default OwnerCreateAnnouncement;
