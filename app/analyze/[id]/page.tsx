import { createClient } from "@/lib/supabase/server"
import { Shield, AlertTriangle, Brain, FileText, TrendingUp, ArrowLeft, Sparkles, Zap, Scale, Siren } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
                return "bg-red-500 text-white border-red-700"
            case "high":
                return "bg-orange-500 text-white border-orange-700"
            case "medium":
                return "bg-yellow-400 text-black border-yellow-600"
            default:
                return "bg-blue-400 text-white border-blue-600"
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
            model: "gpt-4o-mini",
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
        <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-yellow-200 pb-20">

            {/* Header Neo-Brutalism */}
            <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Shield className="h-6 w-6" />
                        </div>
                        <Link href="/" className="text-2xl font-black tracking-tight hover:underline decoration-4 decoration-pink-500">
                            Maracuta<span className="text-pink-500">IA</span>
                        </Link>
                    </div>
                    <nav className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
                            <Link href="/alerts">Alertas</Link>
                        </Button>
                        <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
                            <Link href="/proposals">Propostas</Link>
                        </Button>
                        <Button className="bg-pink-500 text-black border-2 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" asChild>
                            <Link href="/viral">Gerar Alerta</Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                <div className="w-full max-w-[1200px] mx-auto">
                    <Button variant="ghost" asChild className="mb-8 font-bold hover:bg-yellow-200 border-2 border-transparent hover:border-black transition-all">
                        <Link href={`/proposal/${id}`}>
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Voltar para Proposta
                        </Link>
                    </Button>

                    <div className="space-y-8">
                        {/* Header com informações da proposta */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-purple-500 border-b-4 border-black p-6 flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                    <Brain className="h-6 w-6 text-black" />
                                </div>
                                <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Análise Detalhada com IA</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <Badge className="bg-black text-white border-2 border-black rounded-lg px-3 py-1 font-mono font-bold text-sm">
                                        {proposal.external_id}
                                    </Badge>
                                    <Badge className="bg-yellow-300 text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                                        {proposal.house === "camara" ? "Câmara dos Deputados" : "Senado Federal"}
                                    </Badge>
                                    <Badge className="bg-white text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-sm">
                                        {proposal.proposal_type}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{proposal.title}</h1>
                                <p className="text-lg font-medium text-zinc-600">
                                    Análise aprofundada utilizando inteligência artificial para identificar riscos e impactos.
                                </p>
                            </div>
                        </div>

                        {/* Resumo da Análise */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-blue-400 border-b-4 border-black p-6 flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                    <FileText className="h-6 w-6 text-black" />
                                </div>
                                <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Resumo Executivo</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <p className="text-xl font-medium leading-relaxed">{aiAnalysis.summary}</p>
                            </div>
                        </div>

                        {/* Alertas Detectados */}
                        {alerts && alerts.length > 0 && (
                            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="bg-red-500 border-b-4 border-black p-6 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                        <Siren className="h-6 w-6 text-black" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Alertas Identificados ({alerts.length})</h2>
                                </div>
                                <div className="p-6 md:p-8 space-y-4">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="bg-gray-50 border-2 border-black rounded-xl p-6 hover:bg-white transition-colors">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <Badge className={`${getRiskColor(alert.risk_level)} border-2 rounded-lg px-3 py-1 font-black text-xs`}>
                                                    {alert.risk_level.toUpperCase()}
                                                </Badge>
                                                <Badge className="bg-white text-black border-2 border-black rounded-lg px-3 py-1 font-bold text-xs">
                                                    {alert.risk_type.replace("_", " ").toUpperCase()}
                                                </Badge>
                                                {alert.jabuti_detected && (
                                                    <Badge className="bg-green-500 text-white border-2 border-black rounded-lg px-3 py-1 font-black text-xs">
                                                        🐢 JABUTI
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-black mb-2">{alert.title}</h3>
                                            <p className="text-base font-medium text-zinc-600 mb-3">{alert.description}</p>
                                            {alert.affected_population && alert.affected_population.length > 0 && (
                                                <div className="text-sm font-bold text-zinc-500 bg-white border-2 border-black rounded-lg p-2 inline-block">
                                                    <span className="text-black">População Afetada:</span> {alert.affected_population.join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Pontos-Chave */}
                            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="bg-yellow-300 border-b-4 border-black p-6 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                        <TrendingUp className="h-6 w-6 text-black" />
                                    </div>
                                    <h2 className="text-2xl font-black text-black">Pontos-Chave</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <ul className="space-y-4">
                                        {aiAnalysis.keyPoints.map((point, index) => (
                                            <li key={index} className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-black text-white border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                                    {index + 1}
                                                </div>
                                                <span className="text-lg font-medium text-zinc-700 pt-0.5">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recomendações */}
                            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <div className="bg-green-400 border-b-4 border-black p-6 flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                        <Sparkles className="h-6 w-6 text-black" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Recomendações</h2>
                                </div>
                                <div className="p-6 md:p-8">
                                    <ul className="space-y-4">
                                        {aiAnalysis.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <Zap className="h-6 w-6 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />
                                                <span className="text-lg font-medium text-zinc-700">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Referências Legais */}
                        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="bg-gray-200 border-b-4 border-black p-6 flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                    <Scale className="h-6 w-6 text-black" />
                                </div>
                                <h2 className="text-2xl font-black text-black">Referências Legais</h2>
                            </div>
                            <div className="p-6 md:p-8">
                                <ul className="space-y-3">
                                    {aiAnalysis.legalReferences.map((ref, index) => (
                                        <li key={index} className="text-lg font-medium text-zinc-600 flex items-start gap-3 bg-gray-50 p-3 rounded-xl border-2 border-transparent hover:border-black transition-all">
                                            <span className="text-black font-black">§</span>
                                            <span>{ref}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="bg-pink-100 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
                            <h2 className="text-3xl font-black mb-4">Próximos Passos</h2>
                            <p className="text-xl font-medium text-zinc-600 mb-8">Crie conteúdo viral com base no alerta desta análise e espalhe a verdade.</p>

                            <Button
                                className="w-full md:w-auto h-14 text-lg bg-black text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                asChild
                                disabled={!alerts || alerts.length === 0}
                            >
                                <Link href={`/viral/create?alert=${alerts?.[0]?.id}&type=audio&source=analyze&originId=${id}`}>
                                    <Shield className="mr-2 h-5 w-5" />
                                    Gerar Alerta Viral Agora
                                </Link>
                            </Button>
                            <p className="text-sm font-bold text-zinc-500 mt-4">
                                *Usa o primeiro alerta gerado nesta análise.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
