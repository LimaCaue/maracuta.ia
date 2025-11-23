import { createClient } from "@/lib/supabase/server"
import { Shield, FileText, Search, ChevronLeft, ChevronRight, Calendar, RefreshCw, Filter, ArrowRight } from "lucide-react"
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
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-yellow-200 pb-20">

      {/* Header Neo-Brutalism */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img src="/favicon.ico" className="h-6 w-6" />
            </div>
            <Link href="/" className="text-2xl font-black tracking-tight hover:underline decoration-4 decoration-pink-500">
              Maracuta<span className="text-pink-500">IA</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
              <Link href="/alerts">Alertas</Link>
            </Button>
            <Button variant="ghost" className="font-bold bg-black text-white border-2 border-black hover:bg-gray-800 hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" asChild>
              <Link href="/proposals">Propostas</Link>
            </Button>
            <Button className="bg-pink-500 text-black border-2 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" asChild>
              <Link href="/viral">Gerar Alerta</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-8 mb-12">
            <div>
              <div className="inline-block bg-blue-400 text-black border-2 border-black px-4 py-1 rounded-full font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-2">
                Legislativo 🏛️
              </div>
              <h1 className="text-5xl font-black mb-2">Propostas Legislativas</h1>
              <p className="text-xl font-medium text-zinc-600">Acompanhe o que está sendo tramado.</p>
            </div>

            <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-auto min-w-[200px]">
                <FilterSelect />
              </div>

              <form className="relative flex-1 w-full flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black" />
                  <Input
                    name="q"
                    defaultValue={query}
                    placeholder="Buscar por título ou ID..."
                    className="pl-12 h-12 border-2 border-black rounded-xl font-medium focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  />
                </div>
                <Button type="submit" className="h-12 bg-black text-white border-2 border-black rounded-xl font-bold hover:bg-gray-800">
                  Buscar
                </Button>
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="page" value="1" />
              </form>
            </div>
          </div>

          <div className="grid gap-8">
            {proposals && proposals.length > 0 ? (
              proposals.map((proposal) => {
                // @ts-ignore
                const hasAlerts = proposal.risk_alerts && proposal.risk_alerts.length > 0
                // @ts-ignore
                const criticalAlert = proposal.risk_alerts?.some((a) => a.risk_level === "critical")
                // @ts-ignore
                const hasJabuti = proposal.risk_alerts?.some((a) => a.jabuti_detected)

                return (
                  <div
                    key={proposal.id}
                    className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group"
                  >
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge className="bg-black text-white border-2 border-black rounded-lg px-3 py-1 font-mono font-bold text-sm">
                          {proposal.external_id}
                        </Badge>
                        <Badge className="bg-yellow-300 text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                          {proposal.house === "camara" ? "Câmara" : "Senado"}
                        </Badge>
                        <Badge className="bg-white text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                          {proposal.proposal_type}
                        </Badge>
                        {hasAlerts && (
                          <Badge className="bg-red-500 text-white border-2 border-black rounded-lg px-3 py-1 font-bold text-sm animate-pulse">
                            {/* @ts-ignore */}
                            {proposal.risk_alerts.length} Alerta(s)
                          </Badge>
                        )}
                        {hasJabuti && (
                          <Badge className="bg-green-500 text-white border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                            🐢 Jabuti
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-2xl font-black mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                        {proposal.title}
                      </h2>
                      <p className="text-lg font-medium text-zinc-600 mb-6 line-clamp-2">
                        {proposal.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 border-2 border-black border-dashed rounded-xl p-4 mb-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs uppercase text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Criada em
                          </span>
                          <span className="font-bold">{formatDate(proposal.created_at)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs uppercase text-zinc-500 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> Atualizada em
                          </span>
                          <span className="font-bold">{formatDate(proposal.updated_at)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs uppercase text-zinc-500 flex items-center gap-1">
                            <FileText className="h-3 w-3" /> Apresentada em
                          </span>
                          {/* @ts-ignore */}
                          <span className="font-bold">{formatDate(proposal.presentation_date)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs uppercase text-zinc-500 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" /> Última Mudança
                          </span>
                          {/* @ts-ignore */}
                          <span className="font-bold">{formatDate(proposal.last_synced_at || proposal.updated_at)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button className="bg-black text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] transition-all" asChild>
                          <Link href={`/proposal/${proposal.id}`}>
                            Ver Detalhes
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-gray-100 w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <FileText className="h-12 w-12 text-zinc-400" />
                </div>
                <h2 className="text-3xl font-black mb-2">Nada por aqui!</h2>
                <p className="text-xl text-zinc-500 font-medium">Nenhuma proposta encontrada com esses filtros.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                className="h-12 w-12 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/proposals?type=${type}&page=${page - 1}&q=${query}`}>
                    <ChevronLeft className="h-6 w-6" />
                  </Link>
                ) : (
                  <ChevronLeft className="h-6 w-6" />
                )}
              </Button>

              <span className="text-lg font-black bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Página {page} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                className="h-12 w-12 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/proposals?type=${type}&page=${page + 1}&q=${query}`}>
                    <ChevronRight className="h-6 w-6" />
                  </Link>
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
