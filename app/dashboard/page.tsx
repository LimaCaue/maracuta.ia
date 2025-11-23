import { createClient } from "@/lib/supabase/server"
import { Shield, FileText, Bell, LogOut, FileType, ArrowRight, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch statistics
  const { count: totalProposals } = await supabase
    .from("legislative_proposals")
    .select("*", { count: "exact", head: true })

  // Fetch counts by type - Top 5 most frequent types
  const types = [
    { id: 'REQ', label: 'Requerimento' },
    { id: 'PRL', label: 'Parecer Preliminar' },
    { id: 'RPD', label: 'Req. de Informação' },
    { id: 'PL', label: 'Projeto de Lei' },
    { id: 'PAR', label: 'Parecer' }
  ]

  const typeCounts = await Promise.all(
    types.map(async (type) => {
      const { count } = await supabase
        .from("legislative_proposals")
        .select("*", { count: "exact", head: true })
        .eq("proposal_type", type.id)
      return { ...type, count: count || 0 }
    })
  )

  const { count: criticalAlerts } = await supabase
    .from("risk_alerts")
    .select("*", { count: "exact", head: true })
    .eq("risk_level", "critical")

  // Fetch recent proposals
  const { data: recentProposals } = await supabase
    .from("legislative_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

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
            <Button variant="ghost" className="font-bold bg-black text-white border-2 border-black hover:bg-gray-800 hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" asChild>
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
            {user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-black">
                <form action="/auth/signout" method="post">
                  <Button variant="ghost" size="sm" type="submit" className="hover:bg-red-100 hover:text-red-600 font-bold">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </Button>
                </form>
              </div>
            ) : (
              <Button variant="outline" className="ml-4 border-2 border-black font-bold" asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="mb-12">
            <div className="inline-block bg-green-400 text-black border-2 border-black px-4 py-1 rounded-full font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-2">
              Visão Geral 📊
            </div>
            <h1 className="text-5xl font-black mb-2">Dashboard</h1>
            <p className="text-xl font-medium text-zinc-600">Resumo da atividade legislativa monitorada.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">Propostas Monitoradas</h3>
                <div className="bg-blue-100 p-2 rounded-lg border-2 border-black">
                  <FileText className="h-5 w-5 text-black" />
                </div>
              </div>
              <div className="text-4xl font-black mb-1">{totalProposals?.toLocaleString() || 0}</div>
              <p className="text-sm font-bold text-zinc-500">Câmara e Senado</p>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">Principais Tipos</h3>
                <div className="bg-yellow-100 p-2 rounded-lg border-2 border-black">
                  <FileType className="h-5 w-5 text-black" />
                </div>
              </div>
              <div className="space-y-2">
                {typeCounts.slice(0, 3).map(({ id, label, count }) => (
                  <div key={id} className="flex items-center justify-between text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-2 border-black w-12 justify-center bg-gray-50">{id}</Badge>
                      <span className="text-zinc-600 truncate max-w-[100px]">{label}</span>
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg">Alertas Críticos</h3>
                <div className="bg-red-100 p-2 rounded-lg border-2 border-black">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="text-4xl font-black text-red-600 mb-1">{criticalAlerts || 0}</div>
              <p className="text-sm font-bold text-zinc-500">Necessitam ação imediata</p>
            </div>
          </div>

          {/* Recent Proposals */}
          <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black border-b-4 border-black p-6 flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                <Activity className="h-6 w-6 text-black" />
              </div>
              <h2 className="text-2xl font-black text-white">Propostas em Tramitação</h2>
            </div>

            <div className="p-6 space-y-4">
              {recentProposals && recentProposals.length > 0 ? (
                recentProposals.map((proposal) => (
                  <div key={proposal.id} className="bg-gray-50 border-2 border-black rounded-xl p-4 hover:bg-white transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-white text-black border-2 border-black font-mono font-bold">{proposal.external_id}</Badge>
                          <Badge className="bg-yellow-300 text-black border-2 border-black font-bold text-xs">
                            {proposal.house === "camara" ? "Câmara" : "Senado"}
                          </Badge>
                          <Badge className="bg-blue-200 text-black border-2 border-black font-bold text-xs">
                            {proposal.proposal_type}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">{proposal.title}</h3>
                        <p className="text-sm font-medium text-zinc-500 line-clamp-1">{proposal.description}</p>
                      </div>
                      <Button variant="ghost" className="shrink-0 font-bold hover:bg-gray-200" asChild>
                        <Link href={`/proposal/${proposal.id}`}>
                          Ver Proposta <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 font-bold">Nenhuma proposta recente.</div>
              )}

              <div className="pt-4 flex justify-center">
                <Button variant="outline" className="w-full md:w-auto border-2 border-black rounded-xl font-bold hover:bg-gray-100" asChild>
                  <Link href="/proposals">Ver Todas as Propostas</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
