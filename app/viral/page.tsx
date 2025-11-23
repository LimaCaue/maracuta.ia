import { createClient } from "@/lib/supabase/server"
import { Shield, Video, Volume2, ImageIcon, Sparkles, Zap, Trophy, Lightbulb, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ViralPage() {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from("risk_alerts")
    .select(`
      *,
      legislative_proposals (
        title,
        external_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: viralContent } = await supabase
    .from("viral_content")
    .select(`
      *,
      risk_alerts (
        title,
        risk_level
      )
    `)
    .order("views", { ascending: false })
    .limit(5)

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
          <div className="mb-12">
            <div className="inline-block bg-yellow-300 border-2 border-black px-4 py-1 rounded-full font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-2">
              Viral Mode 🚀
            </div>
            <h1 className="text-5xl font-black mb-2">Gerador de Conteúdo Viral</h1>
            <p className="text-xl font-medium text-zinc-600">Transforme alertas complexos em conteúdo viral para WhatsApp, TikTok e Reels.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

              {/* Formatos */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-purple-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <Zap className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Escolha o Formato</h2>
                </div>

                <div className="p-6 grid md:grid-cols-3 gap-4">
                  <Link href="/viral/create?type=audio" className="group">
                    <div className="bg-white border-2 border-black rounded-2xl p-6 text-center hover:bg-yellow-200 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Volume2 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-black text-lg mb-1">Áudio WhatsApp</h3>
                      <p className="text-sm font-medium text-zinc-500">Voz de 60-90s</p>
                    </div>
                  </Link>

                  <Link href="/viral/create?type=video" className="group">
                    <div className="bg-white border-2 border-black rounded-2xl p-6 text-center hover:bg-pink-200 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Video className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-black text-lg mb-1">Vídeo Curto</h3>
                      <p className="text-sm font-medium text-zinc-500">Reels/TikTok</p>
                    </div>
                  </Link>

                  <Link href="/viral/create?type=image" className="group">
                    <div className="bg-white border-2 border-black rounded-2xl p-6 text-center hover:bg-blue-200 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-black text-lg mb-1">Card Visual</h3>
                      <p className="text-sm font-medium text-zinc-500">Stories/Feed</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Alertas Disponíveis */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-blue-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <Sparkles className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Alertas Disponíveis</h2>
                </div>

                <div className="p-6 space-y-4">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="bg-gray-50 border-2 border-black rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-white transition-colors">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl" title={alert.risk_level}>
                              {alert.risk_level === "critical" ? "🔴" : alert.risk_level === "high" ? "🟠" : "🟡"}
                            </span>
                            <h3 className="font-bold text-lg leading-tight">{alert.title}</h3>
                          </div>
                          <p className="text-sm font-medium text-zinc-500 line-clamp-2">{alert.description}</p>
                        </div>
                        <Button className="w-full sm:w-auto bg-black text-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0px_0px_rgba(100,100,100,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all" asChild>
                          <Link href={`/viral/create?alert=${alert.id}`}>
                            <Sparkles className="mr-2 h-4 w-4 text-yellow-300" />
                            Gerar
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500 font-bold">Nenhum alerta disponível no momento.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Top Viral */}
              <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-green-400 border-b-4 border-black p-6 flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                    <Trophy className="h-6 w-6 text-black" />
                  </div>
                  <h2 className="text-2xl font-black text-white" style={{ textShadow: "2px 2px 0px rgba(0,0,0,1)" }}>Top Viral</h2>
                </div>

                <div className="p-6 space-y-4">
                  {viralContent && viralContent.length > 0 ? (
                    viralContent.map((content, index) => (
                      <div key={content.id} className="flex items-center gap-4 pb-4 border-b-2 border-dashed border-gray-200 last:border-0 last:pb-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-black text-white border-2 border-black flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {content.content_type === "audio" ? (
                              <Volume2 className="h-4 w-4 text-zinc-500" />
                            ) : (
                              <Video className="h-4 w-4 text-zinc-500" />
                            )}
                            {/* @ts-ignore */}
                            <span className="font-bold text-sm truncate block">{content.risk_alerts?.title || "Sem título"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
                            <span>{content.views?.toLocaleString()} views</span>
                            <span>{content.shares?.toLocaleString()} shares</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-zinc-500 font-bold">Nenhum conteúdo viral ainda.</div>
                  )}
                </div>
              </div>

              {/* Dicas */}
              <div className="bg-yellow-300 border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="h-8 w-8 text-black" />
                    <h2 className="text-2xl font-black">Dicas de Mestre</h2>
                  </div>
                  <ul className="space-y-3 font-bold text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span>Use linguagem simples e direta (nível 5ª série).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span>Comece com um gancho polêmico ou urgente.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                      <span>Peça para compartilhar no final.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
