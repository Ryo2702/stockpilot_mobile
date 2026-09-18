export const insightSnapshotsSchema = `
CREATE TABLE IF NOT EXISTS insight_snapshots (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS insight_snapshots_store_kind_created_idx
  ON insight_snapshots (store_id, kind, created_at DESC);`.trim();
