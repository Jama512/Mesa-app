// src/screens/Tabs/SearchScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRestaurants } from "../../context/RestaurantsContext"; // ✅ Usar contexto
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

type SearchNav = StackNavigationProp<RootStackParamList>;

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<SearchNav>();

  // ✅ Traemos los datos reales
  const { restaurants } = useRestaurants();

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return restaurants.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchCat;
    });
  }, [query, restaurants]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={theme.name === "dark" ? "light-content" : "dark-content"}
      />

      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Explorar
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Buscar restaurante o categoría..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.colors.card }]}
            onPress={() =>
              navigation.navigate("CategoryDetail", { restaurantId: item.id })
            }
          >
            <View style={styles.row}>
              {/* Si tienes imágenes, muestra la primera, si no un icono placeholder */}
              <View
                style={[styles.thumb, { backgroundColor: theme.colors.border }]}
              >
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={{ width: 40, height: 40 }}
                  />
                ) : (
                  <Text style={{ fontSize: 18 }}>🍽️</Text>
                )}
              </View>
              <View>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemCat,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.category} • {item.address || "Ver mapa"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            >
              {query.length > 0
                ? "No se encontraron resultados."
                : "Escribe para buscar..."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: "bold", fontSize: 20 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  item: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  itemName: { fontWeight: "700", fontSize: 15 },
  itemCat: { fontSize: 12, marginTop: 2 },
  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyText: { fontSize: 14 },
});

export default SearchScreen;
