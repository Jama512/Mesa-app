import React, { useEffect } from "react";
import { useRealm, useQuery } from "./realm";
import { Restaurant } from "./models/RestaurantModel";
import { RESTAURANTS } from "../data/restaurants"; // Tus datos mock originales

export const RestaurantSeeder: React.FC = () => {
  const realm = useRealm();
  const existingRestaurants = useQuery(Restaurant);

  useEffect(() => {
    // Si la DB está vacía, inyectamos los datos de prueba
    if (existingRestaurants.length === 0) {
      realm.write(() => {
        RESTAURANTS.forEach((r) => {
          realm.create("Restaurant", {
            _id: r.id, // Asegúrate que tu mock use strings en id
            name: r.name,
            category: r.category,
            latitude: r.latitude,
            longitude: r.longitude,
            rating: 4.5,
            status: "Abierto ahora",
            features: { wifi: true, cardPayment: true },
            isOwnerRestaurant: false,
            images: [], // Inicializamos lista vacía
            createdAt: new Date(),
          });
        });
        console.log("🌱 Base de datos sembrada con éxito en Realm");
      });
    }
  }, []);

  return null;
};
