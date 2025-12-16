// src/database/realm.ts
import { createRealmContext } from "@realm/react";
import { Settings } from "./models/SettingsModel";

export const RealmContext = createRealmContext({
  schema: [Settings],
  schemaVersion: 1,
});

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;
