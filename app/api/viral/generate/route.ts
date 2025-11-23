import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      analysisText = "",
      title = "Esta proposta",
      tone = "urgent",
      audience = "geral",
      contentType = "audio",
    } = body

    // Fallback local generator (mesma lógica que o client espera)
    const localMakeMessage = () => {
      const short = (text: string, n = 250) => text.replace(/\s+/g, " ").trim().slice(0, n)
      const summary = short(analysisText || `${title} — verifique os detalhes na MaracutaIA.`, 240)
      const formatSummary = (text: string, max = 200) => text.replace(/\s+/g, " ").trim().slice(0, max)
      const callToAction = {
        geral: "Compartilhe com quem precisa saber!",
        classe_de: "Avise sua rede — isso pode afetar o dia a dia.",
        jovens: "Marca a galera e espalha esse alerta!",
      }

      if (tone === "urgent") {
        return {
          geral: `🚨 URGENTE: ${title}\n\n${formatSummary(summary)}\n\nVotação em breve. ${callToAction.geral}`,
          classe_de: `🚨 ATENÇÃO: ${title}\n\n${formatSummary(summary)}\n\nPode mudar sua rotina. ${callToAction.classe_de}`,
          jovens: `🚨 Se liga: ${title}\n\n${formatSummary(summary, 160)}\n\nTá rolando agora — ${callToAction.jovens}`,
        }[audience]
      }

      if (tone === "informative") {
        return {
          geral: `🔎 Entenda: ${title}\n\n${formatSummary(summary)}\n\nFonte: MaracutaIA.`,
          classe_de: `ℹ️ Informação importante: ${title}\n\n${formatSummary(summary)}\n\nConfira e compartilhe com sua comunidade.`,
          jovens: `📚 Fica por dentro: ${title}\n\n${formatSummary(summary, 180)}\n\nQuer saber mais? Espalha aí.`,
        }[audience]
      }

      if (tone === "emotional") {
        return {
          geral: `💔 Isso importa: ${title}\n\n${formatSummary(summary)}\n\nPode afetar famílias. Se te toca, compartilha.`,
          classe_de: `😔 Atenção: ${title}\n\n${formatSummary(summary)}\n\nSua comunidade pode ser impactada. Avise quem importa.`,
          jovens: `😢 Não deixa passar: ${title}\n\n${formatSummary(summary, 160)}\n\nSe preocupa com isso? Faz barulho.`,
        }[audience]
      }

      return `${title}\n\n${formatSummary(summary)}\n\nFonte: MaracutaIA.`
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ script: localMakeMessage() })
    }

    // Prompt para a OpenAI: peça apenas a mensagem final para WhatsApp (curta)
    const system = `Você é um assistente que escreve mensagens curtas e prontas para WhatsApp sobre propostas legislativas.
Responda em português, máximo 3-4 frases, inclua um call-to-action adequado ao público. Retorne somente a mensagem (sem introdução).`

    const user = `Contexto: "${title}".
Resumo: ${analysisText ? (analysisText.length > 800 ? analysisText.slice(0, 800) + "…" : analysisText) : "sem resumo disponível"}.
Tom: ${tone}. Público: ${audience}.
Gere uma única mensagem pronta para WhatsApp.`

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 220,
        temperature: 0.2,
        n: 1,
      }),
    })

    if (!openaiRes.ok) {
      return NextResponse.json({ script: localMakeMessage() })
    }

    const payload = await openaiRes.json()
    const text = payload?.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ script: localMakeMessage() })
    }

    // garante comprimento razoável
    const script = text.length > 1000 ? text.slice(0, 997).trim() + "…" : text
    return NextResponse.json({ script })
  } catch (err) {
    return NextResponse.json({ script: "Erro ao gerar script. Tente novamente." })
  }
}