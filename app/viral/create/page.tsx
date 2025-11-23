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
  SeparatorVertical as Separator,
  List,
  Plus,
  Trash2,
  Box,
  Zap,
  ArrowRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function CreateViralPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawAlert = searchParams.get("alert")
  const alertId = (rawAlert === "undefined" || rawAlert === "null") ? null : rawAlert

  const rawProposal = searchParams.get("proposal")
  const proposalId = (rawProposal === "undefined" || rawProposal === "null") ? null : rawProposal

  const source = searchParams.get("source")
  const originId = searchParams.get("originId")
  const contentType = "audio"
  const [alert, setAlert] = useState<any>(null)
  const [proposal, setProposal] = useState<any>(null)
  const [tone, setTone] = useState("urgent")
  const [targetAudience, setTargetAudience] = useState("geral")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false)
  const [sendPoll, setSendPoll] = useState(true)
  const [pollQuestion, setPollQuestion] = useState("Qual sua opinião sobre isso?")

  // Updated Poll Options
  const [pollOptions, setPollOptions] = useState<string[]>([
    "1 - Concordo",
    "2 - Concordo parcialmente",
    "3 - Neutro",
    "4 - Discordo parcialmente",
    "5 - Discordo"
  ])

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

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("risk_alerts_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "risk_alerts" },
        payload => {
          console.log("INSERT risk_alerts:", payload.new)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
  useEffect(() => {
    const loadData = async () => {
      if (alertId) {
        await loadAlert()
        return
      }
      if (proposalId) {
        await loadProposal()
        return
      }
      if (source === "analyze" && originId) {
        await loadProposalById(originId)
      }
    }
    loadData()
  }, [alertId, proposalId, source, originId])

  const loadAlert = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("risk_alerts")
      .select(`*, legislative_proposals (title, external_id)`)
      .eq("id", alertId)
      .single()
    if (data) setAlert(data)
  }

  const loadProposal = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("legislative_proposals").select("*").eq("id", proposalId).single()
    if (data) setProposal(data)
  }

  const loadProposalById = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("legislative_proposals").select("*").eq("id", id).single()
    if (data) setProposal(data)
  }

  const generateScript = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    let analysisText = ""
    let title = ""

    try {
      if (!alert && !proposal) {
        if (source === "analyze" && originId) {
          await loadProposalById(originId)
        } else if (proposalId) {
          await loadProposal()
        }
      }

      if (!alert && !proposal) {
        setIsGenerating(false)
        return
      }

      analysisText =
        alert?.analysis_summary ||
        alert?.generated_analysis ||
        proposal?.aiOverview ||
        proposal?.analysis ||
        alert?.description ||
        proposal?.description ||
        ""

      title = alert?.title || proposal?.title || proposal?.external_id || "Esta proposta"

      // NOVO: Instrução para a LLM avaliar risco e incluir frase se alto
      const riskDirective = `
INSTRUÇÃO ADICIONAL:
1. Avalie o nível de risco da proposta (baixo, médio ou alto) considerando impacto, brechas, efeitos colaterais e possibilidade de uso indevido.
2. Se o risco for classificado como ALTO, inclua explicitamente no roteiro a frase exata:
"Esta proposta tem uma maracutaia no meio dela."
3. Justifique de forma breve (1–2 frases) os pontos críticos se for alto.
Mantenha linguagem clara e engajante.
`

      const res = await fetch("/api/viral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisText: `${analysisText}\n\n${riskDirective}`,
          title,
          tone,
          audience: targetAudience,
          contentType,
        }),
      })

      const data = await res.json()
      let script = data?.script || ""
      script +=
        "\n\nQual sua opinião sobre isso ?\n1- Concordo totalmente\n2 - Concordo parcialmente\n3 - Neutro\n4 - Discordo parcialmente\n5 - Discordo totalmente"
      setGeneratedScript(script)

      setTimeout(() => {
        generateAudioFromScript(script)
      }, 500)
    } catch (e) {
      const short = (text: string, n = 250) => text.replace(/\s+/g, " ").trim().slice(0, n)
      const summary = short(analysisText || `${title} — verifique os detalhes na Sentinela Vox.`, 240)
      let fallback = `🔎 ${title}\n\n${summary}\n\nFonte: Sentinela Vox.`
      fallback +=
        "\n\nQual sua opinião sobre isso ?\n1- Concordo totalmente\n2 - Concordo parcialmente\n3 - Neutro\n4 - Discordo parcialmente\n5 - Discordo totalmente"
      setGeneratedScript(fallback)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveViralContent = async () => {
    if (!generatedScript) return
    setSaveError(null)
    setIsSaving(true)
    setSaveStatus("idle")
    const supabase = createClient()
    let alertIdToUse = alert?.id ?? null

    try {
      const containsMaracutaia = /maracutaia/i.test(generatedScript)
      const containsJabuti = /jabuti/i.test(generatedScript)

      if (!alertIdToUse) {
        if (!proposal) {
          setSaveError("Sem proposta vinculada.")
          setSaveStatus("error")
          setIsSaving(false)
          return
        }
        setSaveStatus("creatingAlert")
        const alertInsert = {
          proposal_id: proposal.id,
          title: proposal.title ?? `Alerta gerado para ${proposal.external_id ?? proposal.id}`,
          description: generatedScript || proposal.description || "",
          analysis_summary: generatedScript,
          generated_analysis: generatedScript,
          risk_level: containsMaracutaia ? "high" : "low",
          risk_type: "public_interest",
          jabuti_detected: containsJabuti
        }
        const { data: insertedAlert, error: alertError } = await supabase
          .from("risk_alerts")
          .insert(alertInsert)
          .select()
          .single()
        if (alertError || !insertedAlert) {
          console.error("Erro ao inserir alerta:", alertError)
          setSaveError(alertError?.message || "Falha ao criar alerta.")
          setSaveStatus("error")
          setIsSaving(false)
          return
        }
        console.log("Alerta criado:", insertedAlert)
        alertIdToUse = insertedAlert.id
      } else {
        setSaveStatus("updatingAlert")
        const { error: updError } = await supabase
          .from("risk_alerts")
          .update({
            description: generatedScript,
            analysis_summary: generatedScript,
            generated_analysis: generatedScript,
            risk_level: containsMaracutaia ? alert.risk_level ?? "high" : alert.risk_level ?? "low",
            jabuti_detected: alert.jabuti_detected || containsJabuti
          })
          .eq("id", alertIdToUse)
        if (updError) {
          console.error("Erro ao atualizar alerta:", updError)
          setSaveError(updError.message)
          setSaveStatus("error")
          setIsSaving(false)
          return
        }
        console.log("Alerta atualizado:", alertIdToUse)
      }

      setSaveStatus("savingContent")
      const { error: viralError } = await supabase.from("viral_content").insert({
        alert_id: alertIdToUse,
        content_type: contentType,
        script: generatedScript,
        views: 0,
        shares: 0
      })
      if (viralError) {
        console.error("Erro ao salvar conteúdo viral:", viralError)
        setSaveError(viralError.message)
        setSaveStatus("error")
        setIsSaving(false)
        return
      }

      setSaveStatus("done")
      console.log("Conteúdo salvo. Redirecionando para /alerts")
      router.push("/alerts")
    } catch (e: any) {
      console.error("Exceção no saveViralContent:", e)
      setSaveError(e?.message || "Erro inesperado.")
      setSaveStatus("error")
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = () => navigator.clipboard.writeText(generatedScript)

  const generateAudioFromScript = async (scriptText?: string) => {
    const textToConvert = scriptText || generatedScript
    if (!textToConvert) return
    setIsGeneratingAudio(true)
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: textToConvert,
          voiceId: "33B4UnXyTNbgLmdEDh5P",
          model_id: "eleven_multilingual_v2",
        }),
      })

      const contentType = (res.headers.get("content-type") || "").toLowerCase()
      let blob: Blob | null = null

      if (contentType.includes("application/json")) {
        const dataJson = await res.json()
        if (dataJson?.audio) {
          if (typeof dataJson.audio === "string") {
            try {
              const bin = Uint8Array.from(atob(dataJson.audio), (c) => c.charCodeAt(0))
              blob = new Blob([bin], { type: dataJson.mime || "audio/mpeg" })
            } catch (err) { }
          } else if (Array.isArray(dataJson.audio)) {
            try {
              const uint = new Uint8Array(dataJson.audio)
              blob = new Blob([uint], { type: dataJson.mime || "audio/mpeg" })
            } catch (err) { }
          }
        }
      } else if (contentType.startsWith("audio/") || contentType === "application/octet-stream") {
        const arrayBuffer = await res.arrayBuffer()
        blob = new Blob([arrayBuffer], { type: contentType || "audio/mpeg" })
      }

      if (blob) {
        if (audioUrlRef.current) {
          try { URL.revokeObjectURL(audioUrlRef.current) } catch { }
          audioUrlRef.current = null
        }
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setAudioUrl(url)
        setTimeout(() => {
          audioContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          audioRef.current?.play().catch(() => { })
        }, 150)
      }
    } catch (e) {
      console.error("Erro ao gerar TTS:", e)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const downloadAudio = () => {
    if (!audioUrl) return
    const a = document.createElement("a")
    a.href = audioUrl
    a.download = `alert_audio_${proposal?.id ?? alert?.id ?? "script"}.mp3`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const transmitAudio = async () => {
    if (!audioUrl) return
    setIsTransmitting(true)
    try {
      const res = await fetch(audioUrl)
      const blob = await res.blob()
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(",")[1])
        }
        reader.readAsDataURL(blob)
      })
      await fetch("/api/tts/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: b64, mime: "audio/mpeg" }),
      })
    } catch (e) {
      console.error("transmit error", e)
    } finally {
      setIsTransmitting(false)
    }
  }

  const sendToWhatsapp = async () => {
    if ((!generatedScript && !audioUrl) || selectedRecipients.length === 0) {
      window.alert("Selecione pelo menos um destinatário e gere o conteúdo.")
      return
    }
    setIsSendingWhatsapp(true)
    try {
      let audioBase64: string | null = null
      if (audioUrl) {
        const res = await fetch(audioUrl)
        const blob = await res.blob()
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      }
      const textToSend = generatedScript
      let successCount = 0
      let failCount = 0
      for (const recipient of selectedRecipients) {
        try {
          const res = await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: textToSend,
              audio: audioBase64,
              phone: recipient.id,
              mime: "audio/mpeg",
              poll: sendPoll ? { question: pollQuestion, options: pollOptions.filter((o) => o.trim() !== "").map((o) => ({ name: o })) } : undefined,
            }),
          })
          if (res.ok) successCount++
          else failCount++
        } catch (e) { failCount++ }
      }
      window.alert(`Envio finalizado!\nSucesso: ${successCount}\nFalhas: ${failCount}`)
    } catch (e) { window.alert("Erro ao processar envio.") } finally { setIsSendingWhatsapp(false) }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName || selectedContactsForGroup.length === 0) {
      window.alert("Nome do grupo e pelo menos um contato são obrigatórios.")
      return
    }
    setIsCreatingGroup(true)
    try {
      const res = await fetch("/api/whatsapp/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: newGroupName, phones: selectedContactsForGroup, autoInvite: true })
      })
      const data = await res.json()
      if (res.ok) {
        window.alert(`Grupo "${newGroupName}" criado com sucesso!`)
        setIsCreateGroupModalOpen(false)
        setNewGroupName("")
        setSelectedContactsForGroup([])
      } else {
        window.alert(`Erro ao criar grupo: ${data.error || data.details || "Erro desconhecido"}`)
      }
    } catch (e) { window.alert("Erro ao conectar com o servidor.") } finally { setIsCreatingGroup(false) }
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
              <p className="text-xl font-medium text-zinc-600">Gere alertas virais com estilo.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            {/* Coluna Esquerda: Configurações */}
            <div className="space-y-8">

              {/* Card: Proposta */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-blue-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <FileText className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Alvo do Alerta</h2>
                </div>
                <div className="p-6">
                  {alert || proposal ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white px-3 py-1 rounded-lg font-bold text-sm">
                          {alert?.legislative_proposals?.external_id ?? alert?.proposal_external_id ?? proposal?.external_id ?? "ID"}
                        </span>
                        <span className="bg-green-400 text-black border-2 border-black px-3 py-1 rounded-lg font-bold text-sm">
                          {alert?.legislative_propostas || proposal ? "Vinculado" : "Sem vínculo"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold leading-tight">
                        {alert?.legislative_proposals?.title ?? alert?.title ?? proposal?.title ?? "Título não disponível"}
                      </h3>
                      <Link href={`/proposal/${alert?.proposal_id ?? proposal?.id ?? ""}`} className="text-pink-600 font-black underline decoration-4 decoration-pink-300 hover:decoration-pink-600 transition-all w-fit">
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
                          <Input
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            className="bg-gray-50 border-2 border-black rounded-xl font-medium focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-bold mb-2 block">Opções</Label>
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...pollOptions]
                                  newOptions[index] = e.target.value
                                  setPollOptions(newOptions)
                                }}
                                className="bg-gray-50 border-2 border-black rounded-xl font-medium"
                              />
                              {pollOptions.length > 2 && (
                                <Button
                                  size="icon"
                                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                  className="bg-red-400 border-2 border-black text-black hover:bg-red-500 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {pollOptions.length < 12 && (
                            <Button
                              variant="outline"
                              onClick={() => setPollOptions([...pollOptions, ""])}
                              className="w-full border-2 border-black border-dashed rounded-xl font-bold hover:bg-gray-100"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar Opção
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={generateScript}
                    disabled={isGenerating || isGeneratingAudio || (!alert && !proposal && !(source && originId))}
                    className="w-full h-14 text-lg bg-black text-white border-2 border-black rounded-xl font-black shadow-[6px_6px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
                  >
                    {isGenerating ? (
                      <><Wand2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Mágica...</>
                    ) : (
                      <><Sparkles className="mr-2 h-5 w-5 text-yellow-300" /> Gerar Script Viral</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Resultado */}
            <div className="space-y-8">
              {(isGenerating || isGeneratingAudio) && (
                <div className="h-full min-h-[400px] bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl animate-pulse opacity-50"></div>
                    <div className="relative bg-white border-4 border-black p-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {isGenerating ? <BrainCircuit className="h-12 w-12 animate-pulse" /> : <Mic className="h-12 w-12 animate-bounce" />}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black mb-2">{isGenerating ? "Cozinhando Script..." : "Gravando Áudio..."}</h3>
                  <p className="font-medium text-zinc-500">Aguarde enquanto a mágica acontece.</p>
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
                    <Textarea
                      value={generatedScript}
                      onChange={(e) => setGeneratedScript(e.target.value)}
                      rows={12}
                      className="font-mono text-sm bg-gray-50 border-2 border-black rounded-xl focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    />

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

      {/* Modal Criar Grupo */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-yellow-300 border-b-4 border-black p-4 flex items-center justify-between">
              <h3 className="text-xl font-black">Criar Novo Grupo</h3>
              <button onClick={() => setIsCreateGroupModalOpen(false)} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
                <Trash2 className="h-5 w-5 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Nome do Grupo</Label>
                <Input
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Ex: Discussão PL 1234"
                  className="border-2 border-black rounded-xl font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Participantes ({selectedContactsForGroup.length})</Label>
                <Input
                  value={modalContactSearchQuery}
                  onChange={e => setModalContactSearchQuery(e.target.value)}
                  placeholder="Buscar contatos..."
                  className="border-2 border-black rounded-xl mb-2"
                />
                <div className="border-2 border-black rounded-xl max-h-48 overflow-y-auto p-2 space-y-1">
                  {contacts.length === 0 && <div className="text-center text-sm py-4 text-gray-500">Carregue contatos primeiro na tela anterior</div>}
                  {contacts.filter(c => (c.name || c.phone || "").toLowerCase().includes(modalContactSearchQuery.toLowerCase())).map((c, i) => {
                    const isSelected = selectedContactsForGroup.includes(c.phone)
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (isSelected) setSelectedContactsForGroup(prev => prev.filter(p => p !== c.phone))
                          else setSelectedContactsForGroup(prev => [...prev, c.phone])
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-sm font-medium border-2 ${isSelected ? 'bg-black text-white border-black' : 'bg-white border-transparent hover:border-gray-200'}`}
                      >
                        <span>{c.name || c.phone}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCreateGroupModalOpen(false)} className="flex-1 border-2 border-black rounded-xl font-bold">Cancelar</Button>
                <Button onClick={handleCreateGroup} disabled={isCreatingGroup} className="flex-1 bg-black text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(100,100,100,1)] hover:shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
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
