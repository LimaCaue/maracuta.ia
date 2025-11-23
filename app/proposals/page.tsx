import { createClient } from "@/lib/supabase/server"
import { Shield, FileText, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function ProposalsPage() {
  const supabase = await createClient()

  const { data: proposals } = await supabase
    .from("legislative_proposals")
    .select(`
      *,
      risk_alerts (
        id,
        risk_level,
        jabuti_detected
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
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
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Propostas Legislativas</h1>
            <p className="text-muted-foreground">Monitoramento de propostas da Câmara e Senado</p>
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar propostas..." className="pl-10" />
            </div>
            <Button variant="outline">Filtrar</Button>
          </div>
        </div>

        <div className="grid gap-4">
          {proposals && proposals.length > 0 ? (
            proposals.map((proposal) => {
              // @ts-ignore
              const hasAlerts = proposal.risk_alerts && proposal.risk_alerts.length > 0
              // @ts-ignore
              const criticalAlert = proposal.risk_alerts?.some((a) => a.risk_level === "critical")
              // @ts-ignore
              const hasJabuti = proposal.risk_alerts?.some((a) => a.jabuti_detected)

              return (
                <Card
                  key={proposal.id}
                  className={`hover:shadow-lg transition-shadow ${criticalAlert ? "border-red-500/50" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {proposal.external_id}
                          </Badge>
                          <Badge variant="secondary">{proposal.house === "camara" ? "Câmara" : "Senado"}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {proposal.proposal_type}
                          </Badge>
                          {hasAlerts && (
                            <Badge variant="destructive" className="text-xs">
                              {/* @ts-ignore */}
                              {proposal.risk_alerts.length} Alerta(s)
                            </Badge>
                          )}
                          {hasJabuti && (
                            <Badge variant="destructive" className="text-xs">
                              Jabuti Detectado
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-xl font-bold mb-2">{proposal.title}</h2>
                        <p className="text-muted-foreground mb-4 line-clamp-2">{proposal.description}</p>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Autor:</span>
                            <span>{proposal.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Status:</span>
                            <span className="capitalize">{proposal.status.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      <Button asChild>
                        <Link href={`/proposal/${proposal.id}`}>Ver Detalhes</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Nenhuma proposta encontrada</h2>
                <p className="text-muted-foreground">Não há propostas sendo monitoradas no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
