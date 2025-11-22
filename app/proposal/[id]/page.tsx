import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Users, Calendar, FileText, TrendingUp, ExternalLink } from "lucide-react"
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

  // Gera um panorama geral da proposta usando a OpenAI (server-side).
  async function generateOverview(proposal: any, alerts: any[]) {
    // Fallback local curto (2-3 frases)
    const localFallback = () => {
      const title = proposal.title || proposal.external_id || "Proposta sem título"
      const shortDesc = proposal.description ? proposal.description.replace(/\s+/g, " ").trim().slice(0, 180) : "Sem descrição disponível."
      const topAlert = alerts && alerts.length ? `${alerts[0].title} (${alerts[0].risk_level})` : null
      return [
        `${title}: ${shortDesc}${shortDesc.length === 180 ? "…" : ""}`,
        topAlert ? `Risco identificado: ${topAlert}` : "Nenhum risco principal identificado.",
        `O que checar: revisar dispositivos legais alterados e possíveis emendas ocultas ("jabutis").`
      ].join(" ")
    }

    // Sempre tente a OpenAI; peça explicitamente suma muito curto (2-3 frases).
    if (!process.env.OPENAI_API_KEY) return localFallback()
    try {
      const systemPrompt = `Você é um assistente que produz um panorama geral muito conciso (em português) de uma proposta legislativa. Responda em 2-3 frases curtas e diretas, focando no propósito, principal risco/impacto e uma ação prática a checar. Sem listas e sem parágrafos longos.`
      const userPrompt = `Proposta:
- id: ${proposal.id}
- título: ${proposal.title}
- autor: ${proposal.author}
- casa: ${proposal.house}
- tipo: ${proposal.proposal_type}
- status: ${proposal.status}
- descrição: ${proposal.description || "sem descrição"}

Alertas (resumo): ${
        alerts && alerts.length
          ? JSON.stringify(
              alerts.slice(0, 2).map((a) => ({ title: a.title, risk_level: a.risk_level, jabuti_detected: a.jabuti_detected })),
              null,
              2
            )
          : "Nenhum alerta."
      }

Retorne um texto em 2-3 frases curtas que resuma a proposta, indique o principal risco/impacto (se houver) e diga rapidamente o que checar na análise detalhada.`

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 180,
          temperature: 0.0,
        }),
      })

      if (!res.ok) return localFallback()
      const payload = await res.json()
      const content = payload.choices?.[0]?.message?.content?.trim() ?? null
      // Garantir retorno curto mesmo que a API retorne algo maior
      if (!content) return localFallback()
      const trimmed = content.split("\n").join(" ").trim()
      // Limita a ~280 caracteres para evitar textos longos
      return trimmed.length > 280 ? trimmed.slice(0, 277).trim() + "…" : trimmed
    } catch (e) {
      return localFallback()
    }
  }

  const aiOverview = await generateOverview(proposal, alerts || [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Sentinela Vox</span>
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
          <Link href="/proposals">← Voltar para Propostas</Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
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
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{proposal.description}</p>
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
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>
                      <span className="font-medium ml-1">
                        {new Date(proposal.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Atualizado em:</span>
                      <span className="font-medium ml-1">
                        {new Date(proposal.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver no Site Oficial
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <FileText className="mr-2 h-4 w-4" />
                    Baixar Texto Completo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {alerts && alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Alertas de Risco Detectados ({alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-border rounded-lg p-4">
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

                          {alert.affected_population && alert.affected_population.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">População Afetada:</span>{" "}
                              {alert.affected_population.join(", ")}
                            </div>
                          )}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise Automática</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiOverview ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Panorama Geral (IA)</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{aiOverview}</p>
                    </div>
                    <Separator />
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">Panorama automático indisponível no momento.</div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Nível de Risco Geral</span>
                    <Badge className={getRiskColor(alerts?.[0]?.risk_level || "low")}>
                      {alerts?.[0]?.risk_level?.toUpperCase() || "BAIXO"}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        alerts?.[0]?.risk_level === "critical"
                          ? "bg-red-500"
                          : alerts?.[0]?.risk_level === "high"
                            ? "bg-orange-500"
                            : alerts?.[0]?.risk_level === "medium"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                      }`}
                      style={{
                        width:
                          alerts?.[0]?.risk_level === "critical"
                            ? "100%"
                            : alerts?.[0]?.risk_level === "high"
                              ? "75%"
                              : alerts?.[0]?.risk_level === "medium"
                                ? "50%"
                                : "25%",
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pontos de Atenção</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      <span>Contém {alerts?.length || 0} alerta(s) identificado(s)</span>
                    </li>
                    {alerts?.some((a) => a.jabuti_detected) && (
                      <li className="flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        <span>Jabutis detectados no texto</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Análise validada por especialistas</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                <Button className="w-full" asChild>
                  <Link href={`/analyze/${proposal.id}`}>Análise Detalhada com IA</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Inserido: Próximos Passos - botão para criar conteúdo viral a partir do primeiro alerta */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
                <CardDescription>Crie conteúdo viral com base neste alerta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  asChild
                  className="w-full"
                  variant="outline"
                  disabled={!alerts || alerts.length === 0}
                >
                  <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio`}>Criar Conteúdo Viral</Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  O botão usa o primeiro alerta detectado desta proposta. Selecione outro alerta na página de criação, se necessário.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  asChild
                  disabled={!alerts || alerts.length === 0}
                >
                  <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio`}>
                    <Shield className="mr-2 h-4 w-4" />
                    Criar Alerta
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="mr-2 h-4 w-4" />
                  Compartilhar Alerta
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Monitorar Mudanças
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
