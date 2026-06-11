/**
 * src/context/RestaurantsContext.tsx
 * Contexto global para gestión de restaurantes con soporte offline-first
 * 
 * ✅ REFACTORIZADO: Ahora usa servicios centralizados
 * - MenuService para operaciones de restaurante y menú
 * - AnnouncementService para eventos
 * - MultimediaService para subidas de imágenes
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";

// ✅ Autenticación
import { useAuth } from "../screens/auth/AuthContext";

// ✅ Servicios centralizados
import { MenuService } from "../services/menu.service";
import { AnnouncementService } from "../services/announcement.service";
import { MultimediaService } from "../services/multimedia.service";

// ✅ Funciones de base de datos offline
import {
  getLocalRestaurants,
  saveRestaurantsLocally,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
} from "../services/database.service";

// ✅ Tipos
import { Restaurant, Dish, RestaurantEvent } from "../../types/restaurant.types";

export type { Restaurant, Dish, RestaurantEvent };

// --- TIPOS DEL CONTEXTO ---
type Ctx = {
  restaurants: Restaurant[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  upsertOwnerRestaurant: (patch: Partial<Restaurant>) => Promise<void>;
  addOwnerEvent: (event: Omit<RestaurantEvent, "id">) => Promise<void>;
  removeOwnerEvent: (eventId: string) => Promise<void>;
  addDish: (dish: Dish) => Promise<void>;
  removeDish: (dishId: string) => Promise<void>;
  uploadRestaurantImage: (fileUri: string) => Promise<string | null>;
  deleteRestaurant: (restaurantId: string) => Promise<void>;
  deleteAllRestaurants: () => Promise<void>;
};

const RestaurantsContext = createContext<Ctx | undefined>(undefined);

// --- FUNCIONES AUXILIARES ---

/**
 * Cachea imágenes localmente en el dispositivo
 */
const cacheImageLocal = async (
  url: string,
  restaurantId: string,
  index: number
): Promise<string> => {
  if (!url || !url.startsWith("http")) return url;
  try {
    const extension = url.split("?")[0].split(".").pop() || "jpg";
    const filename = `rest_${restaurantId}_img_${index}.${extension}`;
    const localFile = new FileSystem.File(FileSystem.Paths.document, filename);
    const fileInfo = await localFile.info();
    if (fileInfo.exists) return localFile.uri;
    await FileSystem.File.downloadFileAsync(url, localFile);
    return localFile.uri;
  } catch (error) {
    return url;
  }
};

// --- PROVIDER ---

