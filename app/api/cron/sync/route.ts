import { NextRequest, NextResponse } from 'next/server'
import { syncService } from '@/lib/services/sync-service'

/**
 * GET /api/cron/sync - Cron endpoint for automated synchronization
 * 
 * This endpoint should be called by Vercel Cron Jobs or similar scheduling service.
 * 
 * To configure in Vercel:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/sync",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 * 
 * 2. Set environment variable:
 *    CRON_SECRET=your-secret-key
 * 
 * 3. The cron job will run daily at 2 AM
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('Cron job triggered: Starting automated sync')

        // Run incremental sync from both sources
        const result = await syncService.syncAll({
            incrementalOnly: true,
        })

        console.log('Cron job completed:', result)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            result,
        })
    } catch (error) {
        console.error('Cron sync error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        )
    }
}
