import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Brain, FileText, TrendingUp, ArrowLeft, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { notFound } from "next/navigation"
import process from "process"

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

    // ---------- INTEGRAÇÃO OPENAI + PERSISTÊNCIA ----------
    // Coloque sua chave em .env.local: OPENAI_API_KEY=sk-...
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY

    async function generateAnalysisWithOpenAI(proposalObj: any) {
        if (!OPENAI_API_KEY) return null

        const systemPrompt = `Você é uma inteligência artificial especializada em auditoria legislativa e comunicação cívica. Sua tarefa é analisar o conteúdo de uma proposta legislativa localizada no endpoint /analyze/[id] e gerar um relatório detalhado com os seguintes campos:

🔍 Título do Relatório:
"Análise Detalhada com IA – Auditoria de Riscos Legislativos"

📌 Resumo Executivo:
Descreva em até 3 frases os riscos mais relevantes da proposta, com linguagem acessível à sociedade civil.

📌 Pontos-Chave Identificados:
Liste até 4 riscos específicos, como:
1. Impacto em direitos fundamentais
2. Alterações em leis consolidadas sem debate público
3. Conflito com tratados internacionais
4. Falta de análise orçamentária

📌 Recomendações:
Sugira ações práticas, como:
- Realização de audiências públicas
- Solicitação de parecer técnico
- Avaliação de impacto em grupos vulneráveis
- Definição de vacatio legis adequada

📌 Referências Legais Relevantes:
Inclua até 3 normas ou tratados que se relacionam com os riscos identificados (ex.: Constituição Federal, Lei Complementar 95/1998, Convenção Americana de Direitos Humanos).

📌 Próximos Passos:
Simule botões de ação como:
[Gerar Relatório Completo] [Compartilhar Análise] [Ver Proposta Original]

⚠️ Importante:
- Use linguagem clara e acessível, como se estivesse explicando para um cidadão comum.
- Evite jargões jurídicos sem explicação.
- Se possível, traduza o risco para um exemplo prático: “Essa lei pode permitir aumento da conta de luz sem aviso.”

Retorne apenas um JSON com os campos: summary (string), keyPoints (array de strings, até 4), recommendations (array de strings), legalReferences (array de strings, até 3).`

        const userContent = `Analise a seguinte proposta (JSON):\n${JSON.stringify(proposalObj)}`

        const body = {
            model: "gpt-5-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            max_completion_tokens: 2000,
            temperature: 1.0,
        }

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(body)
        })

        if (!res.ok) {
            const txt = await res.text()
            throw new Error(`OpenAI error: ${res.status} ${txt}`)
        }

        const data = await res.json()
        const content = data?.choices?.[0]?.message?.content
        if (!content) return null

        try {
            return JSON.parse(content)
        } catch {
            const m = content.match(/{[\s\S]*}/)
            if (m) {
                try {
                    return JSON.parse(m[0])
                } catch { }
            }
        }
        return null
    }

    // Tenta recuperar análise persistida; se não existir, gera e salva
    let aiAnalysis = {
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

    try {
        // verifica existência de análise persistida
        const { data: persisted, error: fetchErr } = await supabase
            .from("proposal_analyses")
            .select("analysis")
            .eq("proposal_id", id)
            .single()

        if (fetchErr && fetchErr.code !== "PGRST116") {
            // se houver erro inesperado, lança para fallback
            console.error("Supabase fetch analysis error:", fetchErr)
        }

        if (persisted && persisted.analysis) {
            const remote = persisted.analysis
            aiAnalysis = {
                summary: remote.summary ?? aiAnalysis.summary,
                keyPoints: Array.isArray(remote.keyPoints) ? remote.keyPoints.slice(0, 4) : aiAnalysis.keyPoints,
                recommendations: Array.isArray(remote.recommendations) ? remote.recommendations : aiAnalysis.recommendations,
                legalReferences: Array.isArray(remote.legalReferences) ? remote.legalReferences.slice(0, 3) : aiAnalysis.legalReferences
            }
        } else {
            // só gera análise quando proposta é acessada (comportamento solicitado)
            if (OPENAI_API_KEY) {
                try {
                    const remote = await generateAnalysisWithOpenAI(proposal)
                    if (remote && remote.summary) {
                        const finalAnalysis = {
                            summary: remote.summary,
                            keyPoints: Array.isArray(remote.keyPoints) ? remote.keyPoints.slice(0, 4) : aiAnalysis.keyPoints,
                            recommendations: Array.isArray(remote.recommendations) ? remote.recommendations : aiAnalysis.recommendations,
                            legalReferences: Array.isArray(remote.legalReferences) ? remote.legalReferences.slice(0, 3) : aiAnalysis.legalReferences
                        }

                        // salvar no Supabase para persistência "ad aeternum"
                        await supabase.from("proposal_analyses").insert({
                            proposal_id: id,
                            analysis: finalAnalysis,
                            created_at: new Date().toISOString()
                        })

                        aiAnalysis = finalAnalysis
                    }
                } catch (err) {
                    console.error("OpenAI generation/persist error:", err)
                }
            }
        }
    } catch (err) {
        console.error("Analysis workflow error:", err)
    }

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
                        </nav>
                    </div>
                </div>
            </header>

            <main className="relative z-10 container mx-auto px-4 py-8">
                <Button variant="ghost" asChild className="mb-6">
                    <Link href={`/proposal/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Proposta
                    </Link>
                </Button>

                <div className="space-y-6">
                    {/* Header com informações da proposta */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm">
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
                    <Card className="bg-card/50 backdrop-blur-sm">
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
                        <Card className="bg-card/50 backdrop-blur-sm">
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
                        <Card className="bg-card/50 backdrop-blur-sm">
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
                        <Card className="bg-card/50 backdrop-blur-sm">
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
                    <Card className="bg-card/50 backdrop-blur-sm">
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
                    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Próximos Passos</CardTitle>
                            <CardDescription>Crie conteúdo viral com base no alerta desta análise</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                asChild
                                disabled={!alerts || alerts.length === 0}
                            >
                                <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio&source=analyze&originId=${id}`}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Criar Alerta
                                </Link>
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Usa o primeiro alerta gerado nesta análise; você pode trocar na página de criação.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
