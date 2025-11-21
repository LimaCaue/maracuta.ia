import { createServiceClient as createClient } from '@/lib/supabase/service'
import { camaraClient } from '@/lib/api/camara-client'
import { senadoClient } from '@/lib/api/senado-client'
import {
    LegislativeProposal,
    CamaraProposal,
    SenadoMateria,
    SyncLog,
    SyncOptions,
} from '@/lib/api/types'
import { SYNC_CONFIG } from '@/lib/config/sync-config'

/**
 * Service for synchronizing legislative proposals from official APIs
 */
export class SyncService {
    /**
     * Sync proposals from Câmara dos Deputados
     */
    async syncCamaraProposals(
        options: SyncOptions = {}
    ): Promise<{ created: number; updated: number; total: number }> {
        const syncLog = await this.createSyncLog('camara')

        try {
            let created = 0
            let updated = 0
            let total = 0

            const supabase = createClient()

            // Determine if this is an incremental or full sync
            const isIncremental = options.incrementalOnly ?? true

            if (isIncremental) {
                console.log(
                    `Starting incremental sync for Câmara (last ${SYNC_CONFIG.INCREMENTAL_SYNC_DAYS} days)`
                )
                const proposals = await camaraClient.fetchRecentProposals(
                    SYNC_CONFIG.INCREMENTAL_SYNC_DAYS
                )
                total = proposals.length

                for (const proposal of proposals) {
                    const result = await this.upsertCamaraProposal(proposal, supabase)
                    if (result === 'created') created++
                    else if (result === 'updated') updated++
                }
            } else {
                console.log('Starting full sync for Câmara')

                for await (const batch of camaraClient.fetchAllProposals({
                    startDate: options.startDate,
                    endDate: options.endDate,
                })) {
                    total += batch.length

                    for (const proposal of batch) {
                        const result = await this.upsertCamaraProposal(proposal, supabase)
                        if (result === 'created') created++
                        else if (result === 'updated') updated++
                    }

                    console.log(
                        `Processed ${total} Câmara proposals (${created} created, ${updated} updated)`
                    )
                }
            }

            await this.completeSyncLog(syncLog.id, {
                proposals_fetched: total,
                proposals_created: created,
                proposals_updated: updated,
            })

            console.log(
                `Câmara sync completed: ${total} fetched, ${created} created, ${updated} updated`
            )

            return { created, updated, total }
        } catch (error) {
            await this.failSyncLog(
                syncLog.id,
                error instanceof Error ? error.message : 'Unknown error'
            )
            throw error
        }
    }

    /**
     * Sync matérias from Senado Federal
     */
    async syncSenadoMaterias(
        options: SyncOptions = {}
    ): Promise<{ created: number; updated: number; total: number }> {
        const syncLog = await this.createSyncLog('senado')

        try {
            let created = 0
            let updated = 0
            let total = 0

            const supabase = createClient()

            // Determine if this is an incremental or full sync
            const isIncremental = options.incrementalOnly ?? true

            if (isIncremental) {
                console.log(
                    `Starting incremental sync for Senado (last ${SYNC_CONFIG.INCREMENTAL_SYNC_DAYS} days)`
                )
                const materias = await senadoClient.fetchRecentMaterias(
                    SYNC_CONFIG.INCREMENTAL_SYNC_DAYS
                )
                total = materias.length

                for (const materia of materias) {
                    const result = await this.upsertSenadoMateria(materia, supabase)
                    if (result === 'created') created++
                    else if (result === 'updated') updated++
                }
            } else {
                console.log('Starting full sync for Senado')

                for await (const batch of senadoClient.fetchAllMaterias({
                    tramitando: true,
                    batchSize: options.batchSize,
                })) {
                    total += batch.length

                    for (const materia of batch) {
                        const result = await this.upsertSenadoMateria(materia, supabase)
                        if (result === 'created') created++
                        else if (result === 'updated') updated++
                    }

                    console.log(
                        `Processed ${total} Senado matérias (${created} created, ${updated} updated)`
                    )
                }
            }

            await this.completeSyncLog(syncLog.id, {
                proposals_fetched: total,
                proposals_created: created,
                proposals_updated: updated,
            })

            console.log(
                `Senado sync completed: ${total} fetched, ${created} created, ${updated} updated`
            )

            return { created, updated, total }
        } catch (error) {
            await this.failSyncLog(
                syncLog.id,
                error instanceof Error ? error.message : 'Unknown error'
            )
            throw error
        }
    }

    /**
     * Sync from both sources
     */
    async syncAll(
        options: SyncOptions = {}
    ): Promise<{
        camara: { created: number; updated: number; total: number }
        senado: { created: number; updated: number; total: number }
    }> {
        const syncLog = await this.createSyncLog('both')

        try {
            console.log('Starting full sync from both Câmara and Senado')

            const [camaraResult, senadoResult] = await Promise.all([
                this.syncCamaraProposals(options),
                this.syncSenadoMaterias(options),
            ])

            await this.completeSyncLog(syncLog.id, {
                proposals_fetched: camaraResult.total + senadoResult.total,
                proposals_created: camaraResult.created + senadoResult.created,
                proposals_updated: camaraResult.updated + senadoResult.updated,
            })

            return {
                camara: camaraResult,
                senado: senadoResult,
            }
        } catch (error) {
            await this.failSyncLog(
                syncLog.id,
                error instanceof Error ? error.message : 'Unknown error'
            )
            throw error
        }
    }

