// src/services/menu.service.ts
import { doc, updateDoc, setDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";
import { Dish, Restaurant } from "../../types/restaurant.types";

export const MenuService = {
  /**
   * Actualiza datos generales del restaurante (Status, Menú completo, etc.)
   */
  async updateRestaurant(patch: Partial<Restaurant>) {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const docRef = doc(db, "restaurants", user.uid);

    // Sanitización básica: Eliminar undefined
    const payload: any = { ...patch, ownerId: user.uid };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    await setDoc(docRef, payload, { merge: true });
  },

  /**
   * Elimina un platillo del array de menú
   */
  async removeDish(dishId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const docRef = doc(db, "restaurants", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const currentMenu = (snap.data().menu as Dish[]) || [];
      const newMenu = currentMenu.filter((d) => d.id !== dishId);
      await updateDoc(docRef, { menu: newMenu });
    }
  },

  /**
   * Agrega un platillo nuevo
   */
  async addDish(dish: Dish) {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");

    const docRef = doc(db, "restaurants", user.uid);
    await updateDoc(docRef, {
      menu: arrayUnion(dish),
    });
  },
};