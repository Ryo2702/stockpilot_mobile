import type { SQLiteDatabase } from "expo-sqlite";

import createId from "@/utils/createId";

export type EventProperty = string | number | boolean | null;
export type EventProperties = Record<string, EventProperty>;

type EventDatabase = Pick<SQLiteDatabase, "runAsync">;

export async function trackAppEvent(
  db: EventDatabase,
  eventName: string,
  properties: EventProperties = {},
) {
  const name = eventName.trim();
  if (!name) return;

  try {
    await db.runAsync(
      `INSERT INTO app_events (id, event_name, properties_json, created_at)
       VALUES (?, ?, ?, ?)`,
      createId("event"),
      name,
      JSON.stringify(properties),
      new Date().toISOString(),
    );
  } catch {
    // ponytail: event logging is non-critical; never block the action being tracked.
  }
}
