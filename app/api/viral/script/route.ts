import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { alert, tone, pollOptions } = await req.json()
    const key = process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: "OPENAI_API_KEY ausente" }, { status: 500 })

    const system = "Você cria conteúdo cívico viral factual sem desinformação."
    const user = `Gerar script.
Dados: ${JSON.stringify(alert)}
Tom: ${tone}
Incluir enquete (lista de opções ao final): ${pollOptions && pollOptions.length ? pollOptions.join(" | ") : "não"}
Estrutura:
1. Abertura curta e chamativa (<=120 caracteres)
2. 3–5 frases explicando risco em linguagem simples
3. Chamada para ação final
Se factual e direto. Retorne apenas o texto final.`

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.55
      })
    })
    const j = await resp.json()
    const script = j.choices?.[0]?.message?.content?.trim() || ""
    let final = script
    if (pollOptions?.length) {
      final += "\n\n" + pollOptions.map(o => o).join("\n")
    }
    return NextResponse.json({ script: final })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}