# Vox Sentinel - API Synchronization System

## Quick Start Guide

### 1. Install Dependencies ✅
Already completed! The following packages were installed:
- `xml2js` - XML parsing for Senado API
- `p-retry` - Retry logic with exponential backoff
- `p-queue` - Rate limiting for API requests

### 2. Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of scripts/002_add_sync_metadata.sql
```

Or run it directly:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `scripts/002_add_sync_metadata.sql`
4. Execute the query

### 3. Environment Variables

Make sure your `.env.local` has:

```bash
# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For automated cron syncs (optional)
CRON_SECRET=your-random-secret-key
```

### 4. Test the Sync System

#### Option A: Using the Browser
Visit: `http://localhost:3000/api/sync?source=both&incremental=true`

#### Option B: Using curl
```bash
# Incremental sync (last 7 days)
curl -X POST http://localhost:3000/api/sync

# Full sync from both sources (takes longer)
curl -X POST "http://localhost:3000/api/sync?source=both&incremental=false"
```

#### Option C: Check Status First
```bash
curl http://localhost:3000/api/sync/status
```

### 5. Monitor Sync Progress

Check the sync logs in Supabase:
```sql
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10;
```

View synced proposals:
```sql
SELECT 
  sync_source,
  COUNT(*) as count,
  MAX(last_synced_at) as last_sync
FROM legislative_proposals 
GROUP BY sync_source;
```

## API Endpoints

### POST /api/sync
Trigger manual synchronization

**Query Parameters:**
- `source`: `camara` | `senado` | `both` (default: `both`)
- `incremental`: `true` | `false` (default: `true`)

**Examples:**
```bash
# Incremental sync from both
curl -X POST http://localhost:3000/api/sync

# Full sync from Câmara only
curl -X POST "http://localhost:3000/api/sync?source=camara&incremental=false"
```

### GET /api/sync/status
Get sync status and history

```bash
curl http://localhost:3000/api/sync/status
```

## Automated Syncs

The system is configured to run daily at 2 AM via Vercel Cron Jobs.

**To enable:**
1. Deploy to Vercel
2. Set `CRON_SECRET` environment variable in Vercel
3. Cron will automatically run daily

## Documentation

- **Full Documentation**: [docs/sync-system.md](docs/sync-system.md)
- **Implementation Walkthrough**: See walkthrough.md artifact
- **Database Schema**: [scripts/002_add_sync_metadata.sql](scripts/002_add_sync_metadata.sql)

## What Was Built

✅ **API Clients**
- Câmara dos Deputados API client (JSON)
- Senado Federal API client (XML)
- Rate limiting and retry logic
- Efficient batch processing

✅ **Sync Service**
- Orchestrates data fetching
- Handles duplicates
- Tracks sync operations
- Supports incremental and full sync

✅ **API Routes**
- `/api/sync` - Manual sync trigger
- `/api/sync/status` - Status monitoring
- `/api/cron/sync` - Automated sync endpoint

✅ **Database Schema**
- Added sync metadata fields
- Created sync_logs table
- Optimized indexes

✅ **Automation**
- Vercel Cron configuration
- Daily automated syncs

## Troubleshooting

### Sync takes too long
- Use incremental sync instead of full sync
- Reduce batch size in `lib/config/sync-config.ts`

### Rate limit errors
- Adjust rate limits in `lib/config/sync-config.ts`
- Increase delays between batches

### Database errors
- Ensure migration was run successfully
- Check Supabase connection
- Verify RLS policies allow inserts

## Next Steps

1. **Run the database migration** (step 2 above)
2. **Trigger an initial sync** to populate data
3. **Verify proposals** appear in your database
4. **Deploy to Vercel** for automated syncs

For detailed information, see [docs/sync-system.md](docs/sync-system.md)
