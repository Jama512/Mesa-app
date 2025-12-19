// src/database/models/EventModel.ts
import Realm from "realm";

export class Event extends Realm.Object<Event> {
  _id!: Realm.BSON.ObjectId;
  restaurantId!: string; // referencia a Restaurant._id

  title!: string;
  dateLabel!: string; // texto visible (Ej. "Hoy · 8:00 PM")
  description?: string;

  createdAt!: Date;
  updatedAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: "Event",
    primaryKey: "_id",
    properties: {
      _id: "objectId",

      restaurantId: "string",

      title: "string",
      dateLabel: "string",
      description: { type: "string", optional: true },

      createdAt: { type: "date", default: () => new Date() },
      updatedAt: { type: "date", optional: true },
    },
  };
}
