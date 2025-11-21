"use client"

import { useState, useEffect } from "react"
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
  const contentType = searchParams.get("type") || "audio"

  const [alert, setAlert] = useState<any>(null)
  const [tone, setTone] = useState("urgent")
  const [targetAudience, setTargetAudience] = useState("geral")
  const [generatedScript, setGeneratedScript] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (alertId) {
      loadAlert()
    }
  }, [alertId])

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

  const generateScript = async () => {
    if (!alert) return

    setIsGenerating(true)

    // Simular geração de script (em produção, usaria AI SDK)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const scripts = {
      urgent: `🚨 ATENÇÃO URGENTE! ${alert.title}

${alert.description}

Isso pode afetar VOCÊ e sua família AGORA! 

A votação é em DIAS e muita gente não sabe disso.

Compartilhe para alertar quem você ama!

#SentinelaVox #FiqueLigado`,

      informative: `Você sabia? ${alert.title}

De acordo com nossa análise da proposta ${alert.legislative_proposals?.external_id}:

${alert.description}

É importante entender como isso pode te afetar.

Fonte: Análise Sentinela Vox
Compartilhe para informar outros cidadãos.`,

      emotional: `Imagina acordar amanhã e descobrir que aprovaram uma lei que vai mudar sua vida...

😰 ${alert.title}

${alert.description}

Não deixe isso acontecer sem você saber!

Sua família precisa saber disso. Compartilhe agora! ❤️`,
    }

    setGeneratedScript(scripts[tone as keyof typeof scripts] || scripts.urgent)
    setIsGenerating(false)
  }

  const saveViralContent = async () => {
    if (!alert || !generatedScript) return

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from("viral_content").insert({
      alert_id: alert.id,
      content_type: contentType,
      script: generatedScript,
      views: 0,
      shares: 0,
    })

    if (!error) {
      router.push(`/alert/${alert.id}`)
    }
    setIsSaving(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript)
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
            <div className="lg:col-span-2 space-y-6">
              {alert && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alerta Selecionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">
                        {alert.risk_level === "critical" ? "🔴" : alert.risk_level === "high" ? "🟠" : "🟡"}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
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

                  <Button onClick={generateScript} disabled={!alert || isGenerating} className="w-full" size="lg">
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
