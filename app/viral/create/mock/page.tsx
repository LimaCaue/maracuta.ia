"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Shield,
  Sparkles,
  Wand2,
  Volume2,
  Copy,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  BrainCircuit,
  Mic,
  Loader2,
  FileText,
  List,
  Plus,
  Trash2,
  Zap,
  ArrowRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"

/**
 * Página mock completa (opção A)
 * - Mesmo layout e funcionalidades da versão real
 * - Usa dados mockados (array `MOCK_ALERTS`) em vez do Supabase
 * - Gera script via função mock (com delay) e TTS "simulado" (cria Blob de audio)
 * - Envio WhatsApp / grupos / contatos são simulados via delays e retornos falsos
 *
 * Substitua o arquivo real por este quando quiser testar sem Supabase.
 */

/* -------------------------
   MOCK DATA
   ------------------------- */
const MOCK_ALERTS = [
  {
    id: "lei-15224-2025",
    title: "Lei 15.224/2025 — Política Nacional de Combate ao Desperdício de Alimentos",
    description: `Institui a Política Nacional de Combate à Perda e ao Desperdício de Alimentos, cria o Selo Doador de Alimentos e altera dispositivos tributários. A lei busca reduzir perdas na cadeia produtiva, estimular doações e fortalecer programas de segurança alimentar em todo o país.`,
    risk_level: "low",
    jabuti_detected: false,
    legislative_proposals: { external_id: "PLN-15224" },
    created_at: "2025-01-10"
  },
  {
    id: "lei-15223-2025",
    title: "Lei 15.223/2025 — Fortalecimento da Agricultura Familiar",
    description: `Cria o Programa Nacional de Fortalecimento da Agricultura Familiar, moderniza o Plano Safra e estabelece assistência técnica e linhas de crédito. Objetiva aumentar a resiliência e a sustentabilidade de pequenos agricultores.`,
    risk_level: "low",
    jabuti_detected: false,
    legislative_proposals: { external_id: "PLN-15223" },
    created_at: "2025-02-04"
  },
  {
    id: "lei-15123-2025",
    title: "Lei 15.123/2025 — Violência Psicológica por Deepfake",
    description: `Agravante penal para crimes cometidos com uso de IA/deepfake contra mulheres. Torna mais severas as penas quando houver manipulação de imagens, áudios ou materiais digitais com a finalidade de coagir, difamar ou ameaçar.`,
    risk_level: "medium",
    jabuti_detected: false,
    legislative_proposals: { external_id: "PL-15123" },
    created_at: "2025-03-18"
  },
  {
    id: "lei-15125-2025",
    title: "Lei 15.125/2025 — Tornozeleira Eletrônica Para Agressores",
    description: `Altera a Lei Maria da Penha para permitir monitoramento eletrônico obrigatório para agressores com medida protetiva, com alertas automáticos à polícia e à vítima em caso de aproximação indevida.`,
    risk_level: "medium",
    jabuti_detected: false,
    legislative_proposals: { external_id: "PL-15125" },
    created_at: "2025-04-01"
  },
  {
    id: "lcp-214-2025",
    title: "Lei Complementar 214/2025 — IBS, CBS e Imposto Seletivo",
    description: `Estabelece o novo sistema tributário brasileiro, criando o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS). A transição e a governança centralizada provocaram debates técnicos e políticos.`,
    risk_level: "medium",
    jabuti_detected: false,
    legislative_proposals: { external_id: "LCP-214" },
    created_at: "2025-06-12"
  },
  {
    id: "lei-15122-2025",
    title: "Lei 15.122/2025 — Tributação de Retaliação Internacional",
    description: `Permite ao governo aplicar medidas tributárias de retaliação contra países que imponham barreiras comerciais ao Brasil. Pode ser usada como instrumento diplomático e econômico.`,
    risk_level: "high",
    jabuti_detected: true,
    legislative_proposals: { external_id: "PL-15122" },
    created_at: "2025-07-05"
  },
  {
    id: "lcp-214-critico-2025",
    title: "Lei Complementar 214/2025 — Risco Crítico no Comitê do IBS",
    description: `Avaliações técnicas apontam risco de concentração de poderes no Comitê Gestor do IBS, com potencial impacto federativo e captura regulatória no processo de governança tributária.`,
    risk_level: "critical",
    jabuti_detected: true,
    legislative_proposals: { external_id: "LCP-214-CRIT" },
    created_at: "2025-08-20"
  }
]

/* -------------------------
   HELPERS
   ------------------------- */
