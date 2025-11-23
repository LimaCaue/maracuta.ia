import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { text, audio, phone, poll, recipients } = body

    if (!text && !audio) {
      return NextResponse.json({ error: "Content required (text or audio)" }, { status: 400 })
    }

    const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
    const TOKEN = process.env.WHATSAPP_TOKEN
    const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN
    const DEFAULT_PHONE = process.env.WHATSAPP_DEFAULT_PHONE
    const GENERIC_API_URL = process.env.WHATSAPP_API_URL

    const isZApi = !!(INSTANCE_ID && TOKEN)

    const targetList: string[] =
      Array.isArray(recipients) && recipients.length
        ? recipients
        : (phone ? [phone] : (DEFAULT_PHONE ? [DEFAULT_PHONE] : []))

    if (!targetList.length) {
      return NextResponse.json({ error: "Target phone number(s) required" }, { status: 400 })
    }

    const results: any[] = []

    // Helper senders (copiado/adaptado da lógica original)
    async function sendText(to: string) {
      let url, payload, headers: any
      if (isZApi) {
        url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`
        payload = { phone: to, message: text }
        headers = { "Content-Type": "application/json" }
        if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
      } else if (GENERIC_API_URL) {
        url = `${GENERIC_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE || "default"}`
        payload = { number: to, text }
        headers = {
          "Content-Type": "application/json",
          apikey: process.env.WHATSAPP_API_KEY || ""
        }
      } else throw new Error("No provider config")
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("send text failed")
      results.push({ to, type: "text", status: "sent" })
    }

    async function sendAudio(to: string) {
      let url, payload, headers: any
      if (isZApi) {
        const isNewsletter = to.includes("@newsletter")
        if (isNewsletter) {
          url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-document/wav`
          payload = { phone: to, document: audio, fileName: "audio.wav" }
        } else {
          url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-audio`
          payload = { phone: to, audio, waveform: true }
        }
        headers = { "Content-Type": "application/json" }
        if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
      } else if (GENERIC_API_URL) {
        url = `${GENERIC_API_URL}/message/sendWhatsAppAudio/${process.env.WHATSAPP_INSTANCE || "default"}`
        payload = {
          number: to,
          mediatype: "audio",
          mimetype: "audio/mpeg",
          media: audio,
          fileName: "audio.mp3"
        }
        headers = {
          "Content-Type": "application/json",
          apikey: process.env.WHATSAPP_API_KEY || ""
        }
      } else return
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      if (!res.ok) {
        if (isZApi) {
          // fallback
          const docUrl = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-document/wav`
          const docPayload = { phone: to, document: audio, fileName: "audio.wav" }
          const docRes = await fetch(docUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(docPayload)
          })
          if (docRes.ok) {
            results.push({ to, type: "audio", status: "sent_as_document" })
            return
          }
        }
        throw new Error("send audio failed")
      }
      results.push({ to, type: "audio", status: "sent" })
    }

    async function sendPoll(to: string) {
      if (!poll?.question || !Array.isArray(poll.options) || !poll.options.length) return
      if (!isZApi) return
      const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-poll`
      const payload = { phone: to, message: poll.question, poll: poll.options }
      const headers: any = { "Content-Type": "application/json" }
      if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error("send poll failed")
      results.push({ to, type: "poll", status: "sent" })
    }

    for (const to of targetList) {
      if (text) {
        try { await sendText(to) } catch (e) { results.push({ to, type: "text", status: "error", error: String(e) }) }
      }
      if (audio) {
        try { await sendAudio(to) } catch (e) { results.push({ to, type: "audio", status: "error", error: String(e) }) }
      }
      if (poll) {
        try { await sendPoll(to) } catch (e) { results.push({ to, type: "poll", status: "error", error: String(e) }) }
      }
      await new Promise(r => setTimeout(r, 120))
    }

    const successCount = results.filter(r =>
      ["sent","sent_as_document"].includes(r.status)
    ).length
    const failCount = results.filter(r => r.status === "error").length

    return NextResponse.json({ success: true, successCount, failCount, results })
  } catch (error) {
    console.error("WhatsApp send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
