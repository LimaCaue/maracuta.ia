import pRetry from 'p-retry'
import PQueue from 'p-queue'
import { parseStringPromise } from 'xml2js'
import { SYNC_CONFIG } from '@/lib/config/sync-config'
import { SenadoMateria, SenadoApiResponse, ApiError } from './types'

/**
 * Client for interacting with the Senado Federal API
 * Documentation: https://legis.senado.leg.br/dadosabertos/
 */
export class SenadoApiClient {
    private baseUrl: string
    private queue: PQueue

    constructor() {
        this.baseUrl = SYNC_CONFIG.SENADO_API_BASE
        this.queue = new PQueue({
            interval: SYNC_CONFIG.SENADO_RATE_LIMIT.perMilliseconds,
            intervalCap: SYNC_CONFIG.SENADO_RATE_LIMIT.requests,
        })
    }

    /**
     * Fetch legislative matters (matérias)
     */
    async fetchMaterias(options: {
        offset?: number
        limit?: number
        tramitando?: boolean
        dataInicio?: string
        dataFim?: string
    } = {}): Promise<SenadoMateria[]> {
        const {
            offset = 0,
            limit = SYNC_CONFIG.DEFAULT_BATCH_SIZE,
            tramitando = true,
            dataInicio,
            dataFim,
        } = options

        const params = new URLSearchParams({
            tramitando: tramitando ? 'S' : 'N',
        })

        if (dataInicio) {
            params.append('dataInicio', dataInicio)
        }
        if (dataFim) {
            params.append('dataFim', dataFim)
        }

        // Note: Senado API doesn't have native pagination like Câmara
        // We'll need to fetch all and slice client-side or use date ranges
        const url = `${this.baseUrl}/materia/pesquisa/lista?${params.toString()}`

        return this.queue.add(() =>
            pRetry(
                async () => {
                    const xmlData = await this.fetchWithTimeout(url)
                    const parsed = await this.parseXml(xmlData)

                    if (
                        !parsed.PesquisaBasicaMateria?.Materias?.[0]?.Materia
                    ) {
                        return []
                    }

                    const materias = parsed.PesquisaBasicaMateria.Materias[0].Materia

                    // Apply client-side pagination
                    const start = offset
                    const end = offset + limit
                    return materias.slice(start, end).map(this.normalizeMateriaFields)
                },
                {
                    retries: SYNC_CONFIG.MAX_RETRIES,
                    factor: SYNC_CONFIG.RETRY_BACKOFF_MULTIPLIER,
                    minTimeout: SYNC_CONFIG.RETRY_DELAY_MS,
                    onFailedAttempt: (error: any) => {
                        console.warn(
                            `Senado API request failed (attempt ${error.attemptNumber}/${SYNC_CONFIG.MAX_RETRIES + 1}):`,
                            error.message
                        )
                    },
                }
            )
        )
    }