function getRiskColor(level: string) {
  switch (level) {
    case "critical":
      return "bg-red-600"
    case "high":
      return "bg-orange-500"
    case "medium":
      return "bg-yellow-400"
    default:
      return "bg-blue-400"
  }
}

function getRiskLabel(level: string) {
  switch (level) {
    case "critical":
      return "CRÍTICO"
    case "high":
      return "ALTO"
    case "medium":
      return "MÉDIO"
    default:
      return "BAIXO"
  }
}

/* -------------------------
   MOCK "SERVICES" (simulate network/API)
   ------------------------- */

async function fetchScript(alertOrProposal: any, tone: string, pollOpts: string[]) {
  const res = await fetch("/api/viral/script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alert: alertOrProposal, tone, pollOptions: pollOpts })
  })
  if (!res.ok) throw new Error("Falha ao gerar script")
  const data = await res.json()
  return data.script as string
}

async function fetchTTS(script: string) {
  const res = await fetch("/api/viral/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script })
  })
  if (!res.ok) throw new Error("Falha TTS")
  const { audioBase64 } = await res.json()
  const blob = b64ToBlob(audioBase64, "audio/mpeg")
  return blob
}

function b64ToBlob(b64: string, type: string) {
  const byteChars = atob(b64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type })
}

/* -------------------------
   COMPONENT
   ------------------------- */