    /**
     * Get sync status and statistics
     */
    async getSyncStatus() {
        const supabase = createClient()

        // Get last sync times
        const { data: lastCamaraSync } = await supabase
            .from('sync_logs')
            .select('completed_at')
            .eq('source', 'camara')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        const { data: lastSenadoSync } = await supabase
            .from('sync_logs')
            .select('completed_at')
            .eq('source', 'senado')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        // Get proposal counts
        const { count: totalProposals } = await supabase
            .from('legislative_proposals')
            .select('*', { count: 'exact', head: true })

        const { count: camaraProposals } = await supabase
            .from('legislative_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('sync_source', 'camara')

        const { count: senadoProposals } = await supabase
            .from('legislative_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('sync_source', 'senado')

        // Check if sync is currently running
        const { data: runningSyncs } = await supabase
            .from('sync_logs')
            .select('*')
            .eq('status', 'running')

        // Get last error
        const { data: lastError } = await supabase
            .from('sync_logs')
            .select('error_message, started_at')
            .eq('status', 'failed')
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

        return {
            last_sync_camara: lastCamaraSync?.completed_at || null,
            last_sync_senado: lastSenadoSync?.completed_at || null,
            total_proposals: totalProposals || 0,
            camara_proposals: camaraProposals || 0,
            senado_proposals: senadoProposals || 0,
            is_syncing: (runningSyncs?.length || 0) > 0,
            last_error: lastError?.error_message || null,
        }
    }

    /**
     * Get recent sync logs
     */
    async getRecentSyncLogs(limit: number = 10) {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('sync_logs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return data
    }

    /**
     * Upsert a Câmara proposal
     */
    private async upsertCamaraProposal(
        proposal: CamaraProposal,
        supabase: any
    ): Promise<'created' | 'updated' | 'skipped'> {
        const externalId = `camara-${proposal.id}`

        // Check if proposal exists
        const { data: existing } = await supabase
            .from('legislative_proposals')
            .select('id')
            .eq('external_id', externalId)
            .single()

        const proposalData: Partial<LegislativeProposal> = {
            external_id: externalId,
            title: `${proposal.siglaTipo} ${proposal.numero}/${proposal.ano}`,
            description: proposal.ementa,
            author: null, // Would need additional API call to get authors
            status: 'em_tramitacao',
            house: 'camara',
            proposal_type: proposal.siglaTipo,
            presentation_date: proposal.dataApresentacao,
            last_synced_at: new Date().toISOString(),
            sync_source: 'camara',
            raw_data: proposal,
        }

        if (existing) {
            const { error } = await supabase
                .from('legislative_proposals')
                .update({
                    ...proposalData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)

            if (error) {
                console.error(`Error updating proposal ${externalId}:`, error)
                return 'skipped'
            }

            return 'updated'
        } else {
            const { error } = await supabase
                .from('legislative_proposals')
                .insert(proposalData)

            if (error) {
                console.error(`Error creating proposal ${externalId}:`, error)
                return 'skipped'
            }

            return 'created'
        }
    }

    /**
     * Upsert a Senado matéria
     */
    private async upsertSenadoMateria(
        materia: SenadoMateria,
        supabase: any
    ): Promise<'created' | 'updated' | 'skipped'> {
        const externalId = `senado-${materia.Codigo}`

        // Check if matéria exists
        const { data: existing } = await supabase
            .from('legislative_proposals')
            .select('id')
            .eq('external_id', externalId)
            .single()

        const proposalData: Partial<LegislativeProposal> = {
            external_id: externalId,
            title: materia.DescricaoIdentificacao,
            description: materia.Ementa,
            author: materia.Autor,
            status: 'em_tramitacao',
            house: 'senado',
            proposal_type: materia.Sigla,
            presentation_date: materia.Data,
            last_synced_at: new Date().toISOString(),
            sync_source: 'senado',
            raw_data: materia,
        }

        if (existing) {
            const { error } = await supabase
                .from('legislative_proposals')
                .update({
                    ...proposalData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)

            if (error) {
                console.error(`Error updating matéria ${externalId}:`, error)
                return 'skipped'
            }

            return 'updated'
        } else {
            const { error } = await supabase
                .from('legislative_proposals')
                .insert(proposalData)

            if (error) {
                console.error(`Error creating matéria ${externalId}:`, error)
                return 'skipped'
            }

            return 'created'
        }
    }

    /**
     * Create a sync log entry
     */
    private async createSyncLog(
        source: 'camara' | 'senado' | 'both'
    ): Promise<SyncLog> {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('sync_logs')
            .insert({
                source,
                status: 'running',
                started_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) throw error

        return data
    }

    /**
     * Mark sync log as completed
     */
    private async completeSyncLog(
        logId: string,
        stats: {
            proposals_fetched: number
            proposals_created: number
            proposals_updated: number
        }
    ) {
        const supabase = createClient()

        await supabase
            .from('sync_logs')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                ...stats,
            })
            .eq('id', logId)
    }

    /**
     * Mark sync log as failed
     */
    private async failSyncLog(logId: string, errorMessage: string) {
        const supabase = createClient()

        await supabase
            .from('sync_logs')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: errorMessage,
            })
            .eq('id', logId)
    }
}

// Export singleton instance
export const syncService = new SyncService()
