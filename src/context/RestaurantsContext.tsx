// src/context/RestaurantsContext.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import Realm from "realm";
import { useQuery, useRealm } from "../database/realm";
import { Restaurant as RestaurantModel } from "../database/models/RestaurantModel";
import { Event as EventModel } from "../database/models/EventModel";
import { useAuth } from "../screens/auth/AuthContext";

/* =======================
   TIPOS (Compatibilidad UI)
======================= */
export type RestaurantEvent = {
  id: string;
  title: string;
  dateLabel: string;
  description?: string;
};

export type RestaurantFeatures = {
  wifi?: boolean;
  outdoorSeating?: boolean;
  parking?: boolean;
  reservations?: boolean;
  delivery?: boolean;
  cardPayment?: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  description?: string;
  rating?: number;
  status?: string;
  features?: RestaurantFeatures;
  images?: string[];
  events?: RestaurantEvent[];
  isOwnerRestaurant?: boolean;
};

type Ctx = {
  restaurants: Restaurant[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  upsertOwnerRestaurant: (patch: Partial<Restaurant>) => void;
  addOwnerEvent: (event: Omit<RestaurantEvent, "id">) => void;
  removeOwnerEvent: (eventId: string) => void;
};

const RestaurantsContext = createContext<Ctx | undefined>(undefined);
const OWNER_ID = "owner-restaurant"; // ID fijo para el usuario local

export const RestaurantsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const realm = useRealm();
  const { state } = useAuth();

  // 1. LEER DE REALM
  const realmRestaurants = useQuery(RestaurantModel);
  const realmEvents = useQuery(EventModel);

  // 2. FAVORITOS (Estado Local)
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // 3. ADAPTADOR: REALM -> UI
  const visibleRestaurants: Restaurant[] = useMemo(() => {
    return realmRestaurants.map((r) => {
      const features: RestaurantFeatures = {
        wifi: r.wifi,
        outdoorSeating: r.outdoorSeating,
        parking: r.parking,
        reservations: r.reservations,
        delivery: r.delivery,
        cardPayment: r.cardPayment,
      };

      const myEvents = realmEvents
        .filter((e) => e.restaurantId === r._id)
        .map((e) => ({
          id: e._id.toHexString(),
          title: e.title,
          dateLabel: e.dateLabel,
          description: e.description ?? undefined,
        }));

      return {
        id: r._id,
        name: r.name,
        category: r.category,
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
        address: r.address ?? undefined,
        phone: r.phone ?? undefined,
        description: r.description ?? undefined,
        rating: r.rating ?? 4.5,
        status: r.status ?? "Abierto ahora",
        features,
        images: Array.from(r.images),
        events: myEvents,
        isOwnerRestaurant: r.isOwnerRestaurant,
      };
    });
  }, [realmRestaurants, realmEvents]);

  // 4. ACCIONES DEL DUEÑO (Escribir en Realm)
  const upsertOwnerRestaurant = useCallback(
    (patch: Partial<Restaurant>) => {
      realm.write(() => {
        // ✅ TIPADO EXPLÍCITO: Evita que TS se confunda entre Realm.Object y null
        let existing: RestaurantModel | null = realm.objectForPrimaryKey(
          RestaurantModel,
          OWNER_ID
        );

        if (!existing) {
          // Crear usando la Clase (más seguro)
          existing = realm.create(
            RestaurantModel,
            {
              _id: OWNER_ID,
              name: patch.name || "Mi Restaurante",
              category: "Mi Negocio",
              isOwnerRestaurant: true,
              images: [],
              createdAt: new Date(),
            },
            Realm.UpdateMode.Modified
          );
        }

        // ✅ VARIABLE SEGURA: Confirmamos a TS que ya no es null
        const myRest = existing!;

        // Actualizar campos planos
        if (patch.name !== undefined) myRest.name = patch.name;
        if (patch.category !== undefined) myRest.category = patch.category;
        if (patch.address !== undefined) myRest.address = patch.address;
        if (patch.phone !== undefined) myRest.phone = patch.phone;
        if (patch.description !== undefined)
          myRest.description = patch.description;
        if (patch.latitude !== undefined) myRest.latitude = patch.latitude;
        if (patch.longitude !== undefined) myRest.longitude = patch.longitude;
        if (patch.status !== undefined) myRest.status = patch.status;

        // Actualizar features
        if (patch.features) {
          if (patch.features.wifi !== undefined)
            myRest.wifi = patch.features.wifi;
          if (patch.features.outdoorSeating !== undefined)
            myRest.outdoorSeating = patch.features.outdoorSeating;
          if (patch.features.parking !== undefined)
            myRest.parking = patch.features.parking;
          if (patch.features.reservations !== undefined)
            myRest.reservations = patch.features.reservations;
          if (patch.features.delivery !== undefined)
            myRest.delivery = patch.features.delivery;
          if (patch.features.cardPayment !== undefined)
            myRest.cardPayment = patch.features.cardPayment;
        }

        // Actualizar imágenes
        if (patch.images) {
          myRest.images.splice(0, myRest.images.length);
          patch.images.forEach((img) => myRest.images.push(img));
        }
      });
    },
    [realm]
  );

  const addOwnerEvent = useCallback(
    (event: Omit<RestaurantEvent, "id">) => {
      realm.write(() => {
        realm.create(EventModel, {
          _id: new Realm.BSON.ObjectId(),
          restaurantId: OWNER_ID,
          title: event.title,
          dateLabel: event.dateLabel,
          description: event.description,
          createdAt: new Date(),
        });
      });
    },
    [realm]
  );

  const removeOwnerEvent = useCallback(
    (eventId: string) => {
      realm.write(() => {
        try {
          const oid = new Realm.BSON.ObjectId(eventId);
          const ev = realm.objectForPrimaryKey(EventModel, oid);
          if (ev) realm.delete(ev);
        } catch (e) {
          console.log("Error eliminando evento:", e);
        }
      });
    },
    [realm]
  );

  const value = useMemo(
    () => ({
      restaurants: visibleRestaurants,
      favorites,
      toggleFavorite,
      upsertOwnerRestaurant,
      addOwnerEvent,
      removeOwnerEvent,
    }),
    [
      visibleRestaurants,
      favorites,
      toggleFavorite,
      upsertOwnerRestaurant,
      addOwnerEvent,
      removeOwnerEvent,
    ]
  );

  return (
    <RestaurantsContext.Provider value={value}>
      {children}
    </RestaurantsContext.Provider>
  );
};

export const useRestaurants = () => {
  const ctx = useContext(RestaurantsContext);
  if (!ctx) {
    throw new Error(
      "useRestaurants debe usarse dentro de <RestaurantsProvider>"
    );
  }
  return ctx;
};