export default function ViralCreateMockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // read params like real page
  const rawAlert = searchParams?.get?.("alert")
  const alertIdParam = rawAlert === "undefined" || rawAlert === "null" ? null : rawAlert
  const [alert, setAlert] = useState<any | null>(null)
  const [proposal, setProposal] = useState<any | null>(null)

  const [tone, setTone] = useState("urgent")
  const [targetAudience, setTargetAudience] = useState("geral")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioContainerRef = useRef<HTMLDivElement | null>(null)

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)

  const [sendPoll, setSendPoll] = useState(true)
  const [pollQuestion, setPollQuestion] = useState("Qual sua opinião sobre isso?")
  const [pollOptions, setPollOptions] = useState<string[]>([
    "1 - Concordo",
    "2 - Concordo parcialmente",
    "3 - Neutro",
    "4 - Discordo parcialmente",
    "5 - Discordo"
  ])


  const [contactSearchQuery, setContactSearchQuery] = useState("")
  const [groupSearchQuery, setGroupSearchQuery] = useState("")
  const [modalContactSearchQuery, setModalContactSearchQuery] = useState("")
  const [contacts, setContacts] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isContactsOpen, setIsContactsOpen] = useState(false)
  const [isGroupsOpen, setIsGroupsOpen] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; name: string; type: "contact" | "group" }[]>([])
  const [selectedContactsForGroup, setSelectedContactsForGroup] = useState<string[]>([])
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "creatingAlert" | "updatingAlert" | "savingContent" | "done" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)





  useEffect(() => {
    // load mock alert/proposal from params or fallback to first mock
    const id = alertIdParam || undefined
    const found = MOCK_ALERTS.find((a) => a.id === id) || MOCK_ALERTS[0]
    setAlert(found)
    setProposal(null)
  }, [alertIdParam])

  /* -------------------------
     GENERATE SCRIPT (mocked)
     ------------------------- */
  const generateScript = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const source = alert || proposal
      if (!source) return
      const script = await fetchScript(source, tone, sendPoll ? pollOptions : [])
      setGeneratedScript(script)
      setTimeout(() => generateAudioFromScript(script), 400)
    } catch (e) {
      setGeneratedScript("Erro ao gerar script.")
    } finally {
      setIsGenerating(false)
    }
  }

  /* -------------------------
     MOCK TTS: generate playable blob from text
     ------------------------- */
  const generateAudioFromScript = async (scriptText?: string) => {
    const script = scriptText || generatedScript
    if (!script) return
    setIsGeneratingAudio(true)
    try {
      const blob = await fetchTTS(script)
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      setAudioUrl(url)
      setTimeout(() => {
        audioContainerRef.current?.scrollIntoView({ behavior: "smooth" })
        audioRef.current?.play().catch(() => {})
      }, 150)
    } catch {
      // silencioso
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const downloadAudio = () => {
    if (!audioUrl) return
    const a = document.createElement("a")
    a.href = audioUrl
    a.download = `alert_audio_${alert?.id ?? "script"}.mp3`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  /* -------------------------
     MOCK: contacts / groups / send whatsapp
     ------------------------- */
  const loadContacts = async () => {
    setIsLoadingContacts(true)
    try {
      const data = await mockFetchContacts()
      setContacts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  const loadGroups = async () => {
    setIsLoadingGroups(true)
    try {
      const data = await mockFetchGroups()
      setGroups(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const sendToWhatsapp = async () => {
    if ((!generatedScript && !audioUrl) || selectedRecipients.length === 0) {
      window.alert("Selecione destinatários e gere conteúdo.")
      return
    }
    setIsSendingWhatsapp(true)
    try {
      let audioBase64: string | undefined
      if (audioUrl) {
        const blob = await fetch(audioUrl).then(r => r.blob())
        audioBase64 = await blobToBase64(blob) // data:audio/mpeg;base64,...
      }

      const phones = selectedRecipients.map(r => r.id)
      const poll = sendPoll
        ? { question: pollQuestion, options: pollOptions.filter(o => o.trim().length) }
        : undefined

      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: phones,
            text: generatedScript,
            audio: audioBase64,
            poll
        })
      })
      const data = await res.json()

      const sucesso = data.successCount ?? (Array.isArray(data.results)
        ? data.results.filter((r: any) =>
            ["sent","sent_as_document"].includes(r.status)
          ).length
        : 0)

      const falhas = data.failCount ?? (Array.isArray(data.results)
        ? data.results.filter((r: any) => r.status === "error").length
        : 0)

      window.alert(`Enviado. Sucesso: ${sucesso}, Falhas: ${falhas}`)
    } catch (e) {
      window.alert("Erro ao enviar.")
    } finally {
      setIsSendingWhatsapp(false)
    }
  }

  /* -------------------------
     SAVE (mock persist)
     ------------------------- */
  const saveViralContent = async () => {
    if (!generatedScript) return
    setIsSaving(true)
    setSaveStatus("creatingAlert")
    setSaveError(null)
    try {
      // simulate insert/update latency
      await new Promise((r) => setTimeout(r, 700))
      setSaveStatus("savingContent")
      await new Promise((r) => setTimeout(r, 400))
      setSaveStatus("done")
      // simulate redirect after save
      setTimeout(() => {
        router.push("/alerts")
      }, 700)
    } catch (e: any) {
      setSaveStatus("error")
      setSaveError(e?.message || "Erro ao salvar (simulado).")
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = () => {
    if (!generatedScript) return
    navigator.clipboard.writeText(generatedScript)
  }

  const handleCreateGroup = async () => {
    if (!newGroupName || selectedContactsForGroup.length === 0) {
      window.alert("Nome do grupo e pelo menos um contato são obrigatórios.")
      return
    }
    setIsCreatingGroup(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      window.alert(`Grupo "${newGroupName}" criado (simulado).`)
      setIsCreateGroupModalOpen(false)
      setNewGroupName("")
      setSelectedContactsForGroup([])
    } catch (e) {
      window.alert("Erro ao criar grupo (simulado).")
    } finally {
      setIsCreatingGroup(false)
    }
  }

  /* creation state used by modal */
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

  /* -------------------------
     RENDER
     ------------------------- */

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-black font-sans selection:bg-yellow-200 pb-20">

      {/* Header Neo-Brutalism */}
      <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">Maracuta<span className="text-pink-500">IA</span></span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" className="font-bold hover:bg-yellow-200 hover:text-black border-2 border-transparent hover:border-black transition-all" asChild>
              <Link href="/viral">Voltar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-block bg-yellow-300 border-2 border-black px-4 py-1 rounded-full font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-2">
                Viral Mode 🚀
              </div>
              <h1 className="text-5xl font-black mb-2">Criar Conteúdo</h1>
              <p className="text-xl font-medium text-zinc-600">Gere alertas virais com estilo (mockado).</p>
            </div>

            {/* Filter button with black text as requested */}
            <Button
              className="h-12 px-6 bg-white text-black border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => window.alert("Filtro (simulado)")}
            >
              <List className="mr-2 h-5 w-5" />
              Filtrar Riscos
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left column: config */}
            <div className="space-y-8">

              {/* Card: Proposta / Alvo do alerta (mocked) */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-blue-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Alvo do Alerta</h2>
                </div>
                <div className="p-6">
                  {alert ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white px-3 py-1 rounded-lg font-bold text-sm">
                          {alert?.legislative_proposals?.external_id ?? "ID"}
                        </span>
                        <span className="bg-green-400 text-black border-2 border-black px-3 py-1 rounded-lg font-bold text-sm">
                          Vinculado
                        </span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight">{alert?.title}</h3>
                      <Link href={`/proposal/${alert?.id ?? ""}`} className="text-pink-600 font-black underline decoration-4 decoration-pink-300 hover:decoration-pink-600 transition-all w-fit">
                        Ver detalhes da proposta →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500 font-bold">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      Carregando dados...
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Configurações */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-pink-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <Wand2 className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Configurações</h2>
                </div>

                <div className="p-6 space-y-8">
                  <div>
                    <Label className="mb-4 block text-lg font-black">Tipo de Conteúdo</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 bg-yellow-300 border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Volume2 className="h-5 w-5" />
                        <span className="font-bold">Áudio</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-50">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-bold">Mensagem</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t-4 border-black border-dashed">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg font-black flex items-center gap-2">
                        <List className="h-5 w-5" />
                        Enquete WhatsApp
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sendPoll"
                          checked={sendPoll}
                          onChange={(e) => setSendPoll(e.target.checked)}
                          className="h-6 w-6 rounded-lg border-2 border-black text-black focus:ring-0 checked:bg-black"
                        />
                        <Label htmlFor="sendPoll" className="font-bold cursor-pointer">Incluir</Label>
                      </div>
                    </div>

                    {sendPoll && (
                      <div className="space-y-4 pl-4 border-l-4 border-black">
                        <div>
                          <Label className="font-bold mb-2 block">Pergunta</Label>
                          <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="bg-gray-50 border-2 border-black rounded-xl font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold mb-2 block">Opções</Label>
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input value={option} onChange={(e) => {
                                const newOptions = [...pollOptions]
                                newOptions[index] = e.target.value
                                setPollOptions(newOptions)
                              }} className="bg-gray-50 border-2 border-black rounded-xl font-medium" />
                              {pollOptions.length > 2 && (
                                <Button size="icon" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))} className="bg-red-400 border-2 border-black text-black hover:bg-red-500 rounded-xl">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 12 && (
                            <Button variant="outline" onClick={() => setPollOptions([...pollOptions, ""])} className="w-full border-2 border-black border-dashed rounded-xl font-bold hover:bg-gray-100">
                              <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button onClick={generateScript} disabled={isGenerating || isGeneratingAudio || (!alert && !proposal)} className="w-full h-14 text-lg bg-black text-white border-2 border-black rounded-xl font-black shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] transition-all">
                    {isGenerating ? <><Wand2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Mágica...</> : <><Sparkles className="mr-2 h-5 w-5 text-yellow-300" /> Gerar Script Viral</>}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right column: result */}
            <div className="space-y-8">
              {(isGenerating || isGeneratingAudio) && (
                <div className="h-full min-h-[400px] bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl animate-pulse opacity-50"></div>
                    <div className="relative bg-white border-4 border-black p-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {isGenerating ? <BrainCircuit className="h-12 w-12 animate-pulse" /> : <Mic className="h-12 w-12 animate-bounce" />}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-2">{isGenerating ? "Cozinhando Script..." : "Gerando Áudio..."}</h3>
                  <p className="font-medium text-zinc-500">Aguarde enquanto a mágica acontece (simulado).</p>
                </div>
              )}

              {!isGenerating && !isGeneratingAudio && generatedScript && (
                <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div className="bg-green-400 border-b-4 border-black p-6 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                      <Zap className="h-6 w-6 text-black" />
                    </div>
                    <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Resultado</h2>
                  </div>

                  <div className="p-6 space-y-6">
                    <Textarea value={generatedScript} onChange={(e) => setGeneratedScript(e.target.value)} rows={12} className="font-mono text-sm bg-gray-50 border-2 border-black rounded-xl" />

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={copyToClipboard} className="flex-1 h-12 border-2 border-black rounded-xl font-bold">Copiar</Button>
                      <Button onClick={saveViralContent} disabled={isSaving} className="flex-1 h-12 bg-black text-white border-2 border-black rounded-xl font-bold">
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>

                    {saveStatus !== "idle" && (
                      <div className="mt-4 text-sm font-bold">
                        {saveStatus === "creatingAlert" && "Criando alerta..."}
                        {saveStatus === "updatingAlert" && "Atualizando alerta..."}
                        {saveStatus === "savingContent" && "Salvando conteúdo..."}
                        {saveStatus === "done" && <span className="text-green-600">Salvo com sucesso.</span>}
                        {saveStatus === "error" && <span className="text-red-600">Erro: {saveError}</span>}
                      </div>
                    )}

                    {audioUrl && (
                                          <div ref={audioContainerRef} className="mt-8 pt-8 border-t-4 border-black border-dashed space-y-6">
                                            <div className="bg-yellow-50 border-2 border-black rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                                              <div className="h-12 w-12 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <Volume2 className="h-6 w-6 text-black" />
                                              </div>
                                              <audio ref={audioRef} src={audioUrl} controls className="flex-1 w-full" />
                                              <div className="flex gap-2">
                                                <Button onClick={downloadAudio} size="icon" className="bg-white text-black border-2 border-black rounded-lg hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                                                  <ArrowRight className="h-4 w-4 rotate-90" />
                                                </Button>
                                              </div>
                                            </div>
                    
                                            <div className="bg-gray-50 border-2 border-black rounded-2xl p-6 space-y-4">
                                              <h4 className="font-black text-lg flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5" />
                                                Disparar no WhatsApp
                                              </h4>
                    
                                              {/* Seleção de Contatos */}
                                              <div className="space-y-4">
                                                <div className="flex gap-2">
                                                  <Button
                                                    onClick={() => setIsContactsOpen(!isContactsOpen)}
                                                    className={`flex-1 border-2 border-black rounded-xl font-bold ${isContactsOpen ? 'bg-black text-white' : 'bg-white text-black'} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all`}
                                                  >
                                                    Contatos {isContactsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                                  </Button>
                                                  <Button
                                                    onClick={() => setIsGroupsOpen(!isGroupsOpen)}
                                                    className={`flex-1 border-2 border-black rounded-xl font-bold ${isGroupsOpen ? 'bg-black text-white' : 'bg-white text-black'} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all`}
                                                  >
                                                    Grupos {isGroupsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                                                  </Button>
                                                </div>
                    
                                                {/* Lista de Contatos */}
                                                {isContactsOpen && (
                                                  <div className="bg-white border-2 border-black rounded-xl p-4 animate-in slide-in-from-top-2">
                                                    <Button
                                                      onClick={async () => {
                                                        setIsLoadingContacts(true)
                                                        try {
                                                          const res = await fetch("/api/whatsapp/contacts/list?pageSize=5000")
                                                          const data = await res.json()
                                                          setContacts(Array.isArray(data) ? data : data.value || [])
                                                        } catch (e) { window.alert("Erro ao carregar") }
                                                        finally { setIsLoadingContacts(false) }
                                                      }}
                                                      className="w-full mb-4 bg-yellow-300 text-black border-2 border-black font-bold hover:bg-yellow-400"
                                                    >
                                                      {isLoadingContacts ? "Carregando..." : "Carregar Contatos"}
                                                    </Button>
                    
                                                    {contacts.length > 0 && (
                                                      <div className="space-y-2">
                                                        <Input
                                                          placeholder="Buscar..."
                                                          value={contactSearchQuery}
                                                          onChange={e => setContactSearchQuery(e.target.value)}
                                                          className="border-2 border-black rounded-lg"
                                                        />
                                                        <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                                                          {contacts.filter(c => (c.name || c.phone || "").toLowerCase().includes(contactSearchQuery.toLowerCase())).map((c, i) => {
                                                            const isSelected = selectedRecipients.some(r => r.id === c.phone)
                                                            return (
                                                              <div
                                                                key={i}
                                                                onClick={() => {
                                                                  if (isSelected) setSelectedRecipients(prev => prev.filter(r => r.id !== c.phone))
                                                                  else setSelectedRecipients([...selectedRecipients, { id: c.phone, name: c.name || c.phone, type: "contact" }])
                                                                }}
                                                                className={`p-2 border-2 rounded-lg cursor-pointer flex items-center justify-between font-medium text-sm transition-all ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
                                                              >
                                                                <span>{c.name || c.phone}</span>
                                                                {isSelected && <Check className="h-4 w-4" />}
                                                              </div>
                                                            )
                                                          })}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                    
                                                {/* Lista de Grupos */}
                                                {isGroupsOpen && (
                                                  <div className="bg-white border-2 border-black rounded-xl p-4 animate-in slide-in-from-top-2">
                                                    <Button
                                                      onClick={async () => {
                                                        setIsLoadingGroups(true)
                                                        try {
                                                          const res = await fetch("/api/whatsapp/groups/list")
                                                          const data = await res.json()
                                                          setGroups(Array.isArray(data) ? data : data.value || [])
                                                        } catch (e) { window.alert("Erro ao carregar") }
                                                        finally { setIsLoadingGroups(false) }
                                                      }}
                                                      className="w-full mb-4 bg-blue-300 text-black border-2 border-black font-bold hover:bg-blue-400"
                                                    >
                                                      {isLoadingGroups ? "Carregando..." : "Carregar Grupos"}
                                                    </Button>
                    
                                                    {groups.length > 0 && (
                                                      <div className="space-y-2">
                                                        <Input
                                                          placeholder="Buscar grupos..."
                                                          value={groupSearchQuery}
                                                          onChange={e => setGroupSearchQuery(e.target.value)}
                                                          className="border-2 border-black rounded-lg"
                                                        />
                                                        <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                                                          {groups.filter(g => (g.name || g.subject || "").toLowerCase().includes(groupSearchQuery.toLowerCase())).map((g, i) => {
                                                            const id = g.id || g.phone
                                                            const isSelected = selectedRecipients.some(r => r.id === id)
                                                            return (
                                                              <div
                                                                key={i}
                                                                onClick={() => {
                                                                  if (isSelected) setSelectedRecipients(prev => prev.filter(r => r.id !== id))
                                                                  else setSelectedRecipients([...selectedRecipients, { id, name: g.name || g.subject, type: "group" }])
                                                                }}
                                                                className={`p-2 border-2 rounded-lg cursor-pointer flex items-center justify-between font-medium text-sm transition-all ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-black'}`}
                                                              >
                                                                <span>{g.name || g.subject}</span>
                                                                {isSelected && <Check className="h-4 w-4" />}
                                                              </div>
                                                            )
                                                          })}
                                                        </div>
                                                      </div>
                                                    )}
                                                    <Button
                                                      onClick={() => setIsCreateGroupModalOpen(true)}
                                                      variant="ghost"
                                                      className="w-full mt-2 text-xs font-bold hover:bg-gray-100"
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" /> Criar Novo Grupo
                                                    </Button>
                                                  </div>
                                                )}
                    
                                                {/* Selecionados */}
                                                <div className="flex flex-wrap gap-2">
                                                  {selectedRecipients.map(r => (
                                                    <Badge key={r.id} className="bg-white text-black border-2 border-black pl-2 pr-1 py-1 rounded-lg font-bold flex items-center gap-1">
                                                      {r.name}
                                                      <button onClick={() => setSelectedRecipients(prev => prev.filter(x => x.id !== r.id))} className="hover:bg-red-100 rounded p-0.5">
                                                        <Trash2 className="h-3 w-3 text-red-500" />
                                                      </button>
                                                    </Badge>
                                                  ))}
                                                </div>
                    
                                                <Button
                                                  onClick={sendToWhatsapp}
                                                  disabled={isSendingWhatsapp || selectedRecipients.length === 0}
                                                  className="w-full h-14 bg-green-500 text-black border-2 border-black rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-400 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {isSendingWhatsapp ? "Enviando..." : `Enviar para ${selectedRecipients.length} destinatários`}
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Criar Grupo (simulado) */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden">
            <div className="bg-yellow-300 border-b-4 border-black p-4 flex items-center justify-between">
              <h3 className="text-xl font-black">Criar Novo Grupo</h3>
              <button onClick={() => setIsCreateGroupModalOpen(false)} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
                <Trash2 className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Nome do Grupo</Label>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Discussão PL 1234" className="border-2 border-black rounded-xl font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Participantes ({selectedContactsForGroup.length})</Label>
                <div className="border-2 border-black rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                  {contacts.length === 0 && <div className="text-center text-sm py-4 text-gray-500">Carregue contatos primeiro na tela anterior</div>}
                  {contacts.map((c, i) => {
                    const isSelected = selectedContactsForGroup.includes(c.phone)
                    return (
                      <div key={i} onClick={() => {
                        if (isSelected) setSelectedContactsForGroup(prev => prev.filter(p => p !== c.phone))
                        else setSelectedContactsForGroup(prev => [...prev, c.phone])
                      }} className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-sm font-medium border-2 ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-transparent hover:border-gray-200'}`}>
                        <span>{c.name || c.phone}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreateGroupModalOpen(false)} className="flex-1 border-2 border-black rounded-xl font-bold">Cancelar</Button>
                <Button onClick={handleCreateGroup} disabled={isCreatingGroup} className="flex-1 bg-black text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">
                  {isCreatingGroup ? "Criando..." : "Criar Grupo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
