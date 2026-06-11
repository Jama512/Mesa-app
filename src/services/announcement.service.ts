/**
 * src/services/announcement.service.ts
 * Servicio centralizado para operaciones de eventos/anuncios
 */
import { RestaurantEvent, Announcement } from "../models/types";
import { getLocalSession } from "./database.service";
import { API_ENDPOINTS, getHeaders } from "../config/api.config";
import { generateUUID } from "../utils/uuid";

export const AnnouncementService = {
  /**
   * Crea un nuevo anuncio/evento en el restaurante del propietario
   */
  async addAnnouncement(announcement: RestaurantEvent): Promise<void> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      // El evento ya viene con ID, solo enviamos el payload
      const response = await fetch(API_ENDPOINTS.EVENTS_ADD, {
        method: "POST",
        headers: getHeaders(session.token),
        body: JSON.stringify(announcement),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error HTTP ${response.status}`);
      }

      console.log("✅ AnnouncementService: Evento guardado exitosamente");
    } catch (error) {
      console.error("Error en AnnouncementService.addAnnouncement:", error);
      throw error;
    }
  },

  /**
   * Obtiene eventos del restaurante
   */
  async getEvents(restaurantId: string): Promise<RestaurantEvent[]> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.EVENTS_UPDATE(restaurantId), {
        method: "GET",
        headers: getHeaders(session.token),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error("Error en AnnouncementService.getEvents:", error);
      return [];
    }
  },

  /**
   * Actualiza un anuncio/evento existente
   */
  async updateAnnouncement(
    eventId: string,
    patch: Partial<RestaurantEvent>
  ): Promise<RestaurantEvent> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.EVENTS_UPDATE(eventId), {
        method: "PATCH",
        headers: getHeaders(session.token),
        body: JSON.stringify(patch),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Error en AnnouncementService.updateAnnouncement:", error);
      throw error;
    }
  },

  /**
   * Elimina un anuncio/evento
   */
  async removeAnnouncement(eventId: string): Promise<void> {
    const session = await getLocalSession();
    if (!session?.token) throw new Error("No autenticado");

    try {
      const response = await fetch(API_ENDPOINTS.EVENTS_DELETE(eventId), {
        method: "DELETE",
        headers: getHeaders(session.token),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
    } catch (error) {
      console.error("Error en AnnouncementService.removeAnnouncement:", error);
      throw error;
    }
  },
};