// src/screens/owner/OwnerStats.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/ThemeContext";
import OwnerLayout from "./OwnerLayout";

// Consumo de datos globales
import { useRestaurants } from "../../context/RestaurantsContext";
import { useAuth } from "../auth/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";

type Nav = StackNavigationProp<RootStackParamList, "OwnerStats">;

const OwnerStats: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { state } = useAuth();

  // Extraigo funciones y datos del contexto
  const { restaurants, favorites, removeOwnerEvent } = useRestaurants();

  // Localizo el restaurante del usuario actual
  const ownerRestaurant = useMemo(() => {
    return restaurants.find((r) => r.isOwnerRestaurant) ?? null;
  }, [restaurants]);

  // --- MOTOR DE ESTADÍSTICAS ---
  // Uso useMemo para que estos cálculos matemáticos solo se ejecuten
  // cuando cambien los datos del restaurante, no en cada renderizado.
  const stats = useMemo(() => {
    const r = ownerRestaurant;

    const name = r?.name ?? "Mi restaurante";
    const rating = r?.rating ?? 4.8;
    const status = r?.status ?? "Abierto ahora";

    const events = r?.events ?? [];
    const eventsCount = events.length;

    // Simulación de alcance basada en actividad (MVP Logic)
    const reach = 120 + eventsCount * 18;

    // Conteo real de usuarios que han dado 'like'
    const saves = favorites.length;

    // --- ALGORITMO DE COMPLETITUD DE PERFIL ---
    const profile = r;
    const totalFields = 6; // Campos requeridos para un perfil "Perfecto"

    // Sumo 1 si el campo existe y tiene contenido
    const filled =
      (profile?.name ? 1 : 0) +
      (profile?.address ? 1 : 0) +
      (profile?.phone ? 1 : 0) +
      (profile?.description ? 1 : 0) +
      (profile?.latitude ? 1 : 0) +
      (Object.keys(profile?.features || {}).length > 0 ? 1 : 0);

    // Regla de tres para obtener el porcentaje
    const profilePct = Math.round((filled / totalFields) * 100);

    // Obtengo solo los eventos más recientes para la vista previa
    const latestEvents = [...events].slice(0, 3);

    return {
      name,
      rating,
      status,
      eventsCount,
      reach,
      saves,
      profilePct,
      latestEvents,
    };
  }, [ownerRestaurant, favorites.length]);

  const goTo = (screen: keyof RootStackParamList, params?: any) => {
    navigation.navigate(screen, params);
  };

  // Confirmación de borrado (UX: Prevención de errores)
  const confirmDeleteEvent = (eventId: string) => {
    Alert.alert(
      "Eliminar anuncio",
      "¿Seguro que quieres eliminar este anuncio? Ya no aparecerá en el calendario.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeOwnerEvent(eventId), // Llamada a Firestore
        },
      ]
    );
  };

  return (
    <OwnerLayout
      title="Estadísticas"
      subtitle="Resumen rápido del rendimiento de tu restaurante."
      showBack
    >
      {/* HERO SECTION: Resumen General */}
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
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              {stats.name}
            </Text>

            <View style={styles.heroMetaRow}>
              <Ionicons name="star" size={14} color={theme.colors.primary} />
              <Text
                style={[styles.heroMeta, { color: theme.colors.textSecondary }]}
              >
                {stats.rating.toFixed(1)} • {stats.status}
              </Text>
            </View>
          </View>

          {/* Badge de Porcentaje de Perfil */}
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
              name="analytics-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.badgeText, { color: theme.colors.text }]}>
              {stats.profilePct}% perfil
            </Text>
          </View>
        </View>

        {/* GRID DE KPIs (Key Performance Indicators) */}
        <View style={styles.kpiRow}>
          <KpiCard
            theme={theme}
            icon="megaphone-outline"
            value={String(stats.eventsCount)}
            label="Anuncios"
          />
          <KpiCard
            theme={theme}
            icon="bookmark-outline"
            value={String(stats.saves)}
            label="Guardados"
          />
          <KpiCard
            theme={theme}
            icon="eye-outline"
            value={String(stats.reach)}
            label="Alcance"
          />
        </View>

        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          * Alcance estimado basado en actividad reciente.
        </Text>
      </View>

      {/* SECCIÓN: GESTIÓN DE ANUNCIOS */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Últimos anuncios
        </Text>
        <TouchableOpacity
          onPress={() => goTo("OwnerCreateAnnouncement")}
          activeOpacity={0.9}
          style={[styles.sectionBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.sectionBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {stats.latestEvents.length > 0 ? (
        <View style={{ gap: 10 }}>
          {stats.latestEvents.map((e) => (
            <View
              key={e.id}
              style={[
                styles.eventCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventTitle, { color: theme.colors.text }]}>
                  {e.title}
                </Text>
                <Text
                  style={[
                    styles.eventSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {e.dateLabel}
                </Text>
                {!!e.description && (
                  <Text
                    style={[
                      styles.eventDesc,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {e.description}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => confirmDeleteEvent(e.id)}
                style={[
                  styles.trashBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        // Estado Vacío (Empty State)
        <View
          style={[
            styles.empty,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
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
          <TouchableOpacity
            style={[styles.emptyCta, { backgroundColor: theme.colors.primary }]}
            onPress={() => goTo("OwnerCreateAnnouncement")}
            activeOpacity={0.9}
          >
            <Text style={styles.emptyCtaText}>Publicar el primero</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ACCIONES RÁPIDAS (Navegación Interna) */}
      <View style={[styles.sectionHeader, { marginTop: 18 }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Acciones rápidas
        </Text>
      </View>

      <View style={styles.actionsGrid}>
        <ActionCard
          theme={theme}
          icon="person-outline"
          title="Editar perfil"
          subtitle="Datos y servicios"
          onPress={() => goTo("OwnerProfile")}
        />
        <ActionCard
          theme={theme}
          icon="restaurant-outline"
          title="Menú"
          subtitle="Platillos y precios"
          onPress={() => goTo("OwnerMenuList")}
        />
        <ActionCard
          theme={theme}
          icon="calendar-outline"
          title="Calendario"
          subtitle="Ver anuncios"
          onPress={() => goTo("OwnerDashboard")}
        />
      </View>
    </OwnerLayout>
  );
};

// --- COMPONENTES AUXILIARES (UI KITS) ---

function KpiCard({
  theme,
  icon,
  value,
  label,
}: {
  theme: any;
  icon: any;
  value: string;
  label: string;
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
      <View
        style={[
          styles.kpiIcon,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={theme.colors.primary} />
      </View>
      <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function ActionCard({
  theme,
  icon,
  title,
  subtitle,
  onPress,
}: {
  theme: any;
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.actionCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={[styles.actionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text
        style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}
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
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroTitle: { fontSize: 16, fontWeight: "900" },
  heroMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMeta: { fontSize: 12, fontWeight: "700", opacity: 0.9 },
  badge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "900" },

  kpiRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 16, fontWeight: "900" },
  kpiLabel: { fontSize: 11, fontWeight: "800", opacity: 0.9 },

  note: { marginTop: 10, fontSize: 11, fontWeight: "600", opacity: 0.9 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900" },
  sectionBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  eventCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  eventTitle: { fontSize: 13, fontWeight: "900" },
  eventSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.9,
  },
  eventDesc: { marginTop: 6, fontSize: 11, fontWeight: "600", opacity: 0.9 },
  trashBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  emptyCta: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  emptyCtaText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  actionCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionTitle: { fontSize: 13, fontWeight: "900", marginBottom: 3 },
  actionSubtitle: { fontSize: 11, fontWeight: "700", opacity: 0.9 },
});

export default OwnerStats;
