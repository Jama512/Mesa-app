// src/database/models/RestaurantModel.ts
import Realm from "realm";

export class Restaurant extends Realm.Object<Restaurant> {
  _id!: string;

  name!: string;
  category!: string;

  latitude?: number;
  longitude?: number;

  address?: string;
  phone?: string;
  description?: string;

  rating?: number;
  status?: string;

  wifi?: boolean;
  outdoorSeating?: boolean;
  parking?: boolean;
  reservations?: boolean;
  delivery?: boolean;
  cardPayment?: boolean;

  images!: Realm.List<string>;
  isOwnerRestaurant!: boolean;

  createdAt!: Date;
  updatedAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: "Restaurant",
    primaryKey: "_id",
    properties: {
      _id: "string",

      name: "string",
      category: "string",

      latitude: { type: "double", optional: true },
      longitude: { type: "double", optional: true },

      address: { type: "string", optional: true },
      phone: { type: "string", optional: true },
      description: { type: "string", optional: true },

      rating: { type: "double", optional: true },
      status: { type: "string", optional: true },

      wifi: { type: "bool", optional: true },
      outdoorSeating: { type: "bool", optional: true },
      parking: { type: "bool", optional: true },
      reservations: { type: "bool", optional: true },
      delivery: { type: "bool", optional: true },
      cardPayment: { type: "bool", optional: true },

      images: { type: "list", objectType: "string" },

      isOwnerRestaurant: { type: "bool", default: false },

      createdAt: { type: "date", default: () => new Date() },
      updatedAt: { type: "date", optional: true },
    },
  };
}
