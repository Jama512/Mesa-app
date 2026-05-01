import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Inicializamos el SDK de Admin para tener permisos de borrar en Storage
admin.initializeApp();

export const cleanOrphanImages = onDocumentUpdated("restaurants/{restaurantId}", async (event) => {
  // En v2, los datos vienen dentro de event.data
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  // Verificamos que los datos existan para que TypeScript no marque error
  if (!beforeData || !afterData) return;

  const beforeMenu = beforeData.menu || [];
  const afterMenu = afterData.menu || [];

  // Si el menú de antes tenía más platillos que el de ahora, significa que borraron uno
  if (beforeMenu.length > afterMenu.length) {
    const bucket = admin.storage().bucket();
    
    // Buscamos cuál fue el platillo que eliminaron
    for (const oldDish of beforeMenu) {
      const stillExists = afterMenu.some((newDish: any) => newDish.id === oldDish.id);
      
      // Si ya no existe y tenía una imagen, la borramos del Storage
      if (!stillExists && oldDish.imageUri) {
        console.log(`Eliminando imagen del platillo: ${oldDish.name}`);
        
        try {
          // Extraemos la ruta real del archivo a partir de la URL de Firebase
          const fileUrl = oldDish.imageUri;
          const encodedPath = fileUrl.split('/o/')[1].split('?alt=')[0];
          const filePath = decodeURIComponent(encodedPath);
          
          // Borramos el archivo
          await bucket.file(filePath).delete();
          console.log(`Imagen huérfana borrada con éxito: ${filePath}`);
        } catch (error) {
          console.error("Error al intentar borrar la imagen en Storage:", error);
        }
      }
    }
  }
});