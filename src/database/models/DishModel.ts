import Realm from "realm";

export class Dish extends Realm.Object<Dish> {
  _id!: string; // ✅ Usamos _id (con guion bajo)
  restaurantId!: string; // ✅ Agregamos restaurantId

  name!: string;
  price!: number;
  description?: string;
  isAvailable!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: "Dish",
    primaryKey: "_id",
    properties: {
      _id: "string",
      restaurantId: { type: "string", indexed: true },
      name: "string",
      price: "double",
      description: "string?",
      isAvailable: { type: "bool", default: true },
      createdAt: { type: "date", default: () => new Date() },
    },
  };
}
