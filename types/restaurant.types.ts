// src/types/restaurant.types.ts


export interface RestaurantBase {
  id: string;
  name: string;
  category: string;
  latitude?: number; // Lo pongo opcional por si acaso
  longitude?: number;
}


export type Dish = {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable?: boolean;
};

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


export interface Restaurant extends RestaurantBase {
  address?: string;
  phone?: string;
  description?: string;
  rating?: number;
  status?: string; // "Abierto ahora" | "Cerrado"
  features?: RestaurantFeatures;
  images?: string[];
  events?: RestaurantEvent[];
  menu?: Dish[]; // ✅ Aquí está la clave: El restaurante tiene un menú
  isOwnerRestaurant?: boolean;
  ownerId?: string;
}