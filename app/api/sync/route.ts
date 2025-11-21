import { NextRequest, NextResponse } from 'next/server'
import { syncService } from '@/lib/services/sync-service'

/**
 * POST /api/sync - Trigger synchronization
 * Query params:
 *   - source: 'camara' | 'senado' | 'both' (default: 'both')
 *   - incremental: 'true' | 'false' (default: 'true')
 */
export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const source = searchParams.get('source') || 'both'
        const incremental = searchParams.get('incremental') !== 'false'

        console.log(`Starting sync: source=${source}, incremental=${incremental}`)

        const options = {
            incrementalOnly: incremental,
        }

        let result

        switch (source) {
            case 'camara':
                result = await syncService.syncCamaraProposals(options)
                break
            case 'senado':
                result = await syncService.syncSenadoMaterias(options)
                break
            case 'both':
                result = await syncService.syncAll(options)
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid source parameter. Must be: camara, senado, or both' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            source,
            incremental,
            result,
        })
    } catch (error) {
        console.error('Sync error:', error)

        // Return more detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorStack = error instanceof Error ? error.stack : undefined

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: errorStack,
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/sync - Get sync status
 */
export async function GET() {
    try {
        const status = await syncService.getSyncStatus()
        const recentLogs = await syncService.getRecentSyncLogs(5)

        return NextResponse.json({
            success: true,
            status,
            recent_logs: recentLogs,
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
