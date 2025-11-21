import { NextRequest, NextResponse } from 'next/server'
import { syncService } from '@/lib/services/sync-service'

/**
 * GET /api/sync/status - Get detailed sync status
 */
export async function GET() {
    try {
        const status = await syncService.getSyncStatus()
        const recentLogs = await syncService.getRecentSyncLogs(10)

        return NextResponse.json({
            success: true,
            status,
            recent_logs: recentLogs,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error getting sync status:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
