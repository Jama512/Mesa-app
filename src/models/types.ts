// src/models/types.ts

// ==========================================
// 1. TIPOS BASE
// ==========================================
/**
 * Interfaz base para entidades. 
 * En Firebase (Firestore), los IDs siempre son 'string' (alfanuméricos).
 * Eliminamos el 'number' del archivo viejo para evitar bugs en la nube.
 */
export interface BaseEntity {
  id: string;
}

// ==========================================
// 2. ENTIDADES DE USUARIO
// ==========================================
export interface User extends BaseEntity {
  fullName: string;
  email: string;
  // Nota: Aquí en el futuro puedes agregar role: 'owner' | 'client'
}

// ==========================================
// 3. ENTIDADES DEL MENÚ (Unificadas)
// ==========================================
export interface Category extends BaseEntity {
  title: string;
  image?: string; // Cambiamos 'any' por 'string' (URL de Firebase Storage)
}

/**
 * Fusión de 'FoodItem' (viejo) y 'Dish' (nuevo).
 * Ahora existe una única fuente de verdad para los platillos.
 */
export interface Dish extends BaseEntity {
  name: string;
  description: string;
  price: number; // Usamos number para poder sumar en el carrito después
  categoryId?: string; // Referencia al ID de la categoría (del archivo viejo)
  category?: string; // Nombre en texto (del archivo nuevo)
  image?: string; // URL de la imagen en Firebase
  isAvailable: boolean;
}

// ==========================================
// 4. ENTIDADES DEL RESTAURANTE Y EVENTOS
// ==========================================
export interface Announcement {
  id?: string; // Opcional porque al crearlo aún no tiene ID de Firebase
  title: string;
  dateLabel: string; // ¿Cuándo?
  description?: string;
  posterUri?: string; // Para la US 4.2 (Multimedia)
  createdAt?: Date;
}

export interface Restaurant extends BaseEntity {
  name: string;
  status: string;
  menu: Dish[];
  events?: Announcement[]; // Relación con los anuncios
  isOwnerRestaurant?: boolean;
}