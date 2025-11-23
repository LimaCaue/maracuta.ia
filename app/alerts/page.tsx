import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Filter, ArrowRight, FileText, Siren } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AlertsPage() {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
        id,
        title,
        external_id,
        house,
        author
      )
    `)
    .order("created_at", { ascending: false })

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-400"
      default:
        return "bg-blue-400"
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "critical": return "CRÍTICO"
      case "high": return "ALTO"
      case "medium": return "MÉDIO"
      default: return "BAIXO"
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-yellow-200 pb-20">
      {/* Header Neo-Brutalism */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Shield className="h-6 w-6" />
            </div>
            <Link href="/" className="text-2xl font-black tracking-tight hover:underline decoration-4 decoration-pink-500">
              Maracuta<span className="text-pink-500">IA</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" className="font-bold bg-black text-white border-2 border-black hover:bg-gray-800 hover:text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" asChild>
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="inline-block bg-red-500 text-white border-2 border-black px-4 py-1 rounded-full font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-2">
                Zona de Perigo ⚠️
              </div>
              <h1 className="text-5xl font-black mb-2">Alertas de Risco</h1>
              <p className="text-xl font-medium text-zinc-600">Monitoramento de ameaças legislativas em tempo real.</p>
            </div>
            <Button className="h-12 px-6 bg-white text-black border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <Filter className="mr-2 h-5 w-5" />
              Filtrar Riscos
            </Button>
          </div>

          <div className="grid gap-8">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group">
                  <div className={`${getRiskColor(alert.risk_level)} border-b-4 border-black p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                        <Siren className="h-6 w-6 text-black" />
                      </div>
                      <span className="text-xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>
                        RISCO {getRiskLabel(alert.risk_level)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {alert.jabuti_detected && (
                        <Badge className="bg-white text-black border-2 border-black font-black text-xs px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                          🐢 JABUTI
                        </Badge>
                      )}
                      {alert.risk_type && (
                        <Badge className="bg-black text-white border-2 border-white font-bold text-xs px-3 py-1">
                          {String(alert.risk_type).replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-black mb-4 leading-tight group-hover:text-pink-600 transition-colors">
                      {alert.title || "Alerta sem título"}
                    </h3>
                    <p className="text-lg font-medium text-zinc-600 mb-6 line-clamp-3">
                      {alert.description || "Sem descrição disponível para este alerta."}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-4 border-black border-dashed">
                      <div className="text-sm font-bold text-zinc-500 flex items-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                        Detectado em: {new Date(alert.created_at).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="flex w-full sm:w-auto gap-3">
                        <Button variant="outline" className="flex-1 sm:flex-none border-2 border-black rounded-xl font-bold hover:bg-yellow-200 transition-colors" asChild>
                          <Link href={`/proposal/${alert.proposal_id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Proposta
                          </Link>
                        </Button>
                        <Button className="flex-1 sm:flex-none bg-black text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] transition-all" asChild>
                          <Link href={`/alert/${alert.id}`}>
                            Detalhes
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border-4 border-black rounded-3xl p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-gray-100 w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="h-12 w-12 text-zinc-400" />
                </div>
                <h2 className="text-3xl font-black mb-2">Tudo Limpo!</h2>
                <p className="text-xl text-zinc-500 font-medium">Nenhum risco detectado no momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