export const RestaurantsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const { state: authState } = useAuth();
  const currentUserId = authState.userId;

  // --- 🔄 EL VIGILANTE: Sincronización Offline-First ---
  const processSyncQueue = useCallback(async () => {
    const pendingTasks = await getSyncQueue();
    if (pendingTasks.length === 0) return;

    console.log(
      `🔄 Vigilante activado: Procesando ${pendingTasks.length} tareas pendientes...`
    );

    for (const task of pendingTasks) {
      if (!task.operation || task.operation === "undefined") {
        console.log("💀 Tarea corrupta eliminada de la cola.");
        await removeFromSyncQueue(task.id);
        continue;
      }

      try {
        // ✅ Delegamos a los servicios en lugar de hacer fetch directo
        switch (task.operation) {
          case "UPSERT_RESTAURANT":
            console.log("🔄 Sincronizando: UPSERT_RESTAURANT");
            await MenuService.upsertRestaurant(task.payload);
            break;

          case "ADD_DISH":
            console.log("🔄 Sincronizando: ADD_DISH");
            await MenuService.addDish(task.payload.dish);
            break;

          case "REMOVE_DISH":
            console.log("🔄 Sincronizando: REMOVE_DISH");
            await MenuService.removeDish(task.payload.dishId);
            break;

          case "ADD_EVENT":
            console.log("🔄 Sincronizando: ADD_EVENT");
            await AnnouncementService.addAnnouncement(task.payload.event);
            break;

          case "REMOVE_EVENT":
            console.log("🔄 Sincronizando: REMOVE_EVENT");
            await AnnouncementService.removeAnnouncement(task.payload.eventId);
            break;

          default:
            console.warn("⚠️ Operación desconocida:", task.operation);
            break;
        }

        // Si todo va bien, eliminar de la cola
        await removeFromSyncQueue(task.id);
        console.log(`✅ Nube actualizada: ${task.operation}`);
      } catch (error) {
        console.log(
          "⚠️ Backend inalcanzable. El Vigilante pausará y esperará."
        );
        console.error("Error detallado:", error);
        break; // Romper el ciclo para no borrar tareas si no hay internet
      }
    }
  }, []);

  // --- Detector de conectividad ---
  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        console.log("📡 Internet detectado. Procesando cola de sincronización...");
        processSyncQueue();
      } else {
        console.log("📵 Sin internet. Modo offline activo.");
      }
    });
    return () => unsubscribeNet();
  }, [processSyncQueue]);

  // --- 📥 LECTURA PRINCIPAL: Obtener restaurantes de la API ---
  const fetchRestaurantsFromAPI = useCallback(
    async (isMounted: boolean = true) => {
      try {
        console.log("📥 Obteniendo restaurantes de la API...");
        const rawList = await MenuService.getAllRestaurants();

        const processedList = await Promise.all(
          rawList.map(async (rest) => {
            const isOwner = currentUserId && rest.ownerId === currentUserId;
            let localImages = rest.images || [];

            // Cachear imágenes localmente
            if (rest.images && rest.images.length > 0) {
              localImages = await Promise.all(
                rest.images.map((imgUrl, index) =>
                  cacheImageLocal(imgUrl, rest.id, index)
                )
              );
            }

            return {
              ...rest,
              isOwnerRestaurant: !!isOwner,
              images: localImages,
            } as Restaurant;
          })
        );

        if (isMounted) {
          // 🔥 MERGE INTELIGENTE: Mantener eventos Y platillos locales pendientes
          setRestaurants((oldRestaurants) => {
            const mergedList = processedList.map((newRest) => {
              const oldRest = oldRestaurants.find((r) => r.id === newRest.id);
              
              if (!oldRest) return newRest;
              
              let mergedRest = { ...newRest };
              
              // 🔄 MERGE EVENTOS: Si es nuestro restaurante y hay eventos locales pendientes, preservarlos
              if (oldRest.ownerId === currentUserId && oldRest.events) {
                const serverEventIds = new Set((newRest.events || []).map((e) => e.id));
                const localOnlyEvents = oldRest.events.filter((e) => !serverEventIds.has(e.id));
                
                if (localOnlyEvents.length > 0) {
                  console.log(`🔄 MERGE: Preservando ${localOnlyEvents.length} eventos locales pendientes`);
                  mergedRest.events = [...(newRest.events || []), ...localOnlyEvents];
                }
              }
              
              // 🔄 MERGE PLATILLOS: Si es nuestro restaurante y hay platillos locales pendientes, preservarlos
              if (oldRest.ownerId === currentUserId && oldRest.menu) {
                const serverDishIds = new Set((newRest.menu || []).map((d) => d.id));
                const localOnlyDishes = oldRest.menu.filter((d) => !serverDishIds.has(d.id));
                
                if (localOnlyDishes.length > 0) {
                  console.log(`🔄 MERGE: Preservando ${localOnlyDishes.length} platillos locales pendientes`);
                  mergedRest.menu = [...(newRest.menu || []), ...localOnlyDishes];
                }
              }
              
              return mergedRest;
            });

            return mergedList;
          });

          // Guardar a SQLite después (sin bloquear)
          saveRestaurantsLocally(processedList).catch((error) => {
            console.warn("⚠️ Error al guardar en SQLite (pero estado local está OK):", error);
          });
          
          console.log(`✅ ${processedList.length} restaurantes cargados (con merge inteligente)`);
        }
      } catch (error) {
        console.log(
          "⚠️ Modo Offline: Se mantienen los datos en cache local"
        );
        console.error("Error en fetchRestaurantsFromAPI:", error);
      }
    },
    [currentUserId]
  );

  // --- 🚀 INICIALIZACIÓN ---
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        // 1. Cargar favoritos
        const favsRes = await AsyncStorage.getItem("MESA_FAVORITES");
        if (favsRes && isMounted) {
          setFavorites(JSON.parse(favsRes));
        }

        // 2. Cargar datos locales de SQLite
        const localData = await getLocalRestaurants();
        if (localData && localData.length > 0 && isMounted) {
          setRestaurants(localData);
          console.log(`📦 ${localData.length} restaurantes cargados del cache`);
        }

        // 3. Ir a buscar datos frescos de la API
        if (isMounted) {
          await fetchRestaurantsFromAPI(true);
        }
      } catch (e) {
        console.error("Error inicializando datos del contexto:", e);
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [fetchRestaurantsFromAPI]);

  // --- ⭐ GESTIÓN DE FAVORITOS ---
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavs = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem("MESA_FAVORITES", JSON.stringify(newFavs));
      return newFavs;
    });
  }, []);

  // --- 📸 SUBIDA DE IMÁGENES ---
  const uploadRestaurantImage = useCallback(
    async (fileUri: string): Promise<string | null> => {
      try {
        console.log("📸 Subiendo imagen a FastAPI...");
        const url = await MultimediaService.uploadImage(fileUri);
        console.log("✅ Imagen subida:", url);
        return url;
      } catch (error) {
        console.error("❌ Error al subir imagen:", error);
        return null;
      }
    },
    []
  );

  // --- 🏪 OPERACIONES DEL DUEÑO: RESTAURANT ---
  const upsertOwnerRestaurant = useCallback(
    async (patch: Partial<Restaurant>) => {
      if (!currentUserId) {
        console.error("❌ Usuario no autenticado");
        return;
      }

      // Obtener el ID del restaurante actual para no crear duplicados
      const currentRest = restaurants.find((r) => r.ownerId === currentUserId);
      const currentRestaurantId = currentRest?.id;

      console.log("🔍 Restaurante actual del dueño:", { id: currentRestaurantId, name: currentRest?.name });

      // 🎯 ACTUALIZACIÓN OPTIMISTA: Cambiar UI inmediatamente
      setRestaurants((prev) => {
        return prev.map((rest) => {
          if (rest.ownerId === currentUserId) {
            console.log("⚡ UPDATE OPTIMISTA:", { id: rest.id, ...patch });
            return { ...rest, ...patch };
          }
          return rest;
        });
      });

      const network = await NetInfo.fetch();

      if (network.isConnected) {
        try {
          console.log("📤 Actualizando restaurante en la API...");
          const result = await MenuService.upsertRestaurant(patch, currentRestaurantId);
          console.log("✅ Restaurante actualizado en API:", result.id);
          
          // Refrescar con datos del servidor para confirmar
          await fetchRestaurantsFromAPI(true);
        } catch (error) {
          console.error("⚠️ Error en API, guardando en cola offline", error);
          await addToSyncQueue("UPSERT_RESTAURANT", patch);
          // La actualización optimista ya se hizo, así que quedará en local hasta sincronizar
        }
      } else {
        console.log("📵 Sin internet, guardando en cola de sincronización");
        await addToSyncQueue("UPSERT_RESTAURANT", patch);
        // La actualización optimista ya se aplicó al estado local
      }
    },
    [currentUserId, restaurants, fetchRestaurantsFromAPI]
  );

  // --- 🍽️ OPERACIONES DEL MENÚ: PLATILLOS ---
  const addDish = useCallback(
    async (dish: Dish) => {
      if (!currentUserId) {
        console.error("❌ Usuario no autenticado");
        return;
      }

      const network = await NetInfo.fetch();

      if (network.isConnected) {
        try {
          console.log("📤 Agregando platillo...", dish.id);
          // Primero: Hacer API call
          await MenuService.addDish(dish);
          console.log("✅ Platillo agregado en API");
          
          // 🔥 ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (OPTIMISTA)
          setRestaurants((prev) => {
            return prev.map((rest) => {
              if (rest.ownerId === currentUserId) {
                const updatedMenu = [...(rest.menu || []), dish];
                console.log("⚡ UPDATE OPTIMISTA: Platillo añadido al estado local", dish.id);
                return { ...rest, menu: updatedMenu };
              }
              return rest;
            });
          });
          
          // 🔄 Refrescar en background sin bloquear (non-blocking)
          console.log("📥 Refrescando datos en background...");
          fetchRestaurantsFromAPI(true).catch((error) => {
            console.warn("⚠️ Fallo al refrescar datos, pero platillo ya está en estado local:", error);
          });
        } catch (error) {
          console.error("⚠️ Error en API, guardando en cola offline", error);
          await addToSyncQueue("ADD_DISH", {
            restaurantId: currentUserId,
            dish,
          });
        }
      } else {
        console.log("📵 Sin internet, guardando en cola");
        // 🔥 OPTIMISTIC UPDATE OFFLINE: Add immediately to local state
        setRestaurants((prev) => {
          return prev.map((rest) => {
            if (rest.ownerId === currentUserId) {
              const updatedMenu = [...(rest.menu || []), dish];
              console.log("⚡ UPDATE OPTIMISTA (OFFLINE): Platillo añadido", dish.id);
              return { ...rest, menu: updatedMenu };
            }
            return rest;
          });
        });
        await addToSyncQueue("ADD_DISH", {
          restaurantId: currentUserId,
          dish,
        });
      }
    },
    [currentUserId, fetchRestaurantsFromAPI]
  );

  const removeDish = useCallback(
    async (dishId: string) => {
      if (!currentUserId) {
        console.error("❌ Usuario no autenticado");
        return;
      }

      const network = await NetInfo.fetch();

      if (network.isConnected) {
        try {
          console.log("📤 Eliminando platillo...", dishId);
          // Primero: Hacer API call
          await MenuService.removeDish(dishId);
          console.log("✅ Platillo eliminado en API");
          
          // 🔥 ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (OPTIMISTA)
          setRestaurants((prev) => {
            return prev.map((rest) => {
              if (rest.ownerId === currentUserId) {
                const updatedMenu = (rest.menu || []).filter((d) => d.id !== dishId);
                console.log("⚡ UPDATE OPTIMISTA: Platillo eliminado del estado local", dishId);
                return { ...rest, menu: updatedMenu };
              }
              return rest;
            });
          });
          
          // 🔄 Refrescar en background sin bloquear (non-blocking)
          console.log("📥 Refrescando datos en background...");
          fetchRestaurantsFromAPI(true).catch((error) => {
            console.warn("⚠️ Fallo al refrescar datos, pero platillo ya está eliminado del estado local:", error);
          });
        } catch (error) {
          console.error("⚠️ Error en API, guardando en cola offline", error);
          await addToSyncQueue("REMOVE_DISH", {
            restaurantId: currentUserId,
            dishId,
          });
        }
      } else {
        console.log("📵 Sin internet, guardando en cola");
        // 🔥 OPTIMISTIC UPDATE OFFLINE: Remove immediately from local state
        setRestaurants((prev) => {
          return prev.map((rest) => {
            if (rest.ownerId === currentUserId) {
              const updatedMenu = (rest.menu || []).filter((d) => d.id !== dishId);
              console.log("⚡ UPDATE OPTIMISTA (OFFLINE): Platillo eliminado", dishId);
              return { ...rest, menu: updatedMenu };
            }
            return rest;
          });
        });
        await addToSyncQueue("REMOVE_DISH", {
          restaurantId: currentUserId,
          dishId,
        });
      }
    },
    [currentUserId, fetchRestaurantsFromAPI]
  );

  // --- 📢 OPERACIONES DE EVENTOS/ANUNCIOS ---
  const addOwnerEvent = useCallback(
    async (event: Omit<RestaurantEvent, "id">) => {
      if (!currentUserId) {
        console.error("❌ Usuario no autenticado");
        return;
      }

      // Si la imagen está en local, subirla primero
      let finalImageUrl = event.imageUrl;
      if (finalImageUrl && finalImageUrl.startsWith("file://")) {
        console.log("📸 Subiendo imagen del evento...");
        const uploadedUrl = await uploadRestaurantImage(finalImageUrl);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log("✅ Imagen del evento subida:", finalImageUrl);
        }
      }

      // Generar ID único para el evento
      const newEvent: RestaurantEvent = {
        id: Date.now().toString(),
        ...event,
        imageUrl: finalImageUrl,
      };

      const network = await NetInfo.fetch();

      if (network.isConnected) {
        try {
          console.log("📤 Creando evento en API...", newEvent);
          // Pasar el evento completo con ID
          await AnnouncementService.addAnnouncement(newEvent);
          console.log("✅ Evento creado en API");
          
          // 🔥 ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (OPTIMISTA)
          setRestaurants((prev) => {
            return prev.map((rest) => {
              if (rest.ownerId === currentUserId) {
                const updatedEvents = [...(rest.events || []), newEvent];
                console.log("⚡ UPDATE OPTIMISTA: Evento añadido al estado local", newEvent.id);
                return { ...rest, events: updatedEvents };
              }
              return rest;
            });
          });

          // 🔄 Refrescar en background sin bloquear (non-blocking)
          console.log("📥 Refrescando datos en background...");
          fetchRestaurantsFromAPI(true).catch((error) => {
            console.warn("⚠️ Fallo al refrescar datos, pero evento ya está en estado local:", error);
          });
        } catch (error) {
          console.error("⚠️ Error en API, guardando en cola offline", error);
          await addToSyncQueue("ADD_EVENT", {
            restaurantId: currentUserId,
            event: newEvent,
          });
        }
      } else {
        console.log("📵 Sin internet, guardando en cola");
        await addToSyncQueue("ADD_EVENT", {
          restaurantId: currentUserId,
          event: newEvent,
        });
      }
    },
    [currentUserId, fetchRestaurantsFromAPI, uploadRestaurantImage]
  );

  const removeOwnerEvent = useCallback(
    async (eventId: string) => {
      if (!currentUserId) {
        console.error("❌ Usuario no autenticado");
        return;
      }

      const network = await NetInfo.fetch();

      if (network.isConnected) {
        try {
          console.log("📤 Eliminando evento...");
          await AnnouncementService.removeAnnouncement(eventId);
          console.log("✅ Evento eliminado en API");
          
          // 🔥 ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE (OPTIMISTA)
          setRestaurants((prev) => {
            return prev.map((rest) => {
              if (rest.ownerId === currentUserId) {
                const updatedEvents = (rest.events || []).filter((e) => e.id !== eventId);
                console.log("⚡ UPDATE OPTIMISTA: Evento eliminado del estado local");
                return { ...rest, events: updatedEvents };
              }
              return rest;
            });
          });

          // 🔄 Refrescar en background sin bloquear
          console.log("📥 Refrescando datos en background...");
          fetchRestaurantsFromAPI(true).catch((error) => {
            console.warn("⚠️ Fallo al refrescar, pero evento ya fue eliminado localmente:", error);
          });
        } catch (error) {
          console.error("⚠️ Error en API, guardando en cola offline", error);
          await addToSyncQueue("REMOVE_EVENT", {
            restaurantId: currentUserId,
            eventId,
          });
        }
      } else {
        console.log("📵 Sin internet, guardando en cola");
        await addToSyncQueue("REMOVE_EVENT", {
          restaurantId: currentUserId,
          eventId,
        });
      }
    },
    [currentUserId, fetchRestaurantsFromAPI]
  );

  // --- 🗑️ OPERACIONES DE ELIMINACIÓN ---
  const deleteRestaurant = useCallback(
    async (restaurantId: string) => {
      try {
        console.log("📤 Eliminando restaurante:", restaurantId);
        await MenuService.deleteRestaurant(restaurantId);
        
        // Eliminar localmente
        setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
        await saveRestaurantsLocally(restaurants.filter((r) => r.id !== restaurantId));
        
        console.log("✅ Restaurante eliminado");
      } catch (error) {
        console.error("❌ Error al eliminar restaurante:", error);
        throw error;
      }
    },
    [restaurants]
  );

  const deleteAllRestaurants = useCallback(
    async () => {
      try {
        console.log("📤 Eliminando TODOS los restaurantes...");
        const result = await MenuService.deleteAllRestaurants();
        
        // Limpiar localmente
        setRestaurants([]);
        await saveRestaurantsLocally([]);
        
        console.log("✅ Todos los restaurantes eliminados:", result);
      } catch (error) {
        console.error("❌ Error al eliminar todos los restaurantes:", error);
        throw error;
      }
    },
    []
  );

  // --- VALOR DEL CONTEXTO ---
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
      uploadRestaurantImage,
      deleteRestaurant,
      deleteAllRestaurants,
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
      uploadRestaurantImage,
      deleteRestaurant,
      deleteAllRestaurants,
    ]
  );

  return (
    <RestaurantsContext.Provider value={value}>
      {children}
    </RestaurantsContext.Provider>
  );
};

// --- HOOK DE CONSUMO ---
export const useRestaurants = () => {
  const ctx = useContext(RestaurantsContext);
  if (!ctx)
    throw new Error(
      "useRestaurants debe usarse dentro de <RestaurantsProvider>"
    );
  return ctx;
};