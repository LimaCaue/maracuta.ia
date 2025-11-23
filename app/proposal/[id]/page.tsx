import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Users, Calendar, FileText, TrendingUp, RefreshCw, ExternalLink, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
        return "bg-red-500/10 text-red-700 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-500/20"
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
    <div className="min-h-screen w-full relative overflow-hidden">

      <header className="relative z-10 border-b border-border bg-card/100 backdrop-blur-sm">
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
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/proposals">← Voltar para Propostas</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/100 backdrop-blur-sm border-primary/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="outline" className="font-mono">
                        {proposal.external_id}
                      </Badge>
                      <Badge variant="secondary">
                        {proposal.house === "camara" ? "Câmara dos Deputados" : "Senado Federal"}
                      </Badge>
                      <Badge variant="outline">{proposal.proposal_type}</Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{proposal.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{proposal.description}</p>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Criada em
                    </span>
                    <span className="font-medium text-lg">{formatDate(proposal.created_at)}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" /> Atualizada em
                    </span>
                    <span className="font-medium text-lg">{formatDate(proposal.updated_at)}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Apresentada em
                    </span>
                    {/* @ts-ignore */}
                    <span className="font-medium text-lg">{formatDate(proposal.presentation_date)}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Última Mudança
                    </span>
                    {/* @ts-ignore */}
                    <span className="font-medium text-lg">{formatDate(proposal.last_synced_at || proposal.updated_at)}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Autor:</span>
                      <span className="font-medium ml-1">{proposal.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium ml-1 capitalize">{proposal.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {alerts && alerts.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Alertas de Risco Detectados ({alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-border rounded-lg p-4 bg-background/50">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={getRiskColor(alert.risk_level)}>{alert.risk_level.toUpperCase()}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.risk_type.replace("_", " ").toUpperCase()}
                            </Badge>
                            {alert.jabuti_detected && (
                              <Badge variant="destructive" className="text-xs">
                                Jabuti Detectado
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mb-2">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/alert/${alert.id}`}>Ver Análise Completa</Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-card/100 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="default"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/analyze/${id}`}>
                    <Brain className="mr-2 h-4 w-4" />
                    Análise Detalhada com IA
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent hover:bg-primary/10"
                  asChild
                  disabled={!alerts || alerts.length === 0}
                >
                  <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio`}>
                    <Shield className="mr-2 h-4 w-4" />
                    Criar Alerta Viral
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-primary/10">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver no Site Oficial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
