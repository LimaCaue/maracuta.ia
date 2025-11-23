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
    <div className="min-h-screen">
      {/* Header */}
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
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getRiskColor(alert.risk_level)}>
                          {alert.risk_level?.toUpperCase() || "N/A"}
                        </Badge>
                        {alert.risk_type && (
                          <Badge variant="outline">
                            {String(alert.risk_type).replace(/_/g, " ").toUpperCase()}
                          </Badge>
                        )}
                        {alert.jabuti_detected && (
                          <Badge variant="destructive">JABUTI</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {alert.title || "Alerta sem título"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {alert.description || "Sem descrição."}
                      </p>
                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div className="text-xs text-muted-foreground">
                          Criado: {new Date(alert.created_at).toLocaleString("pt-BR")}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/proposal/${alert.proposal_id}`}>Proposta</Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/alert/${alert.id}`}>Detalhes</Link>
                          </Button>
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
