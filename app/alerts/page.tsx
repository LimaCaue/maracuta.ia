import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AlertsPage() {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
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
                <Link href="/viral">Gerar Alerta</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Alertas de Risco</h1>
            <p className="text-muted-foreground">Riscos legislativos detectados pela IA</p>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </div>

        <div className="grid gap-6">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getRiskIcon(alert.risk_level)}</div>
                    <div className="flex-1">
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
                          <h2 className="text-xl font-bold mb-2">{alert.title}</h2>
                          <p className="text-muted-foreground mb-4">{alert.description}</p>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Proposta:</span>
                              {/* @ts-ignore */}
                              <span className="text-muted-foreground">{alert.legislative_proposals?.external_id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">População Afetada:</span>
                              <span className="text-muted-foreground">
                                {alert.affected_population?.join(", ") || "Geral"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              {/* @ts-ignore */}
                              <Link href={`/proposal/${alert.legislative_proposals?.id || alert.proposal_id}`}>
                                Ver Proposta
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/alert/${alert.id}`}>Detalhes</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Nenhum alerta encontrado</h2>
                <p className="text-muted-foreground">Não há alertas de risco no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
