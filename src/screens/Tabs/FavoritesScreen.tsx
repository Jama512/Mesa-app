// src/screens/Tabs/FavoritesScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { FONT_SIZES } from "../../../types";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useAuth } from "../auth/AuthContext";

type Nav = StackNavigationProp<RootStackParamList>;

interface Favorite {
  id: string;
  name: string;
  category: string;
  location: string;
  imageUri?: string;
  isOwnerRestaurant?: boolean;
}

const doodleBg = require("../../../assets/Background.png");

const MOCK_FAVORITES: Favorite[] = [
  {
    id: "1",
    name: "Pizzería Napoli",
    category: "Pizzerías",
    location: "Centro",
  },
  { id: "2", name: "La Postrería", category: "Postres", location: "Centro" },
];

const FavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { state } = useAuth();
  const navigation = useNavigation<Nav>();
  const isDark = theme.name === "dark";

  // ✅ Incluir "Tu restaurante" (si eres owner) sin duplicarlo
  const favorites = useMemo(() => {
    const list = [...MOCK_FAVORITES];

    if (state.role === "owner" && state.restaurant?.name) {
      const ownerName = state.restaurant.name.trim();

      const exists = list.some(
        (f) => f.name.trim().toLowerCase() === ownerName.toLowerCase()
      );

      if (!exists) {
        list.unshift({
          id: "owner-fav",
          name: ownerName,
          category: "Tu restaurante",
          location: state.restaurant.address?.split(",")?.[0]?.trim() || "—",
          imageUri: state.restaurant.images?.[0],
          isOwnerRestaurant: true,
        });
      }
    }

    return list;
  }, [state.role, state.restaurant]);

  const hasFavorites = favorites.length > 0;

  const openRestaurant = (name: string) => {
    navigation.navigate("CategoryDetail", { restaurantName: name });
  };

  return (
    <ImageBackground
      source={doodleBg}
      style={{ flex: 1 }}
      imageStyle={{ opacity: isDark ? 0.08 : 0.14 }}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
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
            Favoritos
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Guarda tus restaurantes para volver rápido
          </Text>
        </View>

        {/* CONTENIDO */}
        {hasFavorites ? (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openRestaurant(item.name)}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.left}>
                  {/* Miniatura */}
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View
                      style={[
                        styles.thumb,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Ionicons name="restaurant" size={18} color="#fff" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.itemName,
                          {
                            color: theme.colors.text,
                            fontSize: FONT_SIZES.medium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                      {item.isOwnerRestaurant && (
                        <View
                          style={[
                            styles.ownerPill,
                            { borderColor: theme.colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.ownerPillText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Tu restaurante
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.itemMeta,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: FONT_SIZES.small,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.category} • {item.location}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="heart-outline"
              size={28}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.textSecondary,
                  fontSize: FONT_SIZES.small,
                },
              ]}
            >
              Todavía no tienes restaurantes favoritos.
            </Text>

            <Text
              style={[styles.emptyHint, { color: theme.colors.textSecondary }]}
            >
              Desde un restaurante, toca el corazón para guardarlo aquí.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: "bold",
    fontSize: 20,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 24,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },

  thumb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  itemName: {
    fontWeight: "700",
    maxWidth: 190,
  },

  itemMeta: {
    marginTop: 2,
    opacity: 0.85,
  },

  ownerPill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ownerPillText: {
    fontSize: 10,
    fontWeight: "800",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    fontWeight: "600",
  },
  emptyHint: {
    textAlign: "center",
    fontSize: 11,
    opacity: 0.85,
  },
});

export default FavoritesScreen;
