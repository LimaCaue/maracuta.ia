import { Shield, AlertTriangle, Users, Zap, Bell, FileText, Play, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-pulse" style={{ animationDuration: '8s' }} />

        <nav className="relative border-b border-border/50 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary animate-float" />
              <span className="text-2xl font-bold gradient-text">Sentinela Vox</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="hidden md:inline-flex hover-lift">
                Como Funciona
              </Button>
              <Button variant="ghost" className="hidden md:inline-flex hover-lift">
                Alertas Recentes
              </Button>
              <Button asChild className="animated-gradient text-primary-foreground border-0 hover-lift hover:shadow-luxury">
                <Link href="/dashboard">Acessar Dashboard</Link>
              </Button>
            </div>
          </div>
        </nav>

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-gradient-to-r from-accent to-accent-glow text-accent-foreground border-0 shadow-luxury relative overflow-hidden group">
              <div className="absolute inset-0 animate-shimmer" />
              <Zap className="h-3 w-3 mr-1 relative z-10 animate-bounce-subtle" />
              <span className="relative z-10">O "Waze" dos Riscos Legislativos</span>
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
              Proteção contra leis que podem{" "}
              <span className="gradient-text-accent">prejudicar você</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl">
              IA que monitora 130 mil propostas legislativas em tempo real e te alerta sobre riscos escondidos antes da
              votação
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg animated-gradient text-primary-foreground border-0 hover-lift hover:shadow-luxury-lg transition-all duration-300">
                <Link href="/dashboard">
                  <Bell className="mr-2 h-5 w-5" />
                  Ver Alertas Ativos
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg bg-transparent hover-lift hover:bg-accent/10 hover:border-accent transition-all duration-300">
                <Play className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 group">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary-glow animate-pulse shadow-lg shadow-primary/50" />
                <span className="font-medium group-hover:text-foreground transition-colors">130 mil propostas monitoradas</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-accent to-accent-glow animate-pulse shadow-lg shadow-accent/50" style={{ animationDelay: '0.3s' }} />
                <span className="font-medium group-hover:text-foreground transition-colors">Alertas em tempo real</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-primary-glow animate-pulse shadow-lg shadow-primary/50" style={{ animationDelay: '0.6s' }} />
                <span className="font-medium group-hover:text-foreground transition-colors">Validado por especialistas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              O <span className="gradient-text">problema</span> que resolvemos
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Leis complexas escondem riscos em letras miúdas. Quando você descobre, já é tarde.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 hover-lift hover:border-destructive/50 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/0 to-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative z-10">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-2">Jabutis Escondidos</h3>
                <p className="text-muted-foreground">
                  Emendas perigosas inseridas em projetos aparentemente inofensivos, escondidas na página 40
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 hover-lift hover:border-destructive/50 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/0 to-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative z-10">
                <FileText className="h-12 w-12 text-destructive mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-2">Linguagem Complexa</h3>
                <p className="text-muted-foreground">
                  Textos jurídicos incompreensíveis para 29% da população com analfabetismo funcional
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 hover-lift hover:border-destructive/50 transition-all duration-300 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/0 to-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative z-10">
                <Zap className="h-12 w-12 text-destructive mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold mb-2">Tempo Curto</h3>
                <p className="text-muted-foreground">
                  Leis são votadas em dias. A sociedade leva semanas para entender o impacto real
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-b border-border bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              Como <span className="gradient-text">funciona</span>
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">Tecnologia sofisticada com entrega simples</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-bold text-xl shadow-luxury group-hover:shadow-luxury-lg group-hover:scale-110 transition-all duration-300">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">IA Monitora 24/7</h3>
                  <p className="text-muted-foreground">
                    Sistema processa automaticamente todas as 130 mil propostas da Câmara e Senado usando NLP avançado
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-bold text-xl shadow-luxury group-hover:shadow-luxury-lg group-hover:scale-110 transition-all duration-300">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Detecta Riscos Escondidos</h3>
                  <p className="text-muted-foreground">
                    Identifica "jabutis", termos vagos que permitem corrupção, e artigos que prejudicam classes D/E
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-bold text-xl shadow-luxury group-hover:shadow-luxury-lg group-hover:scale-110 transition-all duration-300">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Validação Humana</h3>
                  <p className="text-muted-foreground">
                    Especialistas jurídicos e ONGs validam o alerta antes do disparo para evitar fake news
                  </p>
                </div>
              </div>

              <div className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center font-bold text-xl shadow-luxury group-hover:shadow-luxury-lg group-hover:scale-110 transition-all duration-300">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Alerta Viral Instantâneo</h3>
                  <p className="text-muted-foreground">
                    Você recebe um vídeo curto ou áudio de WhatsApp explicando o risco em linguagem clara
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Card className="border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover-lift hover:border-accent/50 transition-all duration-300 group shadow-luxury">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Volume2 className="h-6 w-6 text-accent-foreground mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <Badge variant="outline" className="mb-2 border-accent/50 bg-accent/10">
                        Áudio de WhatsApp
                      </Badge>
                      <h4 className="font-bold mb-1">PL 456 - Alerta Urgente</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Atenção: Estão tentando passar uma lei AGORA que permite aumentar sua conta de luz sem aviso
                    prévio. O texto está escondido na página 40. Pressione seu deputado hoje!"
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" variant="outline" className="hover:bg-accent/20 hover:border-accent transition-all">
                      <Play className="h-4 w-4 mr-1" />
                      Ouvir Alerta
                    </Button>
                    <span className="text-xs text-muted-foreground">1:30</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/30 bg-gradient-to-br from-accent/15 to-accent/5 hover-lift hover:border-accent/50 transition-all duration-300 group shadow-luxury">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Play className="h-6 w-6 text-accent-foreground mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <Badge variant="outline" className="mb-2 border-accent/50 bg-accent/10">
                        Reels / TikTok
                      </Badge>
                      <h4 className="font-bold mb-1">PL 789 - Risco Detectado</h4>
                    </div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-md flex items-center justify-center mb-3 group-hover:from-accent/10 group-hover:to-accent/5 transition-all duration-300">
                    <Play className="h-12 w-12 text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110 transition-all" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vídeo curto explicando o impacto real da lei na sua vida diária
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              <span className="gradient-text">Impacto</span> esperado
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Transformando a relação entre cidadãos e o processo legislativo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-lift border-primary/20 hover:border-primary/40 transition-all duration-300 group shadow-luxury">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">29%</div>
                <h3 className="text-lg font-bold mb-2">População Protegida</h3>
                <p className="text-sm text-muted-foreground">
                  Analfabetos funcionais finalmente entendem leis complexas
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-accent/20 hover:border-accent/40 transition-all duration-300 group shadow-luxury">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold gradient-text-accent mb-2 group-hover:scale-110 transition-transform duration-300">Minutos</div>
                <h3 className="text-lg font-bold mb-2">vs Semanas</h3>
                <p className="text-sm text-muted-foreground">Tempo para mobilização reduzido drasticamente</p>
              </CardContent>
            </Card>

            <Card className="hover-lift border-primary/20 hover:border-primary/40 transition-all duration-300 group shadow-luxury">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">Real</div>
                <h3 className="text-lg font-bold mb-2">Transparência Radical</h3>
                <p className="text-sm text-muted-foreground">Exposição de "letras miúdas" em tempo real</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient-slow opacity-90" />
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Shield className="h-16 w-16 mx-auto mb-6 opacity-90 animate-float" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">Junte-se à rede de proteção cívica</h2>
          <p className="text-xl mb-8 text-pretty max-w-2xl mx-auto opacity-90">
            Seja avisado antes que leis prejudiciais sejam aprovadas. A tecnologia está do seu lado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg hover-lift shadow-luxury hover:shadow-luxury-lg transition-all duration-300">
              <Bell className="mr-2 h-5 w-5" />
              Ativar Alertas Gratuitos
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary hover-lift transition-all duration-300"
            >
              <Users className="mr-2 h-5 w-5" />
              Para Organizações
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 group">
              <Shield className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold gradient-text">Sentinela Vox</span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-all duration-300 hover:scale-105 inline-block">
                Sobre
              </a>
              <a href="#" className="hover:text-primary transition-all duration-300 hover:scale-105 inline-block">
                Como Funciona
              </a>
              <a href="#" className="hover:text-primary transition-all duration-300 hover:scale-105 inline-block">
                Parceiros
              </a>
              <a href="#" className="hover:text-primary transition-all duration-300 hover:scale-105 inline-block">
                Contato
              </a>
            </div>

            <p className="text-sm text-muted-foreground">© 2025 Sentinela Vox. Tecnologia a favor do cidadão.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