    /**
     * Fetch detailed information about a specific matéria
     */
    async fetchMateriaDetails(codigo: string): Promise<any> {
        const url = `${this.baseUrl}/materia/${codigo}`

        return this.queue.add(() =>
            pRetry(
                async () => {
                    const xmlData = await this.fetchWithTimeout(url)
                    const parsed = await this.parseXml(xmlData)
                    return parsed.DetalheMateria?.Materia?.[0] || null
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
     * Fetch all matérias with automatic pagination
     */
    async *fetchAllMaterias(options: {
        tramitando?: boolean
        dataInicio?: string
        dataFim?: string
        batchSize?: number
    } = {}): AsyncGenerator<SenadoMateria[], void, unknown> {
        const { batchSize = SYNC_CONFIG.DEFAULT_BATCH_SIZE, ...fetchOptions } = options

        try {
            // First, fetch all materias (Senado API returns all at once)
            const allMaterias = await this.fetchAllMateriasAtOnce(fetchOptions)

            // Yield in batches
            for (let i = 0; i < allMaterias.length; i += batchSize) {
                const batch = allMaterias.slice(i, i + batchSize)
                yield batch

                // Add delay between batches
                if (i + batchSize < allMaterias.length) {
                    await this.delay(SYNC_CONFIG.FULL_SYNC_BATCH_DELAY_MS)
                }
            }
        } catch (error) {
            console.error('Error fetching Senado matérias:', error)
            throw new ApiError(
                'Failed to fetch Senado matérias',
                undefined,
                'senado'
            )
        }
    }

    /**
     * Fetch recent matérias from the last N days
     */
    async fetchRecentMaterias(
        days: number = SYNC_CONFIG.INCREMENTAL_SYNC_DAYS
    ): Promise<SenadoMateria[]> {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const formatDate = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}${month}${day}`
        }

        return this.fetchAllMateriasAtOnce({
            tramitando: true,
            dataInicio: formatDate(startDate),
            dataFim: formatDate(endDate),
        })
    }

    /**
     * Fetch all matérias at once (Senado returns all results in one response)
     */
    private async fetchAllMateriasAtOnce(options: {
        tramitando?: boolean
        dataInicio?: string
        dataFim?: string
    }): Promise<SenadoMateria[]> {
        const { tramitando = true, dataInicio, dataFim } = options

        const params = new URLSearchParams({
            tramitando: tramitando ? 'S' : 'N',
        })

        if (dataInicio) {
            params.append('dataInicio', dataInicio)
        }
        if (dataFim) {
            params.append('dataFim', dataFim)
        }

        const url = `${this.baseUrl}/materia/pesquisa/lista?${params.toString()}`

        return this.queue.add(() =>
            pRetry(
                async () => {
                    const xmlData = await this.fetchWithTimeout(url)
                    const parsed = await this.parseXml(xmlData)

                    if (!parsed.PesquisaBasicaMateria?.Materias?.[0]?.Materia) {
                        return []
                    }

                    return parsed.PesquisaBasicaMateria.Materias[0].Materia.map(
                        this.normalizeMateriaFields
                    )
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
     * Parse XML response to JSON
     */
    private async parseXml(xmlString: string): Promise<any> {
        try {
            return await parseStringPromise(xmlString, {
                explicitArray: true,
                mergeAttrs: true,
                trim: true,
            })
        } catch (error) {
            throw new ApiError(
                `Failed to parse XML response: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                'senado'
            )
        }
    }

    /**
     * Normalize matéria fields from XML parsing
     * XML parser returns arrays for all fields, we need to extract the first element
     */
    private normalizeMateriaFields(materia: any): SenadoMateria {
        const getValue = (field: any): string => {
            if (Array.isArray(field) && field.length > 0) {
                return String(field[0])
            }
            return String(field || '')
        }

        return {
            Codigo: getValue(materia.Codigo),
            IdentificacaoProcesso: getValue(materia.IdentificacaoProcesso),
            DescricaoIdentificacao: getValue(materia.DescricaoIdentificacao),
            Sigla: getValue(materia.Sigla),
            Numero: getValue(materia.Numero),
            Ano: getValue(materia.Ano),
            Ementa: getValue(materia.Ementa),
            Autor: getValue(materia.Autor),
            Data: getValue(materia.Data),
            UrlDetalheMateria: getValue(materia.UrlDetalheMateria),
            SiglaComissao: materia.SiglaComissao
                ? getValue(materia.SiglaComissao)
                : undefined,
        }
    }

    /**
     * Fetch with timeout
     */
    private async fetchWithTimeout(url: string): Promise<string> {
        const controller = new AbortController()
        const timeoutId = setTimeout(
            () => controller.abort(),
            SYNC_CONFIG.REQUEST_TIMEOUT_MS
        )

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/xml',
                },
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new ApiError(
                    `Senado API request failed: ${response.statusText}`,
                    response.status,
                    'senado'
                )
            }

            return await response.text()
        } catch (error) {
            clearTimeout(timeoutId)

            if (error instanceof Error && error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408, 'senado')
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
export const senadoClient = new SenadoApiClient()
