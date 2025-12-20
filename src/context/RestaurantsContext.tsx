// src/context/RestaurantsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ✅ Importamos Firebase
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";

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

// ✅ Agregamos Dish para el menú
export type Dish = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
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
  menu?: Dish[]; // ✅ Agregado soporte para menú
  isOwnerRestaurant?: boolean;
  ownerId?: string; // ID de Firebase Auth
};

type Ctx = {
  restaurants: Restaurant[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  upsertOwnerRestaurant: (patch: Partial<Restaurant>) => Promise<void>;
  addOwnerEvent: (event: Omit<RestaurantEvent, "id">) => void;
  removeOwnerEvent: (eventId: string) => void;
  // Funciones para menú
  addDish?: (dish: Dish) => Promise<void>;
  removeDish?: (dishId: string) => Promise<void>;
};

const RestaurantsContext = createContext<Ctx | undefined>(undefined);

export const RestaurantsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. LEER DE FIREBASE (Tiempo Real 📡)
  useEffect(() => {
    // Suscribirse a la colección "restaurants"
    const unsubscribe = onSnapshot(
      collection(db, "restaurants"),
      (snapshot) => {
        const list: Restaurant[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const currentUser = auth.currentUser;

          // Verificar si es mío
          const isOwner = currentUser && data.ownerId === currentUser.uid;

          return {
            id: docSnap.id,
            name: data.name || "Restaurante sin nombre",
            category: data.category || "General",
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            phone: data.phone,
            description: data.description,
            rating: data.rating ?? 4.5,
            status: data.status ?? "Abierto ahora",
            features: data.features || {},
            images: data.images || [],
            events: data.events || [], // Los eventos ahora viven dentro del doc
            menu: data.menu || [],
            isOwnerRestaurant: !!isOwner,
            ownerId: data.ownerId,
          };
        });
        setRestaurants(list);
      }
    );

    // Cargar favoritos locales
    AsyncStorage.getItem("MESA_FAVORITES").then((res) => {
      if (res) setFavorites(JSON.parse(res));
    });

    return () => unsubscribe();
  }, []);

  // 2. FAVORITOS (Local) ❤️
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem("MESA_FAVORITES", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  // 3. ACCIONES DEL DUEÑO (Escribir en Firestore 🔥)
  const upsertOwnerRestaurant = useCallback(
    async (patch: Partial<Restaurant>) => {
      const user = auth.currentUser;
      if (!user) return;

      // Usamos el UID del usuario como ID del documento para asegurar 1 restaurante por dueño
      const docRef = doc(db, "restaurants", user.uid);

      // 🛡️ LIMPIEZA DE DATOS: Firestore odia 'undefined'
      const payload: any = {
        ...patch,
        ownerId: user.uid,
      };

      // Recorremos el objeto y borramos las claves que sean undefined
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      // setDoc con { merge: true } actualiza solo los campos que envíes
      await setDoc(docRef, payload, { merge: true });
    },
    []
  );

  const addOwnerEvent = useCallback(
    async (event: Omit<RestaurantEvent, "id">) => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "restaurants", user.uid);

      // Generamos un ID simple para el evento
      const newEvent: RestaurantEvent = {
        id: Date.now().toString(),
        ...event,
      };

      // Usamos arrayUnion para agregar al arreglo "events" de Firestore
      await updateDoc(docRef, {
        events: arrayUnion(newEvent),
      });
    },
    []
  );

  const removeOwnerEvent = useCallback(async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // Estrategia segura: Leer, filtrar y guardar.
    const docRef = doc(db, "restaurants", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const currentEvents = (data.events as RestaurantEvent[]) || [];
      const updatedEvents = currentEvents.filter((e) => e.id !== eventId);

      await updateDoc(docRef, { events: updatedEvents });
    }
  }, []);

  // ✅ 5. FUNCIONES DE MENÚ (Implementadas)
  const addDish = useCallback(async (dish: Dish) => {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = doc(db, "restaurants", user.uid);
    await updateDoc(docRef, {
      menu: arrayUnion(dish),
    });
  }, []);

  const removeDish = useCallback(async (dishId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = doc(db, "restaurants", user.uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const currentMenu = (snap.data().menu as Dish[]) || [];
      const newMenu = currentMenu.filter((d) => d.id !== dishId);
      await updateDoc(docRef, { menu: newMenu });
    }
  }, []);

  const value = useMemo(
    () => ({
      restaurants,
      favorites,
      toggleFavorite,
      upsertOwnerRestaurant,
      addOwnerEvent,
      removeOwnerEvent,
      addDish, // ✅ Ahora sí están disponibles
      removeDish, // ✅
    }),
    [
      restaurants,
      favorites,
      toggleFavorite,
      upsertOwnerRestaurant,
      addOwnerEvent,
      removeOwnerEvent,
      addDish,
      removeDish,
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
