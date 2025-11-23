import { NextResponse } from "next/server"
import { EdgeTTS } from "node-edge-tts"
import { readFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  try {
    const { script } = await req.json()

    if (!script) {
      return NextResponse.json({ error: "Missing script" }, { status: 400 })
    }

    // Configuração do Edge-TTS
    // Vozes disponíveis em pt-BR: pt-BR-AntonioNeural, pt-BR-FranciscaNeural, pt-BR-ThalitaNeural
    const tts = new EdgeTTS({
      voice: "pt-BR-AntonioNeural",
      lang: "pt-BR",
      outputFormat: "audio-24khz-96kbitrate-mono-mp3"
    })

    const tempFilePath = join(tmpdir(), `${randomUUID()}.mp3`)

    console.log("🔊 TTS Request | Generating with Edge-TTS...")

    await tts.ttsPromise(script, tempFilePath)

    const buffer = await readFile(tempFilePath)

    // Limpar arquivo temporário em background
    unlink(tempFilePath).catch(console.error)

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    })

  } catch (err: any) {
    console.error("Unexpected TTS error:", err)
    return NextResponse.json(
      { error: "Unexpected error", message: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
