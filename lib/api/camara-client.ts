import pRetry from 'p-retry'
import PQueue from 'p-queue'
import { SYNC_CONFIG } from '@/lib/config/sync-config'
import {
    CamaraProposal,
    CamaraProposalDetailed,
    CamaraApiResponse,
    ApiError,
} from './types'

/**
 * Client for interacting with the Câmara dos Deputados API
 * Documentation: https://dadosabertos.camara.leg.br/swagger/api.html
 */
export class CamaraApiClient {
    private baseUrl: string
    private queue: PQueue

    constructor() {
        this.baseUrl = SYNC_CONFIG.CAMARA_API_BASE
        this.queue = new PQueue({
            interval: SYNC_CONFIG.CAMARA_RATE_LIMIT.perMilliseconds,
            intervalCap: SYNC_CONFIG.CAMARA_RATE_LIMIT.requests,
        })
    }

    /**
     * Fetch proposals with pagination
     */
    async fetchProposals(options: {
        page?: number
        itemsPerPage?: number
        startDate?: string
        endDate?: string
        orderBy?: 'id' | 'dataApresentacao'
        order?: 'ASC' | 'DESC'
    } = {}): Promise<CamaraApiResponse<CamaraProposal>> {
        const {
            page = 1,
            itemsPerPage = SYNC_CONFIG.DEFAULT_BATCH_SIZE,
            startDate,
            endDate,
            orderBy = 'id',
            order = 'DESC',
        } = options

        const params = new URLSearchParams({
            pagina: page.toString(),
            itens: itemsPerPage.toString(),
            ordenarPor: orderBy,
            ordem: order,
        })

        if (startDate) {
            params.append('dataApresentacaoInicio', startDate)
        }
        if (endDate) {
            params.append('dataApresentacaoFim', endDate)
        }

        const url = `${this.baseUrl}/proposicoes?${params.toString()}`

        return this.queue.add(() =>
            pRetry(() => this.fetchWithTimeout(url), {
                retries: SYNC_CONFIG.MAX_RETRIES,
                factor: SYNC_CONFIG.RETRY_BACKOFF_MULTIPLIER,
                minTimeout: SYNC_CONFIG.RETRY_DELAY_MS,
                onFailedAttempt: (error: any) => {
                    console.warn(
                        `Câmara API request failed (attempt ${error.attemptNumber}/${SYNC_CONFIG.MAX_RETRIES + 1}):`,
                        error.message
                    )
                },
            })
        )
    }

    /**
     * Fetch detailed information about a specific proposal
     */
    async fetchProposalDetails(
        proposalId: number
    ): Promise<CamaraProposalDetailed> {
        const url = `${this.baseUrl}/proposicoes/${proposalId}`

        return this.queue.add(() =>
            pRetry(
                async () => {
                    const response = await this.fetchWithTimeout(url)
                    return response.dados
                },
                {
                    retries: SYNC_CONFIG.MAX_RETRIES,
                    factor: SYNC_CONFIG.RETRY_BACKOFF_MULTIPLIER,
                    minTimeout: SYNC_CONFIG.RETRY_DELAY_MS,
                }
            )
        )
    }

    /**
     * Fetch all proposals with automatic pagination
     */
    async *fetchAllProposals(options: {
        startDate?: string
        endDate?: string
        maxPages?: number
    } = {}): AsyncGenerator<CamaraProposal[], void, unknown> {
        let currentPage = 1
        let hasMore = true
        const { maxPages, ...fetchOptions } = options

        while (hasMore && (!maxPages || currentPage <= maxPages)) {
            try {
                const response = await this.fetchProposals({
                    ...fetchOptions,
                    page: currentPage,
                })

                if (response.dados.length === 0) {
                    hasMore = false
                    break
                }

                yield response.dados

                // Check if there's a next page
                const nextLink = response.links.find((link) => link.rel === 'next')
                hasMore = !!nextLink

                currentPage++

                // Add delay between batches to be respectful to the API
                if (hasMore) {
                    await this.delay(SYNC_CONFIG.FULL_SYNC_BATCH_DELAY_MS)
                }
            } catch (error) {
                console.error(`Error fetching page ${currentPage}:`, error)
                throw new ApiError(
                    `Failed to fetch proposals page ${currentPage}`,
                    undefined,
                    'camara'
                )
            }
        }
    }

    /**
     * Fetch proposals from the last N days (for incremental sync)
     */
    async fetchRecentProposals(
        days: number = SYNC_CONFIG.INCREMENTAL_SYNC_DAYS
    ): Promise<CamaraProposal[]> {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        const allProposals: CamaraProposal[] = []

        for await (const batch of this.fetchAllProposals({
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
        })) {
            allProposals.push(...batch)
        }

        return allProposals
    }

    /**
     * Fetch with timeout
     */
    private async fetchWithTimeout(url: string): Promise<any> {
        const controller = new AbortController()
        const timeoutId = setTimeout(
            () => controller.abort(),
            SYNC_CONFIG.REQUEST_TIMEOUT_MS
        )

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new ApiError(
                    `Câmara API request failed: ${response.statusText}`,
                    response.status,
                    'camara'
                )
            }

            return await response.json()
        } catch (error) {
            clearTimeout(timeoutId)

            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408, 'camara')
            }

            throw error
        }
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    /**
     * Get queue statistics
     */
    getQueueStats() {
        return {
            size: this.queue.size,
            pending: this.queue.pending,
        }
    }
}

// Export singleton instance
export const camaraClient = new CamaraApiClient()
