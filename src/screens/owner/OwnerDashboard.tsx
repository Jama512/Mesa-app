// src/screens/owner/OwnerDashboard.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import OwnerLayout from "./OwnerLayout";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useRestaurants } from "../../context/RestaurantsContext";

type Nav = StackNavigationProp<RootStackParamList, "OwnerDashboard">;

const DEFAULT_HOURS_LABEL = "Hoy · 9:00 AM – 10:00 PM"; // placeholder (luego lo haces real con Realm)

const OwnerDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const {
    restaurants,
    favorites,
    toggleFavorite,
    removeOwnerEvent,
    upsertOwnerRestaurant,
  } = useRestaurants();

  const ownerRestaurant = useMemo(
    () => restaurants.find((r) => r.isOwnerRestaurant) ?? null,
    [restaurants]
  );

  const ownerName = ownerRestaurant?.name ?? "Mi restaurante";
  const ownerRating = ownerRestaurant?.rating ?? 4.8;

  // Estado del negocio (lo vamos a manejar con .status)
  const statusRaw = ownerRestaurant?.status ?? "Abierto ahora";
  const isOpen = /abierto/i.test(statusRaw);

  const ownerEvents = ownerRestaurant?.events ?? [];
  const ownerEventsCount = ownerEvents.length;
  const ownerImagesCount = ownerRestaurant?.images?.length ?? 0;

  const servicesEnabledCount = useMemo(() => {
    const f = ownerRestaurant?.features ?? {};
    return Object.values(f).filter(Boolean).length;
  }, [ownerRestaurant?.features]);

  const hasLocation =
    typeof ownerRestaurant?.latitude === "number" &&
    typeof ownerRestaurant?.longitude === "number";

  const isFavorite = ownerRestaurant
    ? favorites.includes(ownerRestaurant.id)
    : false;

  // ✅ Helper tipado (sin "params as any")
  const goTo = <T extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[T]
      ? [screen: T] | [screen: T, params: RootStackParamList[T]]
      : [screen: T, params: RootStackParamList[T]]
  ) => {
    navigation.navigate(...(args as [any, any]));
  };

  const handleLogout = () => {
    // ✅ No RESET: tu StackNavigator cambia solo cuando logout() cambia el estado
    logout();
  };

  const toggleFavOwner = () => {
    if (!ownerRestaurant) return;
    toggleFavorite(ownerRestaurant.id);
  };

  const toggleOpenClosed = () => {
    // ✅ Persiste en RestaurantsContext (luego lo harás real en Realm)
    upsertOwnerRestaurant({
      status: isOpen ? "Cerrado" : "Abierto ahora",
    });
  };

  const lastEvents = ownerEvents.slice(0, 3);

  return (
    <OwnerLayout
      title="Panel del restaurante"
      subtitle="Administra tu perfil, menú y anuncios."
      showBack={false}
    >
      {/* HERO */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.heroTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {ownerName}
            </Text>

            <View style={styles.heroMetaRow}>
              <Ionicons name="star" size={14} color={theme.colors.primary} />
              <Text
                style={[styles.heroMeta, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {ownerRating.toFixed(1)}
              </Text>
            </View>

            {/* Estado + horario */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isOpen ? "#22C55E" : "#EF4444" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {isOpen ? "Abierto" : "Cerrado"}
                </Text>
              </View>

              <Text
                style={[
                  styles.hoursText,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {DEFAULT_HOURS_LABEL}
              </Text>
            </View>

            {/* Badges */}
            <View style={styles.heroBadgesRow}>
              <Badge
                icon={hasLocation ? "location" : "location-outline"}
                label={hasLocation ? "Ubicación OK" : "Sin ubicación"}
                active={hasLocation}
                theme={theme}
              />
              <Badge
                icon="options-outline"
                label={`${servicesEnabledCount} servicios`}
                active={false}
                theme={theme}
              />
              <Badge
                icon="images-outline"
                label={`${ownerImagesCount} fotos`}
                active={false}
                theme={theme}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={toggleFavOwner}
            style={[
              styles.favBtn,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            activeOpacity={0.9}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={
                isFavorite ? theme.colors.primary : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard
            label="Anuncios"
            value={`${ownerEventsCount}`}
            theme={theme}
          />
          <KpiCard
            label="Favoritos"
            value={`${favorites.length}`}
            theme={theme}
          />
          <KpiCard label="Estado" value={isOpen ? "ON" : "OFF"} theme={theme} />
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickBtn
            label="Publicar"
            icon="megaphone-outline"
            onPress={() => goTo("OwnerCreateAnnouncement")}
            theme={theme}
          />
          <QuickBtn
            label="Perfil"
            icon="person-outline"
            onPress={() => goTo("OwnerProfile")}
            theme={theme}
          />
          <QuickBtn
            label="Mapa"
            icon="map-outline"
            onPress={() => goTo("OwnerLocationPicker")}
            theme={theme}
          />
        </View>

        {/* Toggle abierto/cerrado */}
        <TouchableOpacity
          style={[
            styles.openCloseBtn,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={toggleOpenClosed}
          activeOpacity={0.9}
        >
          <Ionicons
            name={isOpen ? "lock-open-outline" : "lock-closed-outline"}
            size={18}
            color={theme.colors.primary}
          />
          <Text style={[styles.openCloseText, { color: theme.colors.text }]}>
            {isOpen ? "Marcar como cerrado" : "Marcar como abierto"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ACCESOS */}
      <View style={styles.grid}>
        <DashCard
          title="Publicar anuncio"
          subtitle="Evento o promoción"
          icon="megaphone-outline"
          onPress={() => goTo("OwnerCreateAnnouncement")}
          theme={theme}
        />
        <DashCard
          title="Editar menú"
          subtitle="Platillos y precios"
          icon="restaurant-outline"
          onPress={() => goTo("OwnerMenuList")}
          theme={theme}
        />
        <DashCard
          title="Mi perfil"
          subtitle="Datos, fotos y servicios"
          icon="person-outline"
          onPress={() => goTo("OwnerProfile")}
          theme={theme}
        />
        <DashCard
          title="Estadísticas"
          subtitle="Visitas y rendimiento"
          icon="stats-chart-outline"
          onPress={() => goTo("OwnerStats")}
          theme={theme}
        />
      </View>

      {/* ÚLTIMOS ANUNCIOS */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Últimos anuncios
        </Text>

        <TouchableOpacity
          onPress={() => goTo("OwnerCreateAnnouncement")}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionCta, { color: theme.colors.primary }]}>
            Crear
          </Text>
        </TouchableOpacity>
      </View>

      {lastEvents.length > 0 ? (
        <FlatList
          data={lastEvents}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.eventRow,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.eventTitle, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.eventMeta,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {item.dateLabel}
                  {item.description ? ` • ${item.description}` : ""}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => removeOwnerEvent(item.id)}
                style={[styles.trashBtn, { borderColor: theme.colors.border }]}
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
        <View style={styles.emptyBox}>
          <Ionicons
            name="megaphone-outline"
            size={22}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
          >
            Aún no has publicado anuncios.
          </Text>
        </View>
      )}

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleLogout}
        activeOpacity={0.9}
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </OwnerLayout>
  );
};

function Badge({
  icon,
  label,
  active,
  theme,
}: {
  icon: any;
  label: string;
  active: boolean;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.badgeText,
          { color: active ? theme.colors.primary : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function KpiCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function QuickBtn({
  label,
  icon,
  onPress,
  theme,
}: {
  label: string;
  icon: any;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.quickBtn,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={[styles.quickText, { color: theme.colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DashCard({
  title,
  subtitle,
  icon,
  onPress,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: any;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.cardIcon,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>

      <Text
        style={[styles.cardTitle, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 14,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroTitle: { fontSize: 16, fontWeight: "900" },
  heroMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMeta: { fontSize: 12, fontWeight: "700", opacity: 0.9 },

  statusRow: { marginTop: 10, gap: 8 },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "900" },
  hoursText: { fontSize: 11, fontWeight: "700", opacity: 0.9 },

  heroBadgesRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },

  favBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  kpiRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 16, fontWeight: "900" },
  kpiLabel: { marginTop: 2, fontSize: 11, fontWeight: "700", opacity: 0.9 },

  quickRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  quickText: { fontSize: 11, fontWeight: "900" },

  openCloseBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  openCloseText: { fontSize: 12, fontWeight: "900" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginTop: 6,
  },
  card: {
    width: "48%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", marginBottom: 4 },
  cardSubtitle: { fontSize: 11, lineHeight: 15, opacity: 0.9 },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  sectionCta: { fontSize: 12, fontWeight: "900" },

  eventRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventTitle: { fontSize: 13, fontWeight: "900" },
  eventMeta: { marginTop: 2, fontSize: 11, fontWeight: "700", opacity: 0.9 },
  trashBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  emptyText: { fontSize: 12, fontWeight: "700", textAlign: "center" },

  logoutButton: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
});

export default OwnerDashboard;
