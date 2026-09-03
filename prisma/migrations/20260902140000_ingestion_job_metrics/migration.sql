-- Add structured scrape metrics (per-board timings, provider rollups) to ingestion jobs
ALTER TABLE "IngestionJob" ADD COLUMN "metrics" JSONB;
