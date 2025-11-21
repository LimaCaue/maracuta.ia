# Database Setup Instructions

## The sync is failing because the database migration hasn't been run yet.

### Step 1: Run the Migration in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `scripts/002_add_sync_metadata.sql`
5. Click **Run** or press `Cmd+Enter`

### Step 2: Verify the Migration

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if sync_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sync_logs';

-- Check if new columns exist in legislative_proposals
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'legislative_proposals' 
AND column_name IN ('presentation_date', 'last_synced_at', 'sync_source', 'raw_data');
```

Expected results:
- First query should return: `sync_logs`
- Second query should return 4 rows with the column names

### Step 3: Test the Sync Again

After running the migration, test the sync:

```bash
curl -X POST "http://localhost:3000/api/sync?source=camara&incremental=true"
```

---

## Quick Migration Script

If you prefer, here's the complete migration SQL:

\`\`\`sql
-- Add new columns to legislative_proposals
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_sync_source ON legislative_proposals(sync_source);
CREATE INDEX IF NOT EXISTS idx_proposals_last_synced ON legislative_proposals(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_presentation_date ON legislative_proposals(presentation_date DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started ON sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can view sync logs" ON sync_logs FOR SELECT USING (true);
\`\`\`

Copy this entire block and run it in Supabase SQL Editor.
