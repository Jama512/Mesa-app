// src/services/announcement.service.ts
import { db } from "../config/firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Announcement } from "../models/types";

export const AnnouncementService = {
  /**
   * Agrega un nuevo anuncio al array de eventos del restaurante del dueño.
   */
  addAnnouncement: async (ownerUid: string, announcement: Announcement) => {
    try {
      // Referencia al documento del restaurante usando el UID del dueño
      const restaurantRef = doc(db, "restaurants", ownerUid);

      await updateDoc(restaurantRef, {
        events: arrayUnion({
          ...announcement,
          id: Date.now().toString(), // Generamos un ID único para el objeto dentro del array
        }),
      });
      
      return true;
    } catch (error) {
      console.error("Error en AnnouncementService:", error);
      throw error;
    }
  },
};