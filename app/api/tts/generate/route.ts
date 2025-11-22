import { NextResponse } from "next/server"

const DEFAULT_VOICE_ID = "33B4UnXyTNbgLmdEDh5P"
const MODEL_ID = "eleven_multilingual_v2"   

export async function POST(req: Request) {
  try {
    const { script, voiceId } = await req.json()

    if (!script) {
      return NextResponse.json({ error: "Missing script" }, { status: 400 })
    }

    const API_KEY = process.env.ELEVENLABS_API_KEY
    if (!API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    // Evita model_id enviado por engano
    const safeVoiceId =
      typeof voiceId === "string" &&
      voiceId.length > 10 &&
      !voiceId.startsWith("eleven_")
        ? voiceId
        : DEFAULT_VOICE_ID

    console.log("🔊 TTS Request | USING safeVoiceId =", safeVoiceId)

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceId}`

    const ttsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: script,
        model_id: MODEL_ID, // NOVO MODELO
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.7
        }
      })
    })

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error("❌ ElevenLabs Error:", errorText)
      return NextResponse.json(
        { error: "TTS provider error", detail: errorText },
        { status: 502 }
      )
    }

    const buffer = await ttsResponse.arrayBuffer()

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
