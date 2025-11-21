import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, TrendingUp, FileText, Bell, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  const { count: activeAlerts } = await supabase.from("risk_alerts").select("*", { count: "exact", head: true })

  const { count: criticalAlerts } = await supabase
    .from("risk_alerts")
    .select("*", { count: "exact", head: true })
    .eq("risk_level", "critical")

  // Fetch recent alerts
  const { data: recentAlerts } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
        title,
        external_id,
        house
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch recent proposals
  const { data: recentProposals } = await supabase
    .from("legislative_proposals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <Button variant="outline" asChild>
                <Link href="/viral">
                  <Bell className="mr-2 h-4 w-4" />
                  Gerar Alerta
                </Link>
              </Button>
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
                  <form action="/auth/signout" method="post">
                    <Button variant="ghost" size="sm" type="submit">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Entrar</Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Propostas Monitoradas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProposals?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Câmara e Senado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Necessitam ação imediata</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>Riscos detectados pela IA nas últimas 24h</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getRiskColor(alert.risk_level)}>{alert.risk_level.toUpperCase()}</Badge>
                          {alert.jabuti_detected && (
                            <Badge variant="outline" className="text-xs">
                              Jabuti Detectado
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {/* @ts-ignore */}
                        <span>{alert.legislative_proposals?.external_id}</span>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/alert/${alert.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta recente</p>
              )}
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/alerts">Ver Todos os Alertas</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Proposals */}
          <Card>
            <CardHeader>
              <CardTitle>Propostas em Tramitação</CardTitle>
              <CardDescription>Últimas propostas adicionadas ao monitoramento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProposals && recentProposals.length > 0 ? (
                recentProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{proposal.external_id}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {proposal.house === "camara" ? "Câmara" : "Senado"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{proposal.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Por {proposal.author}</span>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/proposal/${proposal.id}`}>Ver Proposta</Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma proposta recente</p>
              )}
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/proposals">Ver Todas as Propostas</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
