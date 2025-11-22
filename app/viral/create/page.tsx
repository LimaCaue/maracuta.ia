"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Sparkles, Wand2, Volume2, Video, ImageIcon, Copy, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function CreateViralPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const alertId = searchParams.get("alert")
  const proposalId = searchParams.get("proposal") // <-- aceita ?proposal=<id>
  const source = searchParams.get("source") // e.g. "analyze" ou "proposal"
  const originId = searchParams.get("originId") // id da análise ou proposta de origem
  const contentType = searchParams.get("type") || "audio"

  const [alert, setAlert] = useState<any>(null)
  const [proposal, setProposal] = useState<any>(null) // novo: carregamento direto da proposta
  const [tone, setTone] = useState("urgent")
  const [targetAudience, setTargetAudience] = useState("geral")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isTransmitting, setIsTransmitting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContainerRef = useRef<HTMLDivElement | null>(null)
  const audioUrlRef = useRef<string | null>(null) // track current object URL to revoke safely

  // revoga objectURL atual no unmount (e gerencia revogação manual ao trocar)
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        try { URL.revokeObjectURL(audioUrlRef.current) } catch {}
        audioUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (alertId) {
      loadAlert()
    } else if (proposalId) {
      loadProposal()
    }
  }, [alertId, proposalId])
  // carregar contexto quando vier apenas ?source=analyze&originId=...
  useEffect(() => {
    if (!alertId && source === "analyze" && originId) {
      // tentar carregar proposta vinculada (o analyze id costuma ser o id da proposta)
      // mantém compatibilidade caso analyze:id === proposal:id
      loadProposalById(originId)
    }
  }, [source, originId, alertId])

  const loadAlert = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("risk_alerts")
      .select(`
        *,
        legislative_proposals (
          title,
          external_id
        )
      `)
      .eq("id", alertId)
      .single()

    if (data) {
      setAlert(data)
    }
  }

  // Novo: carrega a proposta quando a página é aberta com ?proposal=<id>
  const loadProposal = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("legislative_proposals")
      .select("*")
      .eq("id", proposalId)
      .single()

    if (data) {
      setProposal(data)
    }
  }

  const loadProposalById = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("legislative_proposals").select("*").eq("id", id).single()
    if (data) setProposal(data)
  }

  const generateScript = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    try {
      // garante contexto (carrega se necessário)
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

      const analysisText =
        alert?.analysis_summary ||
        alert?.generated_analysis ||
        proposal?.aiOverview ||
        proposal?.analysis ||
        alert?.description ||
        proposal?.description ||
        ""

      const title = alert?.title || proposal?.title || proposal?.external_id || "Esta proposta"

      // chama a rota server que usa OpenAI (fallback local se chave ausente)
      const res = await fetch("/api/viral/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisText,
          title,
          tone,
          audience: targetAudience,
          contentType,
        }),
      })

      const data = await res.json()
      let script = data?.script || ""
      // Append the poll question at the end
      script += "\n\nQual sua opinião sobre isso ?\n1 - Gostei muito\n2- mais gostei do que não gostei\n3 - neutro\n4 - mais não gostei do que gostei\n5 - não gostei"
      setGeneratedScript(script)
    } catch (e) {
      // fallback local rápido (replicar versão curta se necessário)
      const short = (text: string, n = 250) => text.replace(/\s+/g, " ").trim().slice(0, n)
      const summary = short(analysisText || `${title} — verifique os detalhes na Sentinela Vox.`, 240)
      let fallback = `🔎 ${title}\n\n${summary}\n\nFonte: Sentinela Vox.`
      // Append the poll question at the end
      fallback += "\n\nQual sua opinião sobre isso ?\n1 - Gostei \n2- Mais gostei do que não gostei\n3 - Neutro\n4 - Mais não gostei do que gostei\n5 - Não gostei"
      setGeneratedScript(fallback)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveViralContent = async () => {
    if (!generatedScript) return

    const supabase = createClient()
    let alertIdToUse = alert?.id ?? null

    // Se não houver um alerta existente, crie um alerta mínimo vinculado à proposta
    if (!alertIdToUse) {
      // requisito: ter proposal (vindo de ?proposal) para criar alerta
      if (!proposal) {
        // sem context não salvamos
        return
      }

      const alertInsert = {
        proposal_id: proposal.id,
        title: proposal.title ?? `Alerta gerado para ${proposal.external_id ?? proposal.id}`,
        description: generatedScript || proposal.description || "",
        risk_level: "low"
      }

      const { data: insertedAlert, error: alertError } = await supabase.from("risk_alerts").insert(alertInsert).select().single()
      if (alertError || !insertedAlert) {
        setIsSaving(false)
        return
      }
      alertIdToUse = insertedAlert.id
    }

    setIsSaving(true)
    const { error } = await supabase.from("viral_content").insert({
      alert_id: alertIdToUse,
      content_type: contentType,
      script: generatedScript,
      views: 0,
      shares: 0,
    })

    if (!error) {
      router.push(`/alert/${alertIdToUse}`)
    }
    setIsSaving(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript)
  }

  const generateAudio = async () => {
    if (!generatedScript) return
    setIsGeneratingAudio(true)
    try {
      console.log("tts request payload:", { script: generatedScript?.slice(0,200), voiceId: "pNInz6obpgDQGcFmaJgB", language: "pt-BR", model_id: "eleven_multilingual_v2" }) // Voz portuguesa (Valentina) e modelo multilíngue
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: generatedScript,
          voiceId: "33B4UnXyTNbgLmdEDh5P", // Voz compatível com pt-BR (Valentina)
          model_id: "eleven_multilingual_v2"
        })
      })

      console.log("tts response status:", res.status)
      console.log("tts response headers:", Object.fromEntries(res.headers.entries()))

      const contentType = (res.headers.get("content-type") || "").toLowerCase()

      let blob: Blob | null = null
      let dataJson: any = null

      if (contentType.includes("application/json")) {
        // original behavior: JSON com campo audio (base64 ou array)
        dataJson = await res.json()
        console.log("tts json response:", dataJson)
        if (dataJson?.audio) {
          if (typeof dataJson.audio === "string") {
            try {
              const bin = Uint8Array.from(atob(dataJson.audio), c => c.charCodeAt(0))
              blob = new Blob([bin], { type: dataJson.mime || "audio/mpeg" })
            } catch (err) {
              console.error("Erro ao decodificar base64:", err)
            }
          } else if (Array.isArray(dataJson.audio)) {
            try {
              const uint = new Uint8Array(dataJson.audio)
              blob = new Blob([uint], { type: dataJson.mime || "audio/mpeg" })
            } catch (err) {
              console.error("Erro ao criar blob de array de bytes:", err)
            }
          }
        } else {
          console.error("Resposta JSON sem campo audio:", dataJson)
        }
      } else if (contentType.startsWith("audio/") || contentType === "application/octet-stream") {
        // resposta binária direta (MP3)
        const arrayBuffer = await res.arrayBuffer()
        blob = new Blob([arrayBuffer], { type: contentType || "audio/mpeg" })
        console.log("tts binary response received, size:", blob.size)
      } else {
        // fallback: tentar ler como arrayBuffer e criar blob
        const text = await res.text().catch(() => null)
        console.warn("Resposta TTS com content-type inesperado:", contentType, "— corpo:", text?.slice?.(0,120))
      }

      if (blob) {
        // revoke previous object URL if present
        if (audioUrlRef.current) {
          try { URL.revokeObjectURL(audioUrlRef.current) } catch {}
          audioUrlRef.current = null
        }
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setAudioUrl(url)
        console.log("audio object URL created:", url)
        // rola para o player e tenta tocar (apenas se permitido pelo navegador)
        setTimeout(() => {
          audioContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
          audioRef.current?.play().catch(() => {})
        }, 150)
      } else {
        console.error("Não foi possível criar Blob de áudio (verifique a resposta do /api/tts/generate).")
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
      // lê o blob via fetch do object URL, converte para base64 e envia ao servidor
      const res = await fetch(audioUrl)
      const arrayBuffer = await res.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      const b64 = btoa(String.fromCharCode(...uint8))

      const r = await fetch("/api/tts/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: b64, mime: "audio/mpeg" }),
      })
      const data = await r.json()
      console.log("transmit response", data)
      // opcional: mostrar notificação / mensagem ao usuário
    } catch (e) {
      console.error("transmit error", e)
    } finally {
      setIsTransmitting(false)
    }
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
                <Link href="/viral">Voltar</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Criar Conteúdo Viral</h1>
            <p className="text-muted-foreground">Configure e gere seu alerta viral em segundos</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Índicador de origem (voltar para a análise / proposta) */}
            {source && originId && (
              <div className="lg:col-span-3 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Origem</CardTitle>
                    <CardDescription className="text-xs">Contexto desta criação viral</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{source === "analyze" ? "Análise da PL" : "Proposta"}</div>
                      <div className="text-muted-foreground text-xs">ID: {originId}</div>
                    </div>
                    <div>
                      <Link
                        href={source === "analyze" ? `/analyze/${originId}` : `/proposal/${originId}`}
                        className="text-sm text-primary underline"
                      >
                        Ver origem
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="lg:col-span-2 space-y-6">
              {alert && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Criando alerta para</CardTitle>
                    <CardDescription>Proposta relacionada ao alerta selecionado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {alert.legislative_proposals?.external_id ?? alert.proposal_external_id ?? "—"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {alert.legislative_propostas ? "Proposta vinculada" : "Sem vínculo"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold">{alert.legislative_proposals?.title ?? alert.title ?? "Título não disponível"}</h3>
                        {alert.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{alert.description}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          href={`/proposal/${alert.proposal_id ?? ""}`}
                          className="inline-block text-sm text-primary underline"
                        >
                          Ver proposta
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Se veio apenas ?proposal=..., mostra a caixa da proposta para que o usuário saiba o contexto */}
              {!alert && proposal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Criando alerta para</CardTitle>
                    <CardDescription>Proposta selecionada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {proposal.external_id ?? "—"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">Proposta vinculada</Badge>
                        </div>
                        <h3 className="font-semibold">{proposal.title ?? "Título não disponível"}</h3>
                        {proposal.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{proposal.description}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <Link
                          href={`/proposal/${proposal.id ?? ""}`}
                          className="inline-block text-sm text-primary underline"
                        >
                          Ver proposta
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>Personalize o tom e o público-alvo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Tipo de Conteúdo</Label>
                    <div className="flex gap-3">
                      <Badge variant={contentType === "audio" ? "default" : "outline"} className="cursor-pointer">
                        <Volume2 className="mr-1 h-3 w-3" />
                        Áudio
                      </Badge>
                      <Badge variant={contentType === "video" ? "default" : "outline"} className="cursor-pointer">
                        <Video className="mr-1 h-3 w-3" />
                        Vídeo
                      </Badge>
                      <Badge variant={contentType === "image" ? "default" : "outline"} className="cursor-pointer">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        Imagem
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Tom da Mensagem</Label>
                    <RadioGroup value={tone} onValueChange={setTone}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="urgent" id="urgent" />
                        <Label htmlFor="urgent" className="cursor-pointer">
                          Urgente - Para mobilização rápida
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="informative" id="informative" />
                        <Label htmlFor="informative" className="cursor-pointer">
                          Informativo - Para educação cívica
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="emotional" id="emotional" />
                        <Label htmlFor="emotional" className="cursor-pointer">
                          Emocional - Para engajamento pessoal
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block">Público-Alvo</Label>
                    <RadioGroup value={targetAudience} onValueChange={setTargetAudience}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="geral" id="geral" />
                        <Label htmlFor="geral" className="cursor-pointer">
                          Público Geral
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="classe_de" id="classe_de" />
                        <Label htmlFor="classe_de" className="cursor-pointer">
                          Classes D/E
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="jovens" id="jovens" />
                        <Label htmlFor="jovens" className="cursor-pointer">
                          Jovens (18-30 anos)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={generateScript}
                    // permite gerar se já estiver carregado alert/proposal ou se vier source+originId,
                    // e bloqueia apenas enquanto está gerando
                    disabled={isGenerating || (!alert && !proposal && !(source && originId))}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Gerar Script Viral
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {generatedScript && (
                <Card>
                  <CardHeader>
                    <CardTitle>Script Gerado</CardTitle>
                    <CardDescription>Edite se necessário antes de salvar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={generatedScript}
                      onChange={(e) => setGeneratedScript(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={copyToClipboard} className="flex-1 bg-transparent">
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                      </Button>
                      <Button onClick={saveViralContent} disabled={isSaving} className="flex-1">
                        {isSaving ? "Salvando..." : "Salvar e Publicar"}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={generateAudio} disabled={!generatedScript || isGeneratingAudio} className="flex-1">
                        {isGeneratingAudio ? "Gerando Áudio..." : "Gerar Áudio (TTS)"}
                      </Button>
                    </div>
                    {audioUrl && (
                      <div ref={audioContainerRef} className="mt-3 space-y-3">
                        <div className="p-3 border border-border rounded-lg flex items-center gap-4">
                          <audio ref={audioRef} src={audioUrl} controls className="flex-1" />
                          <div className="flex flex-col gap-2 w-40">
                            <Button variant="outline" onClick={downloadAudio}>Baixar</Button>
                            <Button onClick={transmitAudio} disabled={isTransmitting}>Transmitir Áudio</Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Transmitir envia o áudio para o servidor (rota /api/tts/transmit) para difusão.</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {contentType === "audio" && (
                    <div className="space-y-4">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                        <Volume2 className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Áudio de WhatsApp - 60-90 segundos</p>
                    </div>
                  )}
                  {contentType === "video" && (
                    <div className="space-y-4">
                      <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                        <Video className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Vídeo Vertical - 15-30 segundos</p>
                    </div>
                  )}
                  {contentType === "image" && (
                    <div className="space-y-4">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Card Visual - 1080x1080px</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Melhores Práticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium mb-1">Para Áudio:</div>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Fale devagar e com clareza</li>
                      <li>• Use pausas dramáticas</li>
                      <li>• Termine com call-to-action</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Para Vídeo:</div>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Hook nos primeiros 3 segundos</li>
                      <li>• Use legendas grandes</li>
                      <li>• Formato vertical 9:16</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Para Imagem:</div>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Contraste alto para ler fácil</li>
                      <li>• Máximo 3 cores</li>
                      <li>• Texto grande e legível</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
