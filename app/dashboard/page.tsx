import { createClient } from "@/lib/supabase/server"
import { Shield, FileText, Bell, LogOut, FileType } from "lucide-react"
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

      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Propostas Monitoradas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalProposals?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Câmara e Senado</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Principais Tipos</CardTitle>
              <FileType className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeCounts.map(({ id, label, count }) => (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-12 justify-center">{id}</Badge>
                      <span className="text-muted-foreground truncate max-w-[120px]">{label}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalAlerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Necessitam ação imediata</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-1">
          {/* Recent Proposals */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Propostas em Tramitação</CardTitle>
              <CardDescription>Últimas propostas adicionadas ao monitoramento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProposals && recentProposals.length > 0 ? (
                recentProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors bg-background/50"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{proposal.external_id}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {proposal.house === "camara" ? "Câmara" : "Senado"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {proposal.proposal_type}
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
