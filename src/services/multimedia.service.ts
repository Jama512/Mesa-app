import { storage } from "../config/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const MultimediaService = {
  // Ahora recibe la carpeta, el ID del dueño y la ruta de la imagen
  uploadImage: async (uri: string, folder: string, ownerId: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // Creamos una ruta dinámica: carpeta/ID_DUEÑO/fecha.jpg
      const storageRef = ref(storage, `${folder}/${ownerId}/${Date.now()}.jpg`);

      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error subiendo multimedia:", error);
      throw new Error("No se pudo subir la imagen a la nube.");
    }
  }
};