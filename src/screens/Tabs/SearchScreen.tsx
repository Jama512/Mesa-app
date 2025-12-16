// src/screens/Tabs/SearchScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";

interface Restaurant {
  id: string;
  name: string;
  category: string;
  location: string;
}

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "Pizzería Napoli",
    category: "Pizzerías",
    location: "Centro",
  },
  { id: "2", name: "Taco Loco", category: "Mexicana", location: "Norte" },
  { id: "3", name: "Sushi Go", category: "Asiática", location: "Sur" },
  { id: "4", name: "La Postrería", category: "Postres", location: "Centro" },
];

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";

  const [query, setQuery] = useState("");

  const filtered = MOCK_RESTAURANTS.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.location.toLowerCase().includes(query.toLowerCase())
  );

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
          Buscar
        </Text>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
          placeholder="Buscar por nombre, categoría, ubicación..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* LISTA */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.itemName,
                { color: theme.colors.text, fontSize: FONT_SIZES.medium },
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.itemMeta,
                {
                  color: theme.colors.textSecondary,
                  fontSize: FONT_SIZES.small,
                },
              ]}
            >
              {item.category} • {item.location}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: FONT_SIZES.small,
                },
              ]}
            >
              No se encontraron resultados.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  item: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  itemName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  itemMeta: {
    opacity: 0.8,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontStyle: "italic",
  },
});

export default SearchScreen;
