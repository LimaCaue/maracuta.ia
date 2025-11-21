// Shared types for API integration

export interface LegislativeProposal {
    id: string
    external_id: string
    title: string
    description: string | null
    author: string | null
    status: string
    house: 'camara' | 'senado'
    proposal_type: string
    presentation_date: string | null
    last_synced_at?: string
    sync_source: 'camara' | 'senado'
    raw_data?: any
}

// Câmara dos Deputados API Types
export interface CamaraProposal {
    id: number
    uri: string
    siglaTipo: string
    codTipo: number
    numero: number
    ano: number
    ementa: string
    dataApresentacao: string
}

export interface CamaraProposalDetailed extends CamaraProposal {
    keywords?: string
    ementaDetalhada?: string
    statusProposicao?: {
        dataHora: string
        sequencia: number
        siglaOrgao: string
        uriOrgao: string
        regime: string
        descricaoTramitacao: string
        codTipoTramitacao: string
        descricaoSituacao: string
        codSituacao: number
        despacho: string
        url: string
        ambito: string
    }
    uriAutores?: string
    descricaoTipo?: string
    uriOrgaoNumerador?: string
}

export interface CamaraApiResponse<T> {
    dados: T[]
    links: Array<{
        rel: string
        href: string
    }>
}

// Senado Federal API Types
export interface SenadoMateria {
    Codigo: string
    IdentificacaoProcesso: string
    DescricaoIdentificacao: string
    Sigla: string
    Numero: string
    Ano: string
    Ementa: string
    Autor: string
    Data: string
    UrlDetalheMateria: string
    SiglaComissao?: string
}

export interface SenadoApiResponse {
    PesquisaBasicaMateria: {
        Materias: {
            Materia: SenadoMateria[]
        }
    }
}

export interface SenadoMateriaDetailed extends SenadoMateria {
    Subtipo?: string
    Natureza?: string
    Indicador?: string
    Complemento?: string
    NomeAutor?: string
    SiglaPartidoAutor?: string
    UfAutor?: string
    Indexacao?: string
}

// Sync Status Types
export interface SyncLog {
    id: string
    source: 'camara' | 'senado' | 'both'
    started_at: string
    completed_at: string | null
    status: 'running' | 'completed' | 'failed'
    proposals_fetched: number
    proposals_created: number
    proposals_updated: number
    error_message: string | null
}

export interface SyncStatus {
    last_sync_camara: string | null
    last_sync_senado: string | null
    total_proposals: number
    camara_proposals: number
    senado_proposals: number
    is_syncing: boolean
    last_error: string | null
}

// API Error Types
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public source?: 'camara' | 'senado'
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

export interface SyncOptions {
    batchSize?: number
    maxRetries?: number
    startDate?: string
    endDate?: string
    incrementalOnly?: boolean
}
