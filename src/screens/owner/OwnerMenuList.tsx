// src/screens/owner/OwnerMenuList.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useRestaurants } from "../../context/RestaurantsContext";

// ✅ 1. IMPORTAR REALM Y EL MODELO
import { useQuery, useRealm } from "../../database/realm";
import { Dish } from "../../database/models/DishModel";

type FilterKey = "all" | "available" | "unavailable";
type Nav = StackNavigationProp<RootStackParamList, "OwnerMenuList">;

const OWNER_ID = "owner-restaurant"; // Mismo ID que usamos en OwnerAddDish

const OwnerMenuList: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.name === "dark";
  const navigation = useNavigation<Nav>();

  // ✅ 2. HOOKS DE REALM
  const realm = useRealm();
  // Traemos los platos del dueño, ordenados por fecha de creación (si existe) o nombre
  const dishes = useQuery(Dish)
    .filtered("restaurantId == $0", OWNER_ID)
    .sorted("createdAt", true); // true = descendente (nuevos arriba)

  // Contexto para el estado del restaurante (Abierto/Cerrado)
  const { restaurants, upsertOwnerRestaurant } = useRestaurants();

  const ownerRestaurant = useMemo(
    () => restaurants.find((r) => r.isOwnerRestaurant) ?? null,
    [restaurants]
  );

  const ownerStatus = ownerRestaurant?.status ?? "Abierto ahora";
  const isOpen = /abierto/i.test(ownerStatus);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // ✅ 3. LÓGICA DE FILTRADO (Sobre los datos de Realm)
  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Convertimos Realm Results a Array para filtrar en memoria (rápido para listas pequeñas/medianas)
    return dishes.filter((d) => {
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q);

      const matchFilter =
        filter === "all"
          ? true
          : filter === "available"
          ? d.isAvailable
          : !d.isAvailable;

      return matchQuery && matchFilter;
    });
  }, [dishes, query, filter]);

  const totalCount = dishes.length;
  const availableCount = dishes.filter((d) => d.isAvailable).length;

  const headerSubtitle = useMemo(() => {
    if (totalCount === 0) return "Aún no tienes platillos registrados.";
    return `Tienes ${totalCount} platillo${
      totalCount === 1 ? "" : "s"
    } (${availableCount} disponible${availableCount === 1 ? "" : "s"}).`;
  }, [totalCount, availableCount]);

  const goToAddDish = () => {
    navigation.navigate("OwnerAddDish", { mode: "create" });
  };

  const goToEditDish = (item: Dish) => {
    // ✅ ADAPTADOR: Realm (_id) -> Navigation (id)
    // OwnerAddDish espera un objeto con 'id', pero Realm tiene '_id'.
    // Creamos un objeto plano compatible para pasar por navegación.
    const dishParam = {
      id: item._id, // Mapeamos _id a id
      name: item.name,
      price: item.price,
      description: item.description || undefined,
      isAvailable: item.isAvailable,
    };

    navigation.navigate("OwnerAddDish", { mode: "edit", dish: dishParam });
  };

  // ✅ 4. ELIMINAR EN REALM
  const handleDelete = (item: Dish) => {
    Alert.alert(
      "Eliminar platillo",
      `¿Seguro que deseas eliminar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            realm.write(() => {
              realm.delete(item); // Realm elimina el objeto vivo directamente
            });
          },
        },
      ]
    );
  };

  // ✅ 5. TOGGLE DISPONIBILIDAD EN REALM
  const toggleAvailability = (item: Dish) => {
    realm.write(() => {
      item.isAvailable = !item.isAvailable;
    });
  };

  const toggleOpenClosed = () => {
    upsertOwnerRestaurant({ status: isOpen ? "Cerrado" : "Abierto ahora" });
  };

  const StatusPill = () => (
    <TouchableOpacity
      onPress={toggleOpenClosed}
      activeOpacity={0.9}
      style={[
        styles.statusPill,
        {
          backgroundColor: isOpen
            ? isDark
              ? "rgba(34,197,94,0.16)"
              : "rgba(34,197,94,0.12)"
            : isDark
            ? "rgba(239,68,68,0.18)"
            : "rgba(239,68,68,0.12)",
          borderColor: isOpen ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
        },
      ]}
    >
      <Ionicons
        name={isOpen ? "time-outline" : "alert-circle-outline"}
        size={14}
        color={isOpen ? "#16a34a" : "#ef4444"}
      />
      <Text
        style={[styles.statusText, { color: isOpen ? "#16a34a" : "#ef4444" }]}
      >
        {isOpen ? "Abierto" : "Cerrado"}
      </Text>
      <Text
        style={[styles.statusHint, { color: isOpen ? "#16a34a" : "#ef4444" }]}
      >
        (toca)
      </Text>
    </TouchableOpacity>
  );

  const FilterBar = () => (
    <View
      style={[
        styles.filterBar,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {[
        { k: "all" as const, label: "Todos" },
        { k: "available" as const, label: "Disponibles" },
        { k: "unavailable" as const, label: "No disponibles" },
      ].map((it) => {
        const active = filter === it.k;
        return (
          <TouchableOpacity
            key={it.k}
            onPress={() => setFilter(it.k)}
            activeOpacity={0.9}
            style={[
              styles.filterBtn,
              {
                backgroundColor: active ? theme.colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: active ? "#fff" : theme.colors.textSecondary },
              ]}
            >
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <OwnerLayout title="Menú" subtitle={headerSubtitle} showBack>
      {/* Top row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={goToAddDish}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Agregar platillo</Text>
        </TouchableOpacity>

        <StatusPill />
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Buscar platillo..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <FilterBar />

      {/* List */}
      {filteredDishes.length > 0 ? (
        <FlatList
          data={filteredDishes}
          keyExtractor={(d) => d._id} // ✅ Usamos _id de Realm
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const available = item.isAvailable;

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.title, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text
                        style={[styles.price, { color: theme.colors.primary }]}
                      >
                        ${item.price.toFixed(0)}
                      </Text>

                      <TouchableOpacity
                        onPress={() => toggleAvailability(item)}
                        activeOpacity={0.9}
                        style={[
                          styles.badge,
                          {
                            backgroundColor: available
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                            borderColor: available
                              ? "rgba(34,197,94,0.35)"
                              : "rgba(239,68,68,0.35)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: available ? "#16a34a" : "#ef4444" },
                          ]}
                        >
                          {available ? "Disponible" : "No disponible"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {item.description ? (
                      <Text
                        style={[
                          styles.desc,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark ? "#111111" : "#F3F4F6",
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => goToEditDish(item)}
                    activeOpacity={0.9}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={theme.colors.text}
                    />
                    <Text
                      style={[styles.actionText, { color: theme.colors.text }]}
                    >
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: "rgba(239,68,68,0.10)",
                        borderColor: "rgba(239,68,68,0.35)",
                      },
                    ]}
                    onPress={() => handleDelete(item)}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    <Text style={[styles.actionText, { color: "#ef4444" }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons
            name="restaurant-outline"
            size={30}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Sin resultados
          </Text>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            No encontramos platillos con ese filtro/búsqueda.
          </Text>

          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setQuery("");
              setFilter("all");
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.emptyBtnText}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      )}
    </OwnerLayout>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flex: 1,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },

  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
    gap: 2,
  },
  statusText: { fontSize: 12, fontWeight: "900" },
  statusHint: { fontSize: 9, fontWeight: "900", opacity: 0.85 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "600" },

  filterBar: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterText: { fontSize: 12, fontWeight: "900" },

  listContent: { paddingBottom: 18 },

  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: { fontSize: 14, fontWeight: "900" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  price: { fontSize: 13, fontWeight: "900" },

  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "900" },

  desc: { fontSize: 12, lineHeight: 16, opacity: 0.95 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "900" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    marginTop: 30,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900" },
  emptyText: { fontSize: 12, textAlign: "center" },
  emptyBtn: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  emptyBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },
});

export default OwnerMenuList;
