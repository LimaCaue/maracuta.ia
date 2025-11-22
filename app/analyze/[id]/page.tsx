import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Brain, FileText, TrendingUp, ArrowLeft, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function AnalyzeDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    // Simulação de análise de IA (você pode integrar com uma API de IA real posteriormente)
    const aiAnalysis = {
        summary: "Esta proposta legislativa apresenta riscos significativos que requerem atenção especial da sociedade civil.",
        keyPoints: [
            "Possível impacto em direitos fundamentais garantidos pela Constituição",
            "Alterações em legislação consolidada sem amplo debate público",
            "Potencial conflito com tratados internacionais ratificados pelo Brasil",
            "Necessidade de análise de impacto orçamentário detalhada"
        ],
        recommendations: [
            "Realizar audiências públicas com participação de especialistas e sociedade civil",
            "Solicitar parecer técnico de órgãos competentes",
            "Avaliar impacto em grupos vulneráveis",
            "Considerar período de vacatio legis adequado para adaptação"
        ],
        legalReferences: [
            "Constituição Federal, Art. 5º - Direitos e Garantias Fundamentais",
            "Lei Complementar 95/1998 - Elaboração de Leis",
            "Convenção Americana de Direitos Humanos (Pacto de San José da Costa Rica)"
        ]
    }

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
                    <Link href={`/proposal/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Proposta
                    </Link>
                </Button>

                <div className="space-y-6">
                    {/* Header com informações da proposta */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Brain className="h-8 w-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-2xl">Análise Detalhada com IA</CardTitle>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Análise aprofundada utilizando inteligência artificial para identificar riscos e impactos
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono">
                                    {proposal.external_id}
                                </Badge>
                                <Badge variant="secondary">
                                    {proposal.house === "camara" ? "Câmara dos Deputados" : "Senado Federal"}
                                </Badge>
                                <Badge variant="outline">{proposal.proposal_type}</Badge>
                            </div>
                            <h2 className="text-xl font-semibold mt-4">{proposal.title}</h2>
                        </CardContent>
                    </Card>

                    {/* Resumo da Análise */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Resumo Executivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p>
                        </CardContent>
                    </Card>

                    {/* Alertas Detectados */}
                    {alerts && alerts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    Alertas Identificados ({alerts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="border border-border rounded-lg p-4 space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className={getRiskColor(alert.risk_level)}>
                                                {alert.risk_level.toUpperCase()}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {alert.risk_type.replace("_", " ").toUpperCase()}
                                            </Badge>
                                            {alert.jabuti_detected && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Jabuti Detectado
                                                </Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-2">{alert.title}</h3>
                                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                                        </div>
                                        {alert.affected_population && alert.affected_population.length > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-medium">População Afetada:</span>{" "}
                                                {alert.affected_population.join(", ")}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Pontos-Chave */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Pontos-Chave Identificados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {aiAnalysis.keyPoints.map((point, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm text-muted-foreground pt-0.5">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Recomendações */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    Recomendações
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {aiAnalysis.recommendations.map((rec, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <span className="text-sm text-muted-foreground">{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Referências Legais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Referências Legais Relevantes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {aiAnalysis.legalReferences.map((ref, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-1">→</span>
                                        <span>{ref}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Ações */}
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle>Próximos Passos</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button variant="default">
                                <FileText className="mr-2 h-4 w-4" />
                                Gerar Relatório Completo
                            </Button>
                            <Button variant="outline">
                                Compartilhar Análise
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/proposal/${id}`}>Ver Proposta Original</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
