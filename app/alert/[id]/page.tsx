import { createClient } from "@/lib/supabase/server"
import { Shield, Users, Share2, Download, Volume2, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: alert } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
        id,
        title,
        external_id,
        house,
        author,
        description,
        status
      )
    `)
    .eq("id", id)
    .single()

  if (!alert) {
    notFound()
  }

  const { data: viralContent } = await supabase
    .from("viral_content")
    .select("*")
    .eq("alert_id", id)
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "critical":
        return "🔴"
      case "high":
        return "🟠"
      case "medium":
        return "🟡"
      default:
        return "🔵"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
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

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/alerts">← Voltar para Alertas</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{getRiskIcon(alert.risk_level)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className={getRiskColor(alert.risk_level)}>RISCO {alert.risk_level.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.risk_type.replace("_", " ").toUpperCase()}
                      </Badge>
                      {alert.jabuti_detected && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ Jabuti Detectado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl mb-2">{alert.title}</CardTitle>
                    <p className="text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">População Afetada</h3>
                  <div className="flex flex-wrap gap-2">
                    {alert.affected_population && alert.affected_population.length > 0 ? (
                      alert.affected_population.map((pop: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {pop.replace("_", " ")}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">População geral</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Análise da IA</h3>
                  {alert.ai_analysis && typeof alert.ai_analysis === "object" && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confiança da Análise</span>
                        <span className="text-sm font-bold">
                          {/* @ts-ignore */}
                          {((alert.ai_analysis.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            /* @ts-ignore */
                            width: `${((alert.ai_analysis.confidence || 0) * 100).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      {/* @ts-ignore */}
                      {alert.ai_analysis.hidden_clauses && alert.ai_analysis.hidden_clauses.length > 0 && (
                        <div className="mt-4">
                          <span className="text-sm font-medium">Cláusulas Ocultas Detectadas:</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {/* @ts-ignore */}
                            {alert.ai_analysis.hidden_clauses.map((clause: string, index: number) => (
                              <Badge key={index} variant="destructive">
                                {clause}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium">Score de Impacto</span>
                        {/* @ts-ignore */}
                        <span className="text-lg font-bold text-destructive">{alert.ai_analysis.impact_score}/10</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Proposta Relacionada</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {/* @ts-ignore */}
                        <Badge variant="outline">{alert.legislative_proposals.external_id}</Badge>
                        <Badge variant="secondary">
                          {/* @ts-ignore */}
                          {alert.legislative_proposals.house === "camara" ? "Câmara" : "Senado"}
                        </Badge>
                      </div>
                      {/* @ts-ignore */}
                      <h4 className="font-semibold mb-1">{alert.legislative_proposals.title}</h4>
                      {/* @ts-ignore */}
                      <p className="text-sm text-muted-foreground mb-3">{alert.legislative_proposals.description}</p>
                      <Button variant="outline" size="sm" asChild>
                        {/* @ts-ignore */}
                        <Link href={`/proposal/${alert.legislative_proposals.id}`}>Ver Proposta Completa</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {viralContent && viralContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo Viral Gerado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {viralContent.map((content) => (
                    <div key={content.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {content.content_type === "audio" ? (
                          <Volume2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Video className="h-5 w-5 text-primary" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{content.content_type === "audio" ? "Áudio" : "Vídeo"}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {content.views?.toLocaleString()} visualizações
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {content.shares?.toLocaleString()} compartilhamentos
                            </span>
                          </div>
                          <p className="text-sm italic text-muted-foreground mb-3">"{content.script}"</p>
                          <Button size="sm" variant="outline">
                            Baixar {content.content_type === "audio" ? "Áudio" : "Vídeo"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" asChild>
                  <Link href={`/viral/generate?alert=${id}`}>
                    <Video className="mr-2 h-4 w-4" />
                    Gerar Conteúdo Viral
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar Alerta
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total de Visualizações</div>
                  <div className="text-2xl font-bold">
                    {viralContent?.reduce((acc, c) => acc + (c.views || 0), 0).toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total de Compartilhamentos</div>
                  <div className="text-2xl font-bold">
                    {viralContent?.reduce((acc, c) => acc + (c.shares || 0), 0).toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Alcance Estimado</div>
                  <div className="text-2xl font-bold">
                    {((viralContent?.reduce((acc, c) => acc + (c.shares || 0), 0) || 0) * 150).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="h-full w-px bg-border" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-medium">Alerta Criado</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  {viralContent && viralContent.length > 0 && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="h-full w-px bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-medium">Conteúdo Gerado</div>
                        <div className="text-xs text-muted-foreground">{viralContent.length} item(ns)</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-muted" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">Em Monitoramento</div>
                      <div className="text-xs text-muted-foreground">Aguardando votação</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
