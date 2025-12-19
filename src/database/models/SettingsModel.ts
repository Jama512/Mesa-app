// src/database/models/SettingsModel.ts
import Realm from "realm";

export class Settings extends Realm.Object<Settings> {
  _id!: string; // "app"

  themeName!: "light" | "dark";

  lastSyncAt?: Date; // para cuando conectes firebase/mongo/realm sync
  offlineEnabled!: boolean;

  static schema: Realm.ObjectSchema = {
    name: "Settings",
    primaryKey: "_id",
    properties: {
      _id: "string",
      themeName: { type: "string", default: "light" },
      lastSyncAt: "date?",
      offlineEnabled: { type: "bool", default: true },
    },
  };
}
