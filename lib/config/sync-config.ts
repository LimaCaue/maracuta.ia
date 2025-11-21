// Configuration for API synchronization

export const SYNC_CONFIG = {
    // API Base URLs
    CAMARA_API_BASE: 'https://dadosabertos.camara.leg.br/api/v2',
    SENADO_API_BASE: 'https://legis.senado.leg.br/dadosabertos',

    // Pagination
    DEFAULT_BATCH_SIZE: 100,
    MAX_BATCH_SIZE: 500,

    // Rate Limiting
    CAMARA_RATE_LIMIT: {
        requests: 10,
        perMilliseconds: 1000, // 10 requests per second
    },
    SENADO_RATE_LIMIT: {
        requests: 5,
        perMilliseconds: 1000, // 5 requests per second
    },

    // Retry Configuration
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    RETRY_BACKOFF_MULTIPLIER: 2,

    // Sync Settings
    INCREMENTAL_SYNC_DAYS: 7, // Only fetch proposals from last N days in incremental sync
    FULL_SYNC_BATCH_DELAY_MS: 500, // Delay between batches in full sync

    // Timeouts
    REQUEST_TIMEOUT_MS: 30000, // 30 seconds

    // Sync Schedule (for cron)
    SYNC_CRON_SCHEDULE: '0 2 * * *', // Daily at 2 AM
} as const

export type SyncConfig = typeof SYNC_CONFIG
