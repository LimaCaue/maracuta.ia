import { createClient } from "@/lib/supabase/server"
import { Shield, Video, Volume2, ImageIcon, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ViralPage() {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
        title,
        external_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: viralContent } = await supabase
    .from("viral_content")
    .select(`
      *,
      risk_alerts (
        title,
        risk_level
      )
    `)
    .order("views", { ascending: false })
    .limit(5)

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerador de Conteúdo Viral</h1>
          <p className="text-muted-foreground">
            Transforme alertas complexos em conteúdo viral para WhatsApp, TikTok e Reels
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escolha o Formato</CardTitle>
                <CardDescription>Selecione como deseja gerar o conteúdo viral</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Volume2 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Áudio WhatsApp</h3>
                    <p className="text-sm text-muted-foreground mb-4">Mensagem de voz de 60-90 segundos</p>
                    <Button className="w-full" asChild>
                      <Link href="/viral/create?type=audio">Criar Áudio</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Video className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Vídeo Curto</h3>
                    <p className="text-sm text-muted-foreground mb-4">Reels/TikTok de 15-30 segundos</p>
                    <Button className="w-full" asChild>
                      <Link href="/viral/create?type=video">Criar Vídeo</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <ImageIcon className="h-12 w-12 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Card Visual</h3>
                    <p className="text-sm text-muted-foreground mb-4">Imagem para stories e feed</p>
                    <Button className="w-full" asChild>
                      <Link href="/viral/create?type=image">Criar Card</Link>
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas Disponíveis</CardTitle>
                <CardDescription>Selecione um alerta para gerar conteúdo viral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {alert.risk_level === "critical" ? "🔴" : alert.risk_level === "high" ? "🟠" : "🟡"}
                            </span>
                            <h3 className="font-semibold text-sm">{alert.title}</h3>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/viral/create?alert=${alert.id}`}>
                            <Sparkles className="mr-1 h-3 w-3" />
                            Gerar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conteúdo Mais Viral</CardTitle>
                <CardDescription>Top 5 com mais alcance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {viralContent && viralContent.length > 0 ? (
                  viralContent.map((content, index) => (
                    <div key={content.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {content.content_type === "audio" ? (
                            <Volume2 className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Video className="h-3 w-3 text-muted-foreground" />
                          )}
                          {/* @ts-ignore */}
                          <span className="text-xs font-medium truncate">{content.risk_alerts?.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{content.views?.toLocaleString()} views</span>
                          <span>{content.shares?.toLocaleString()} shares</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum conteúdo viral ainda</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dicas para Viralizar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Use linguagem simples e direta</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Comece com um gancho forte</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Inclua call-to-action claro</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Adicione senso de urgência</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Foque no impacto pessoal</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
