// src/database/models/Settings.ts
import { Realm } from "@realm/react";

export class Settings extends Realm.Object<Settings> {
  _id!: Realm.BSON.ObjectId;
  theme!: string; // "light" | "dark"

  static generate(theme: "light" | "dark" = "light") {
    return {
      _id: new Realm.BSON.ObjectId(),
      theme,
    };
  }

  static schema: Realm.ObjectSchema = {
    name: "Settings",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      theme: "string",
    },
  };
}
