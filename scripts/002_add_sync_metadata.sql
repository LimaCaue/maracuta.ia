-- Migration: Add sync metadata fields to legislative_proposals table

-- Add new columns for sync tracking
ALTER TABLE legislative_proposals
ADD COLUMN IF NOT EXISTS presentation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_source TEXT CHECK (sync_source IN ('camara', 'senado')),
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('camara', 'senado', 'both')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  proposals_fetched INTEGER DEFAULT 0,
  proposals_created INTEGER DEFAULT 0,
  proposals_updated INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_sync_source ON legislative_proposals(sync_source);
CREATE INDEX IF NOT EXISTS idx_proposals_last_synced ON legislative_proposals(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_presentation_date ON legislative_proposals(presentation_date DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Enable RLS on sync_logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Public read policy for sync logs
CREATE POLICY "Anyone can view sync logs" ON sync_logs FOR SELECT USING (true);

-- Comment on new columns
COMMENT ON COLUMN legislative_proposals.presentation_date IS 'Date when the proposal was presented to Congress';
COMMENT ON COLUMN legislative_proposals.last_synced_at IS 'Timestamp of the last synchronization from the API';
COMMENT ON COLUMN legislative_proposals.sync_source IS 'Source API: camara or senado';
COMMENT ON COLUMN legislative_proposals.raw_data IS 'Original API response data in JSON format';
