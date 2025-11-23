"use client"

import { useState, useEffect, useRef } from "react"

import { Shield, Brain, FileText, TrendingUp, ArrowLeft, Sparkles, Zap, Scale, Siren } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type SearchParams = { alertId?: string }

export default async function AnalyzeMockPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { alertId } = await searchParams



  
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const audioContainerRef = useRef<HTMLDivElement | null>(null)
    const audioUrlRef = useRef<string | null>(null)
    const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; name: string; type: "contact" | "group" }[]>([])
    const [contacts, setContacts] = useState<any[]>([])
    const [isLoadingContacts, setIsLoadingContacts] = useState(false)
    const [groups, setGroups] = useState<any[]>([])
    const [isLoadingGroups, setIsLoadingGroups] = useState(false)
    const [isContactsOpen, setIsContactsOpen] = useState(false)
    const [isGroupsOpen, setIsGroupsOpen] = useState(false)
    const [selectedContactName, setSelectedContactName] = useState("")
    const [selectedGroupName, setSelectedGroupName] = useState("")
  
    // Search and Group Creation State
    const [contactSearchQuery, setContactSearchQuery] = useState("")
    const [groupSearchQuery, setGroupSearchQuery] = useState("")
    const [modalContactSearchQuery, setModalContactSearchQuery] = useState("")
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [selectedContactsForGroup, setSelectedContactsForGroup] = useState<string[]>([])
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle"|"creatingAlert"|"updatingAlert"|"savingContent"|"done"|"error">("idle")
    const [saveError, setSaveError] = useState<string|null>(null)
  
  const alerts = [
    {
      id: "lei-15224-2025",
      title: "Lei 15.224/2025 — Política Nacional de Combate ao Desperdício de Alimentos",
      description: `Institui a Política Nacional de Combate à Perda e ao Desperdício de Alimentos, cria o Selo Doador de Alimentos e altera dispositivos tributários.`,
      risk_level: "low",
      risk_type: "social_policy",
      maracutaia_detected: false,
      created_at: "2025-01-10",
    },
    {
      id: "lei-15223-2025",
      title: "Lei 15.223/2025 — Fortalecimento da Agricultura Familiar",
      description: `Cria o Programa Nacional de Fortalecimento da Agricultura Familiar e moderniza o Plano Safra.`,
      risk_level: "low",
      risk_type: "economic_policy",
      maracutaia_detected: false,
      created_at: "2025-02-04",
    },
    {
      id: "lei-15123-2025",
      title: "Lei 15.123/2025 — Violência Psicológica por Deepfake",
      description: `Aumenta penas para crimes cometidos com uso de IA ou deepfake contra mulheres.`,
      risk_level: "medium",
      risk_type: "criminal_law",
      maracutaia_detected: false,
      created_at: "2025-03-18",
    },
    {
      id: "lei-15125-2025",
      title: "Lei 15.125/2025 — Tornozeleira Eletrônica Para Agressores",
      description: `Autoriza monitoramento eletrônico obrigatório para agressores com medida protetiva.`,
      risk_level: "medium",
      risk_type: "criminal_law",
      maracutaia_detected: false,
      created_at: "2025-04-01",
    },
    {
      id: "lcp-214-2025",
      title: "Lei Complementar 214/2025 — IBS, CBS e Imposto Seletivo",
      description: `Cria IBS, CBS e Imposto Seletivo com governança centralizada e transição longa.`,
      risk_level: "medium",
      risk_type: "tax_law",
      maracutaia_detected: false,
      created_at: "2025-06-12",
    },
    {
      id: "lei-15122-2025",
      title: "Lei 15.122/2025 — Tributação de Retaliação Internacional",
      description: `Autoriza medidas tributárias rápidas de retaliação contra países que imponham sanções.`,
      risk_level: "high",
      risk_type: "foreign_trade",
      maracutaia_detected: true,
      created_at: "2025-07-05",
    },
    {
      id: "lcp-214-critico-2025",
      title: "Lei Complementar 214/2025 — Risco Crítico no Comitê do IBS",
      description: `Risco de concentração de poderes no Comitê Gestor do IBS, impacto federativo e captura regulatória.`,
      risk_level: "critical",
      risk_type: "fiscal_policy",
      maracutaia_detected: true,
      created_at: "2025-08-20",
    }
  ]

  const targetAlert = alerts.find(a => a.id === alertId)

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500 text-white border-red-700"
      case "high": return "bg-orange-500 text-white border-orange-700"
      case "medium": return "bg-yellow-400 text-black border-yellow-600"
      default: return "bg-blue-400 text-white border-blue-600"
    }
  }

  async function generateAI(alert: typeof alerts[number]) {
    const key = process.env.OPENAI_API_KEY
    if (!key) return null
    const systemPrompt = `Você é uma IA de auditoria legislativa. Retorne JSON: {summary, keyPoints[], recommendations[], legalReferences[]}. Linguagem clara. Máx 4 pontos e 3 referências.`
    const userContent = `Alerta:\n${JSON.stringify(alert, null, 2)}`
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ],
            temperature: 0.4,
            max_completion_tokens: 1200
        })
      })
      const j = await r.json()
      const content = j.choices?.[0]?.message?.content || ""
      const match = content.match(/{[\s\S]*}/)
      if (match) {
        try { return JSON.parse(match[0]) } catch {}
      }
      return null
    } catch {
      return null
    }
  }

  let aiAnalysis = {
    summary: "Resumo não disponível. Chave de API ausente ou erro na geração.",
    keyPoints: [
      "Risco potencial precisa de validação",
      "Necessidade de transparência regulatória",
      "Impacto social/econômico pendente de avaliação",
      "Monitorar alterações futuras"
    ],
    recommendations: [
      "Solicitar estudo de impacto",
      "Engajar sociedade civil",
      "Acompanhar tramitação semanal",
      "Produzir relatório técnico simplificado"
    ],
    legalReferences: [
      "Constituição Federal",
      "Lei de Responsabilidade Fiscal",
      "Lei Complementar 95/1998"
    ]
  }

  if (!targetAlert) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] text-black flex items-center justify-center">
        <div className="bg-white border-4 border-black rounded-3xl p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6">
          <h1 className="text-3xl font-black">Alerta não encontrado</h1>
          <Button asChild className="bg-black text-white border-2 border-black font-bold">
            <Link href="/alerts">Voltar</Link>
          </Button>
        </div>
      </div>
    )
  }

  const remote = await generateAI(targetAlert)
  if (remote) {
    aiAnalysis = {
      summary: remote.summary || aiAnalysis.summary,
      keyPoints: Array.isArray(remote.keyPoints) && remote.keyPoints.length ? remote.keyPoints.slice(0,4) : aiAnalysis.keyPoints,
      recommendations: Array.isArray(remote.recommendations) && remote.recommendations.length ? remote.recommendations : aiAnalysis.recommendations,
      legalReferences: Array.isArray(remote.legalReferences) && remote.legalReferences.length ? remote.legalReferences.slice(0,3) : aiAnalysis.legalReferences
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-yellow-200 pb-20">
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
            <Link href="/alerts">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar para Alertas
            </Link>
          </Button>

          <div className="space-y-8">
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
                    {targetAlert.id}
                  </Badge>
                  <Badge className={`${getRiskColor(targetAlert.risk_level)} rounded-lg px-3 py-1 font-bold text-sm`}>
                    {targetAlert.risk_level.toUpperCase()}
                  </Badge>
                  {targetAlert.maracutaia_detected && (
                    <Badge className="bg-red-600 text-white border-2 border-black rounded-lg px-3 py-1 font-black text-sm">
                      MARACUTAIA
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{targetAlert.title}</h1>
                <p className="text-lg font-medium text-zinc-600">
                  Análise gerada sobre alerta  utilizando inteligência artificial.
                </p>
              </div>
            </div>

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

            

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-yellow-300 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <TrendingUp className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-black">Pontos-Chave</h2>
                </div>
                <div className="p-6 md:p-8">
                  <ul className="space-y-4">
                    {aiAnalysis.keyPoints.map((p,i) => (
                      <li key={i} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-black text-white border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                          {i+1}
                        </div>
                        <span className="text-lg font-medium text-zinc-700 pt-0.5">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-green-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <Sparkles className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Recomendações</h2>
                </div>
                <div className="p-6 md:p-8">
                  <ul className="space-y-4">
                    {aiAnalysis.recommendations.map((r,i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Zap className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="text-lg font-medium text-zinc-700">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="bg-gray-200 border-b-4 border-black p-6 flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                  <Scale className="h-6 w-6 text-black" />
                </div>
                <h2 className="text-2xl font-black text-black">Referências Legais</h2>
              </div>
              <div className="p-6 md:p-8">
                <ul className="space-y-3">
                  {aiAnalysis.legalReferences.map((ref,i) => (
                    <li key={i} className="text-lg font-medium text-zinc-600 flex items-start gap-3 bg-gray-50 p-3 rounded-xl border-2 border-transparent hover:border-black transition-all">
                      <span className="text-black font-black">§</span>
                      <span>{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-pink-100 border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <h2 className="text-3xl font-black mb-4">Próximos Passos</h2>
              <p className="text-xl font-medium text-zinc-600 mb-8">Use este alerta  para gerar conteúdo e monitorar.</p>
              <Button
                className="w-full md:w-auto h-14 text-lg bg-black text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] transition-all"
                asChild
              >
                <Link href={`/viral/create/mock?alert=${targetAlert.id}&type=audio`}>
                  <Shield className="mr-2 h-5 w-5" />
                  Gerar Alerta Viral Agora
                </Link>
              </Button>
              <p className="text-sm font-bold text-zinc-500 mt-4">
                
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}