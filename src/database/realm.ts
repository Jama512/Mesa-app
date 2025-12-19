// src/database/realm.ts
import { createRealmContext } from "@realm/react";
import { Settings } from "./models/SettingsModel";
import { Restaurant } from "./models/RestaurantModel";
import { Event } from "./models/EventModel";
import { Dish } from "./models/DishModel";

export const RealmContext = createRealmContext({
  schema: [Settings, Restaurant, Event, Dish],
  schemaVersion: 2,
});

export const { RealmProvider, useRealm, useQuery, useObject } = RealmContext;
