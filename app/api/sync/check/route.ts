import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/sync/check - Check if database is ready for sync
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const checks = {
            sync_logs_table: false,
            proposals_columns: {
                presentation_date: false,
                last_synced_at: false,
                sync_source: false,
                raw_data: false,
            },
            can_insert_sync_log: false,
            error: null as string | null,
        }

        // Check if sync_logs table exists by trying to query it
        try {
            const { error: syncLogsError } = await supabase
                .from('sync_logs')
                .select('id')
                .limit(1)

            if (!syncLogsError) {
                checks.sync_logs_table = true
            } else {
                checks.error = `sync_logs table error: ${syncLogsError.message}`
            }
        } catch (error) {
            checks.error = `sync_logs table check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }

        // Check if we can query legislative_proposals with new columns
        try {
            const { data, error: proposalsError } = await supabase
                .from('legislative_proposals')
                .select('presentation_date, last_synced_at, sync_source, raw_data')
                .limit(1)

            if (!proposalsError) {
                checks.proposals_columns.presentation_date = true
                checks.proposals_columns.last_synced_at = true
                checks.proposals_columns.sync_source = true
                checks.proposals_columns.raw_data = true
            } else {
                if (!checks.error) {
                    checks.error = `proposals columns error: ${proposalsError.message}`
                }
            }
        } catch (error) {
            if (!checks.error) {
                checks.error = `proposals columns check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        }

        const allChecksPass =
            checks.sync_logs_table &&
            checks.proposals_columns.presentation_date &&
            checks.proposals_columns.last_synced_at &&
            checks.proposals_columns.sync_source &&
            checks.proposals_columns.raw_data

        return NextResponse.json({
            ready: allChecksPass,
            checks,
            message: allChecksPass
                ? '✅ Database is ready for sync!'
                : '❌ Database migration required. See DATABASE_SETUP.md',
        })
    } catch (error) {
        return NextResponse.json(
            {
                ready: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: '❌ Failed to check database. Ensure Supabase is configured correctly.',
            },
            { status: 500 }
        )
    }
}
