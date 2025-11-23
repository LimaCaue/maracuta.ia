import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Users, Calendar, FileText, TrendingUp, RefreshCw, ExternalLink, Brain, ArrowLeft, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposal } = await supabase.from("legislative_proposals").select("*").eq("id", id).single()

  if (!proposal) {
    notFound()
  }

  const { data: alerts } = await supabase
    .from("risk_alerts")
    .select("*")
    .eq("proposal_id", id)
    .order("created_at", { ascending: false })

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500 text-white border-red-700"
      case "high":
        return "bg-orange-500 text-white border-orange-700"
      case "medium":
        return "bg-yellow-400 text-black border-yellow-600"
      default:
        return "bg-blue-400 text-white border-blue-600"
    }
  }

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
            <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
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
          <Button variant="ghost" asChild className="mb-8 font-bold hover:bg-yellow-200 border-2 border-transparent hover:border-black transition-all">
            <Link href="/proposals">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar para Propostas
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detalhes da Proposta */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-yellow-300 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-black">Detalhes da Proposta</h2>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-black text-white border-2 border-black rounded-lg px-3 py-1 font-mono font-bold text-sm">
                      {proposal.external_id}
                    </Badge>
                    <Badge className="bg-white text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                      {proposal.house === "camara" ? "Câmara dos Deputados" : "Senado Federal"}
                    </Badge>
                    <Badge className="bg-blue-200 text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                      {proposal.proposal_type}
                    </Badge>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight">{proposal.title}</h1>

                  <div className="bg-gray-50 border-2 border-black rounded-xl p-6 mb-8">
                    <h3 className="font-black text-lg mb-2">Descrição</h3>
                    <p className="text-lg font-medium text-zinc-600 leading-relaxed">{proposal.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 bg-white border-2 border-black border-dashed rounded-xl p-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Criada em
                      </span>
                      <span className="font-black text-lg">{formatDate(proposal.created_at)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" /> Atualizada em
                      </span>
                      <span className="font-black text-lg">{formatDate(proposal.updated_at)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Apresentada em
                      </span>
                      {/* @ts-ignore */}
                      <span className="font-black text-lg">{formatDate(proposal.presentation_date)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Última Mudança
                      </span>
                      {/* @ts-ignore */}
                      <span className="font-black text-lg">{formatDate(proposal.last_synced_at || proposal.updated_at)}</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 bg-blue-50 border-2 border-black rounded-xl p-4">
                      <Users className="h-5 w-5 text-black" />
                      <div>
                        <span className="text-xs font-bold uppercase text-zinc-500 block">Autor</span>
                        <span className="font-black text-lg">{proposal.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-green-50 border-2 border-black rounded-xl p-4">
                      <FileText className="h-5 w-5 text-black" />
                      <div>
                        <span className="text-xs font-bold uppercase text-zinc-500 block">Status</span>
                        <span className="font-black text-lg capitalize">{proposal.status.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alertas de Risco */}
              {alerts && alerts.length > 0 && (
                <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-red-500 border-b-4 border-black p-6 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                      <AlertTriangle className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Alertas de Risco ({alerts.length})</h2>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="bg-gray-50 border-2 border-black rounded-xl p-6 hover:bg-white transition-colors">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={`${getRiskColor(alert.risk_level)} border-2 rounded-lg px-3 py-1 font-black text-xs`}>
                            {alert.risk_level.toUpperCase()}
                          </Badge>
                          <Badge className="bg-white text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-xs">
                            {alert.risk_type.replace("_", " ").toUpperCase()}
                          </Badge>
                          {alert.jabuti_detected && (
                            <Badge className="bg-green-500 text-white border-2 border-black rounded-lg px-3 py-1 font-black text-xs">
                              🐢 JABUTI
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-black mb-2">{alert.title}</h3>
                        <p className="text-base font-medium text-zinc-600 mb-4">{alert.description}</p>

                        <Button size="sm" className="bg-white text-black border-2 border-black rounded-lg font-bold hover:bg-gray-100" asChild>
                          <Link href={`/alert/${alert.id}`}>
                            Ver Análise Completa <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                <div className="bg-black border-b-4 border-black p-6">
                  <h2 className="text-2xl font-black text-white">Ações Rápidas</h2>
                </div>
                <div className="p-6 space-y-4">
                  <Button
                    className="w-full h-14 bg-purple-500 text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    asChild
                  >
                    <Link href={`/analyze/${id}`}>
                      <Brain className="mr-2 h-5 w-5" />
                      Análise Detalhada com IA
                    </Link>
                  </Button>

                  <Button
                    className="w-full h-14 bg-white text-black border-2 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    asChild
                    disabled={!alerts || alerts.length === 0}
                  >
                    <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio`}>
                      <Shield className="mr-2 h-5 w-5" />
                      Criar Alerta Viral
                    </Link>
                  </Button>

                  <Button
                    className="w-full h-14 bg-gray-100 text-black border-2 border-black rounded-xl font-bold hover:bg-gray-200"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver no Site Oficial
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
