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
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";


import * as FileSystem from "expo-file-system";

import { db, auth } from "../config/firebaseConfig";
import { getLocalRestaurants, saveRestaurantsLocally } from "../services/database.service";

import {
  Restaurant,
  Dish,
  RestaurantEvent,
} from "../../types/restaurant.types";

export type { Restaurant, Dish, RestaurantEvent };

type Ctx = {
  restaurants: Restaurant[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  upsertOwnerRestaurant: (patch: Partial<Restaurant>) => Promise<void>;
  addOwnerEvent: (event: Omit<RestaurantEvent, "id">) => void;
  removeOwnerEvent: (eventId: string) => void;
  addDish?: (dish: Dish) => Promise<void>;
  removeDish?: (dishId: string) => Promise<void>;
};

const RestaurantsContext = createContext<Ctx | undefined>(undefined);

// Helper para descargar y guardar imágenes localmente
const cacheImageLocal = async (url: string, restaurantId: string, index: number): Promise<string> => {
  if (!url || !url.startsWith("http")) return url; // Si ya es local o está vacía, se ignora

  try {
    const extension = url.split("?")[0].split(".").pop() || "jpg";
    const filename = `rest_${restaurantId}_img_${index}.${extension}`;
    const localFile = new FileSystem.File(FileSystem.Paths.document, filename);

    // Verificar si la imagen ya fue descargada previamente
    const fileInfo = await localFile.info();
    if (fileInfo.exists) {
      return localFile.uri;
    }

    // Si no existe, descargarla
    await FileSystem.File.downloadFileAsync(url, localFile);
    return localFile.uri;
  } catch (error) {
    console.log("Error descargando imagen para caché:", error);
    return url; // Si falla por falta de red, devolvemos la original como plan B
  }
};

export const RestaurantsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. CARGA OFFLINE Y SINCRONIZACIÓN CON FIREBASE
  useEffect(() => {
    let isMounted = true;

    // A) Fast-Boot: Cargar datos desde SQLite al instante
    const loadOfflineData = async () => {
      try {
        const localData = await getLocalRestaurants();
        if (localData && localData.length > 0 && isMounted) {
          setRestaurants(localData);
          console.log("⚡ Restaurantes cargados desde SQLite (Offline-First)");
        }
      } catch (e) {
        console.log("No se pudo leer SQLite", e);
      }
    };

    loadOfflineData();

    // B) Sincronización en segundo plano con Firebase
    const unsubscribe = onSnapshot(
      collection(db, "restaurants"),
      async (snapshot) => {
        const currentUser = auth.currentUser;
        
        // Mapeo inicial de los datos en crudo
        const rawList: Restaurant[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
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
            events: data.events || [],
            menu: data.menu || [],
            isOwnerRestaurant: !!isOwner,
            ownerId: data.ownerId,
          } as Restaurant;
        });

        // Procesamiento asíncrono para descargar las imágenes localmente
        const processedList = await Promise.all(
          rawList.map(async (rest) => {
            if (rest.images && rest.images.length > 0) {
              const localImages = await Promise.all(
                rest.images.map((imgUrl, index) => cacheImageLocal(imgUrl, rest.id, index))
              );
              return { ...rest, images: localImages };
            }
            return rest;
          })
        );

        if (isMounted) {
          setRestaurants(processedList);
          // Actualizamos la mochila (SQLite) con los textos y las NUEVAS rutas locales de las imágenes
          saveRestaurantsLocally(processedList);
        }
      },
      (error) => {
        console.log("Modo Offline activo o error en onSnapshot:", error);
      }
    );

    // Cargar favoritos locales (AsyncStorage)
    AsyncStorage.getItem("MESA_FAVORITES").then((res) => {
      if (res && isMounted) setFavorites(JSON.parse(res));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 2. FAVORITOS (Local)
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem("MESA_FAVORITES", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  // 3. ACCIONES DEL DUEÑO (Legacy / Global)
  const upsertOwnerRestaurant = useCallback(
    async (patch: Partial<Restaurant>) => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "restaurants", user.uid);
      const payload: any = {
        ...patch,
        ownerId: user.uid,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      await setDoc(docRef, payload, { merge: true });
    },
    []
  );

  const addOwnerEvent = useCallback(
    async (event: Omit<RestaurantEvent, "id">) => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "restaurants", user.uid);
      const newEvent: RestaurantEvent = {
        id: Date.now().toString(),
        ...event,
      };

      await updateDoc(docRef, {
        events: arrayUnion(newEvent),
      });
    },
    []
  );

  const removeOwnerEvent = useCallback(async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "restaurants", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const currentEvents = (data.events as RestaurantEvent[]) || [];
      const updatedEvents = currentEvents.filter((e) => e.id !== eventId);

      await updateDoc(docRef, { events: updatedEvents });
    }
  }, []);

  // 5. FUNCIONES DE MENÚ (Legacy - Mantenidas por compatibilidad)
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
      addDish,
      removeDish,
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