import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { script } = await req.json()
    const key = process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: "OPENAI_API_KEY ausente" }, { status: 500 })
    if (!script) return NextResponse.json({ error: "Script vazio" }, { status: 400 })

    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: script,
        format: "mp3"
      })
    })

    if (!resp.ok) {
      const txt = await resp.text()
      return NextResponse.json({ error: "Falha TTS: " + txt }, { status: 500 })
    }

    const arrayBuffer = await resp.arrayBuffer()
    const b64 = Buffer.from(arrayBuffer).toString("base64")
    return NextResponse.json({ audioBase64: b64 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}