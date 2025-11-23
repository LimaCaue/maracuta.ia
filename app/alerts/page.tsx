"use client"

import { useState, useEffect, useRef } from "react"

import { Shield, AlertTriangle, Filter, ArrowRight, FileText, Siren } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AlertsPage() {

  const alerts = [
    {
      id: "lei-15224-2025",
      title: "Lei 15.224/2025 — Política Nacional de Combate ao Desperdício de Alimentos",
      description: `
Institui a Política Nacional de Combate à Perda e ao Desperdício de Alimentos, cria o Selo Doador de Alimentos e altera dispositivos tributários. A lei busca reduzir perdas na cadeia produtiva, estimular doações e fortalecer programas de segurança alimentar em todo o país.
      `,
      risk_level: "low",
      maracutaia_detected: false,
      risk_type: "social_policy",
      created_at: "2025-01-10",
    },
    {
      id: "lei-15223-2025",
      title: "Lei 15.223/2025 — Fortalecimento da Agricultura Familiar",
      description: `
Cria o Programa Nacional de Fortalecimento da Agricultura Familiar e moderniza o Plano Safra da Agricultura Familiar. A lei estabelece apoio financeiro, assistência técnica, linhas de crédito e governança via Conselho Nacional de Desenvolvimento Rural Sustentável.
      `,
      risk_level: "low",
      maracutaia_detected: false,
      risk_type: "economic_policy",
      created_at: "2025-02-04",
    },
    {
      id: "lei-15123-2025",
      title: "Lei 15.123/2025 — Violência Psicológica por Deepfake",
      description: `
Aumenta penas para crimes cometidos com uso de IA ou tecnologia deepfake contra mulheres. Torna agravante o uso de manipulação digital para ameaçar, difamar ou coagir vítimas, ampliando proteção e responsabilização penal.
      `,
      risk_level: "medium",
      maracutaia_detected: false,
      risk_type: "criminal_law",
      created_at: "2025-03-18",
    },
    {
      id: "lei-15125-2025",
      title: "Lei 15.125/2025 — Tornozeleira Eletrônica Para Agressores",
      description: `
Altera a Lei Maria da Penha para permitir monitoramento eletrônico obrigatório para agressores com medida protetiva. Emite alertas automáticos à polícia e à vítima em caso de aproximação indevida.
      `,
      risk_level: "medium",
      maracutaia_detected: false,
      risk_type: "criminal_law",
      created_at: "2025-04-01",
    },
    {
      id: "lcp-214-2025",
      title: "Lei Complementar 214/2025 — IBS, CBS e Imposto Seletivo",
      description: `
Estabelece o novo sistema tributário brasileiro, criando o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS). A transição prolongada e governança centralizada geraram críticas de especialistas.
      `,
      risk_level: "medium",
      maracutaia_detected: false,
      risk_type: "tax_law",
      created_at: "2025-06-12",
    },
    {
      id: "lei-15122-2025",
      title: "Lei 15.122/2025 — Tributação de Retaliação Internacional",
      description: `
Permite ao governo aplicar medidas tributárias de retaliação contra países que imponham sanções ou barreiras comerciais ao Brasil. Autoriza ajustes rápidos na CIDE e contribuições específicas, com potencial de tensão diplomática.
      `,
      risk_level: "high",
      maracutaia_detected: true,
      risk_type: "foreign_trade",
      created_at: "2025-07-05",
    },
    {
      id: "lcp-214-critico-2025",
      title: "Lei Complementar 214/2025 — Risco Crítico no Comitê do IBS",
      description: `
Avaliações técnicas apontam risco de concentração de poderes no Comitê Gestor do IBS, com potencial impacto federativo, risco de captura regulatória e desequilíbrios fiscais entre estados. A centralização pode reduzir autonomia tributária subnacional.
      `,
      risk_level: "critical",
      maracutaia_detected: true,
      risk_type: "fiscal_policy",
      created_at: "2025-08-20",
    }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-600"
      case "high": return "bg-orange-500"
      case "medium": return "bg-yellow-400"
      default: return "bg-blue-400"
    }
  }

  const getRiskBorder = (level: string) => {
    switch (level) {
      case "critical": return "border-red-600"
      case "high": return "border-orange-500"
      case "medium": return "border-yellow-400"
      default: return "border-blue-400"
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "critical": return "CRÍTICO"
      case "high": return "ALTO"
      case "medium": return "MÉDIO"
      default: return "BAIXO"
    }

    // Search and Group Creation State
    const [contactSearchQuery, setContactSearchQuery] = useState("")
    const [groupSearchQuery, setGroupSearchQuery] = useState("")
    const [modalContactSearchQuery, setModalContactSearchQuery] = useState("")
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [selectedContactsForGroup, setSelectedContactsForGroup] = useState<string[]>([])
    const [isCreatingGroup, setIsCreatingGroup] = useState(false)
    const [saveStatus, setSaveStatus] = useState<"idle" | "creatingAlert" | "updatingAlert" | "savingContent" | "done" | "error">("idle")
    const [saveError, setSaveError] = useState<string | null>(null)

  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] pb-20">

      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg">

              <img src="/favicon.ico" className="h-6 w-6" />
            </div>
            <Link href="/" className="text-2xl font-black">
              Maracuta<span className="text-pink-500">IA</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-4">
            <Link className="font-bold" href="/dashboard">Dashboard</Link>
            <Link className="font-bold" href="/alerts">Alertas</Link>
            <Link className="font-bold" href="/proposals">Propostas</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-black mb-2">Alertas de Risco</h1>
            <p className="text-xl text-zinc-600">
              Monitoramento de ameaças legislativas em tempo real.
            </p>
          </div>

          <Button
            className="h-12 px-6 bg-white text-black border-2 border-black rounded-xl font-bold"
          >
            <Filter className="mr-2 h-5 w-5" />
            Filtrar Riscos
          </Button>
        </div>

        <div className="grid gap-8">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border-4 ${getRiskBorder(alert.risk_level)} rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className={`${getRiskColor(alert.risk_level)} p-4 rounded-t-3xl flex justify-between`}>
                <span className="text-xl font-black text-white">{getRiskLabel(alert.risk_level)}</span>
                <div className="flex gap-2">
                  {alert.maracutaia_detected && (
                    <Badge className="bg-white text-black border-2 border-black font-black text-xs">
                      MARACUTAIA
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-black mb-3">{alert.title}</h3>
                <p className="text-lg text-zinc-700 mb-6 whitespace-pre-line">
                  {alert.description}
                </p>

                <div className="flex justify-between text-sm text-zinc-500 border-t-2 border-black pt-4">
                  <div>Detectado em: {alert.created_at}</div>

                  <Link href={`/analyze-mock?alertId=${alert.id}`}>
                    <Button className="bg-black text-white border-2 border-black rounded-xl font-bold">
                      Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
