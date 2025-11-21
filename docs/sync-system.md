# API Synchronization System

This document describes the synchronization system for fetching legislative proposals from the official Brazilian Congress APIs.

## Overview

The sync system integrates with two official data sources:

1. **Câmara dos Deputados API**: `https://dadosabertos.camara.leg.br/api/v2/`
2. **Senado Federal API**: `https://legis.senado.leg.br/dadosabertos/`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Sync System Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Câmara API   │         │ Senado API   │                  │
│  │   (JSON)     │         │    (XML)     │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         ▼                        ▼                           │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ Câmara       │         │ Senado       │                  │
│  │ Client       │         │ Client       │                  │
│  │ - Rate Limit │         │ - XML Parser │                  │
│  │ - Retry      │         │ - Rate Limit │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         └────────┬───────────────┘                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │  Sync Service  │                                   │
│         │  - Orchestrate │                                   │
│         │  - Transform   │                                   │
│         │  - Deduplicate │                                   │
│         └────────┬───────┘                                   │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │   Supabase DB  │                                   │
│         │  - Proposals   │                                   │
│         │  - Sync Logs   │                                   │
│         └────────────────┘                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Clients

#### Câmara Client (`lib/api/camara-client.ts`)
- Fetches proposals from Câmara dos Deputados
- Handles JSON responses
- Implements rate limiting (10 req/sec)
- Supports pagination
- Provides async generators for efficient batch processing

#### Senado Client (`lib/api/senado-client.ts`)
- Fetches matérias from Senado Federal
- Parses XML responses to JSON
- Implements rate limiting (5 req/sec)
- Handles batch processing

### 2. Sync Service (`lib/services/sync-service.ts`)

Main orchestration service that:
- Coordinates data fetching from both APIs
- Transforms API responses to normalized format
- Detects and handles duplicates using `external_id`
- Manages database transactions
- Tracks sync operations in `sync_logs` table
- Supports both incremental and full sync modes

#### Sync Modes

**Incremental Sync** (default):
- Fetches only proposals from the last 7 days
- Fast and efficient for daily updates
- Recommended for scheduled cron jobs

**Full Sync**:
- Fetches all proposals
- Used for initial setup or data recovery
- Can take significant time due to large data volume

### 3. API Routes

#### `POST /api/sync`
Trigger manual synchronization.

**Query Parameters:**
- `source`: `'camara'` | `'senado'` | `'both'` (default: `'both'`)
- `incremental`: `'true'` | `'false'` (default: `'true'`)

**Example:**
```bash
# Incremental sync from both sources
curl -X POST http://localhost:3000/api/sync

# Full sync from Câmara only
curl -X POST "http://localhost:3000/api/sync?source=camara&incremental=false"
```

**Response:**
```json
{
  "success": true,
  "source": "both",
  "incremental": true,
  "result": {
    "camara": {
      "created": 45,
      "updated": 12,
      "total": 57
    },
    "senado": {
      "created": 23,
      "updated": 8,
      "total": 31
    }
  }
}
```

#### `GET /api/sync/status`
Get current sync status and history.

**Example:**
```bash
curl http://localhost:3000/api/sync/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "last_sync_camara": "2025-11-21T14:30:00Z",
    "last_sync_senado": "2025-11-21T14:30:00Z",
    "total_proposals": 1234,
    "camara_proposals": 856,
    "senado_proposals": 378,
    "is_syncing": false,
    "last_error": null
  },
  "recent_logs": [...]
}
```

#### `GET /api/cron/sync`
Automated sync endpoint for cron jobs.

**Security:**
Requires `Authorization: Bearer <CRON_SECRET>` header.

### 4. Database Schema

