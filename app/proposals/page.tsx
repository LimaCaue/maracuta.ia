import { createClient } from "@/lib/supabase/server"
import { Shield, FileText, Search, ChevronLeft, ChevronRight, Calendar, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { FilterSelect } from "./filter-select"

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; q?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const page = Number(params.page) || 1
  const type = params.type || "all"
  const query = params.q || ""
  const itemsPerPage = 10
  const from = (page - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  // Build query
  let supabaseQuery = supabase
    .from("legislative_proposals")
    .select(`
      *,
      risk_alerts (
        id,
        risk_level,
        jabuti_detected
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (type !== "all") {
    supabaseQuery = supabaseQuery.eq("proposal_type", type)
  }

  if (query) {
    supabaseQuery = supabaseQuery.ilike("title", `%${query}%`)
  }

  const { data: proposals, count } = await supabaseQuery

  const totalPages = count ? Math.ceil(count / itemsPerPage) : 0

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background">
      {/* Background with blur effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: 'url("https://www12.senado.leg.br/noticias/materias/2025/01/31/camara-tambem-tera-eleicao-em-1o-de-fevereiro/20150122_00159.jpg/mural/imagem_materia")',
            filter: 'blur(8px)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/70 to-background/80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">MaracutaIA</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/alerts">Alertas</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/proposals">Propostas</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/viral">Gerar Alerta</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Propostas Legislativas</h1>
            <p className="text-muted-foreground">Monitoramento de propostas da Câmara e Senado</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <FilterSelect />
            </div>

            <form className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Buscar por título ou ID..."
                className="pl-10"
              />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="page" value="1" />
            </form>
          </div>
        </div>

        <div className="grid gap-4">
          {proposals && proposals.length > 0 ? (
            proposals.map((proposal) => {
              // @ts-ignore
              const hasAlerts = proposal.risk_alerts && proposal.risk_alerts.length > 0
              // @ts-ignore
              const criticalAlert = proposal.risk_alerts?.some((a) => a.risk_level === "critical")
              // @ts-ignore
              const hasJabuti = proposal.risk_alerts?.some((a) => a.jabuti_detected)

              return (
                <Card
                  key={proposal.id}
                  className={`bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow ${criticalAlert ? "border-red-500/50" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {proposal.external_id}
                          </Badge>
                          <Badge variant="secondary">{proposal.house === "camara" ? "Câmara" : "Senado"}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {proposal.proposal_type}
                          </Badge>
                          {hasAlerts && (
                            <Badge variant="destructive" className="text-xs">
                              {/* @ts-ignore */}
                              {proposal.risk_alerts.length} Alerta(s)
                            </Badge>
                          )}
                          {hasJabuti && (
                            <Badge variant="destructive" className="text-xs">
                              Jabuti Detectado
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-xl font-bold mb-2">{proposal.title}</h2>
                        <p className="text-muted-foreground mb-4 line-clamp-2">{proposal.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Criada em
                            </span>
                            <span>{formatDate(proposal.created_at)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" /> Atualizada em
                            </span>
                            <span>{formatDate(proposal.updated_at)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium flex items-center gap-1">
                              <FileText className="h-3 w-3" /> Apresentada em
                            </span>
                            {/* @ts-ignore */}
                            <span>{formatDate(proposal.presentation_date)}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium flex items-center gap-1">
                              <RefreshCw className="h-3 w-3" /> Última Mudança
                            </span>
                            {/* @ts-ignore */}
                            <span>{formatDate(proposal.last_synced_at || proposal.updated_at)}</span>
                          </div>
                        </div>
                      </div>

                      <Button asChild className="shrink-0">
                        <Link href={`/proposal/${proposal.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Nenhuma proposta encontrada</h2>
                <p className="text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/proposals?type=${type}&page=${page - 1}&q=${query}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/proposals?type=${type}&page=${page + 1}&q=${query}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
