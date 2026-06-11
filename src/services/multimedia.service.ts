/**
 * src/services/multimedia.service.ts
 * Servicio centralizado para subida de imágenes
 */
import * as FileSystem from "expo-file-system/legacy";
import { getLocalSession } from "./database.service";
import { API_ENDPOINTS, getHeaders } from "../config/api.config";

export const MultimediaService = {
  /**
   * Sube una imagen al servidor FastAPI mediante multipart/form-data
   * Funciona correctamente con Expo usando FileSystem.uploadAsync
   */
  uploadImage: async (uri: string): Promise<string> => {
    try {
      const session = await getLocalSession();
      if (!session?.token) throw new Error("No autenticado");

      // Preparamos el nombre del archivo
      const filename = uri.split("/").pop() || `upload_${Date.now()}.jpg`;

      // Usamos FileSystem.uploadAsync que está optimizado para Expo
      // uploadType: 1 = multipart/form-data
      const response = await FileSystem.uploadAsync(
        API_ENDPOINTS.UPLOAD_IMAGE,
        uri,
        {
          uploadType: 1, // 1 = multipart (no string, debe ser número)
          fieldName: "file", // Debe coincidir con el parámetro en FastAPI
          mimeType: "image/jpeg",
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );

      if (response.status !== 200) {
        console.error("Error del servidor al subir imagen:", response.body);
        throw new Error("Error al subir la imagen al servidor");
      }

      const data = JSON.parse(response.body);

      // El servidor devuelve algo como: { "url": "http://..." } o { "filename": "..." }
      return data.url || data.filename || data.path;
    } catch (error) {
      console.error("Error subiendo multimedia:", error);
      throw new Error("No se pudo subir la imagen al servidor.");
    }
  },
};