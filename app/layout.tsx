import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MaracutaIA - O Waze dos Riscos Legislativos",
  description:
    "IA que monitora 130 mil propostas legislativas em tempo real e te alerta sobre riscos escondidos antes da votação. Proteção cívica contra leis prejudiciais.",
  generator: "v0.app",
  keywords: ["legislação", "transparência", "cidadania", "direitos", "brasil", "política"],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased relative min-h-screen bg-transparent`}>
        {/* Global Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: 'url("https://www.camara.leg.br/midias/image/2025/04/img20250414183709820-768x473.jpg")',
            }}
          />
        </div>

        {children}
        <Analytics />
      </body>
    </html>
  )
}
