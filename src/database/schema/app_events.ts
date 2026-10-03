export const appEventsSchema = `
CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS app_events_created_idx
  ON app_events (created_at DESC, id DESC);`.trim();