#### `legislative_proposals` Table
```sql
- id: UUID (primary key)
- external_id: TEXT (unique, format: "camara-123" or "senado-456")
- title: TEXT
- description: TEXT
- author: TEXT
- status: TEXT
- house: TEXT ('camara' or 'senado')
- proposal_type: TEXT
- presentation_date: TIMESTAMPTZ
- last_synced_at: TIMESTAMPTZ
- sync_source: TEXT ('camara' or 'senado')
- raw_data: JSONB (original API response)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `sync_logs` Table
```sql
- id: UUID (primary key)
- source: TEXT ('camara', 'senado', or 'both')
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
- status: TEXT ('running', 'completed', 'failed')
- proposals_fetched: INTEGER
- proposals_created: INTEGER
- proposals_updated: INTEGER
- error_message: TEXT
- created_at: TIMESTAMPTZ
```

## Configuration

All configuration is centralized in `lib/config/sync-config.ts`:

```typescript
{
  // API URLs
  CAMARA_API_BASE: 'https://dadosabertos.camara.leg.br/api/v2',
  SENADO_API_BASE: 'https://legis.senado.leg.br/dadosabertos',
  
  // Pagination
  DEFAULT_BATCH_SIZE: 100,
  
  // Rate Limiting
  CAMARA_RATE_LIMIT: { requests: 10, perMilliseconds: 1000 },
  SENADO_RATE_LIMIT: { requests: 5, perMilliseconds: 1000 },
  
  // Retry
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // Sync
  INCREMENTAL_SYNC_DAYS: 7,
}
```

## Setup Instructions

### 1. Database Migration

Run the migration to add sync metadata fields:

```bash
# Apply migration to Supabase
# Copy contents of scripts/002_add_sync_metadata.sql
# and run in Supabase SQL Editor
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Supabase credentials (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron secret for automated syncs
CRON_SECRET=your-random-secret-key
```

### 3. Initial Sync

Run an initial full sync to populate the database:

```bash
# Using curl
curl -X POST "http://localhost:3000/api/sync?incremental=false"

# Or visit in browser (for development)
# http://localhost:3000/api/sync?incremental=false
```

**Note:** Initial sync may take 10-30 minutes depending on data volume.

### 4. Automated Syncs

The system is configured to run daily at 2 AM via Vercel Cron Jobs.

**Vercel Configuration:**
1. The `vercel.json` file is already configured
2. Set the `CRON_SECRET` environment variable in Vercel dashboard
3. Deploy to Vercel
4. Cron will automatically run daily

**Alternative Scheduling:**
If not using Vercel, you can use any cron service to call:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/sync
```

## Monitoring

### Check Sync Status

```bash
curl http://localhost:3000/api/sync/status
```

### View Recent Sync Logs

Query the `sync_logs` table in Supabase:

```sql
SELECT * FROM sync_logs 
ORDER BY started_at DESC 
LIMIT 10;
```

### Monitor Queue Status

The API clients expose queue statistics for monitoring:

```typescript
import { camaraClient, senadoClient } from '@/lib/api'

console.log(camaraClient.getQueueStats())
console.log(senadoClient.getQueueStats())
```

## Troubleshooting

### Sync Fails with Timeout Error

- Increase `REQUEST_TIMEOUT_MS` in `sync-config.ts`
- Check network connectivity
- Verify API endpoints are accessible

### Rate Limit Errors

- Reduce `CAMARA_RATE_LIMIT` or `SENADO_RATE_LIMIT`
- Increase `FULL_SYNC_BATCH_DELAY_MS`

### Duplicate Proposals

The system automatically handles duplicates using `external_id`. If you see duplicates:

1. Check `external_id` format in database
2. Verify unique constraint exists
3. Review upsert logic in `sync-service.ts`

### Memory Issues During Full Sync

- Reduce `DEFAULT_BATCH_SIZE`
- Use incremental sync instead
- Run sync during off-peak hours

## API Documentation

### Câmara dos Deputados
- **Docs**: https://dadosabertos.camara.leg.br/swagger/api.html
- **Format**: JSON
- **Rate Limit**: ~10 requests/second (recommended)

### Senado Federal
- **Docs**: https://legis.senado.leg.br/dadosabertos/
- **Format**: XML
- **Rate Limit**: ~5 requests/second (recommended)

## Performance Considerations

1. **Incremental Sync**: Use for daily updates (fast, ~1-2 minutes)
2. **Full Sync**: Use sparingly (slow, ~10-30 minutes)
3. **Batch Processing**: Async generators prevent memory issues
4. **Rate Limiting**: Prevents API throttling
5. **Retry Logic**: Handles transient failures automatically

## Future Enhancements

- [ ] Add webhook support for real-time updates
- [ ] Implement delta sync (only changed proposals)
- [ ] Add proposal detail fetching (authors, votes, etc.)
- [ ] Create admin dashboard for sync management
- [ ] Add email notifications for sync failures
- [ ] Implement proposal change detection and alerts
