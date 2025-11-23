import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { text, audio, phone, poll } = body

        if (!text && !audio) {
            return NextResponse.json({ error: "Content required (text or audio)" }, { status: 400 })
        }

        // Z-API Configuration
        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
        const TOKEN = process.env.WHATSAPP_TOKEN
        const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN
        const DEFAULT_PHONE = process.env.WHATSAPP_DEFAULT_PHONE

        // Fallback to generic URL if Z-API vars aren't present (backward compatibility)
        const GENERIC_API_URL = process.env.WHATSAPP_API_URL

        const targetPhone = phone || DEFAULT_PHONE

        if (!targetPhone) {
            return NextResponse.json({ error: "Target phone number is required" }, { status: 400 })
        }

        const results = []

        // Helper to determine provider logic
        const isZApi = !!(INSTANCE_ID && TOKEN)

        // 1. Send Text
        if (text) {
            try {
                let url, payload, headers: any

                if (isZApi) {
                    url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`
                    payload = {
                        phone: targetPhone,
                        message: text
                    }
                    headers = { "Content-Type": "application/json" }
                    if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
                } else if (GENERIC_API_URL) {
                    // Evolution API / Generic fallback
                    url = `${GENERIC_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE || "default"}`
                    payload = {
                        number: targetPhone,
                        text: text
                    }
                    headers = {
                        "Content-Type": "application/json",
                        "apikey": process.env.WHATSAPP_API_KEY || ""
                    }
                } else {
                    throw new Error("No WhatsApp configuration found")
                }

                const res = await fetch(url, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload)
                })

                if (!res.ok) {
                    const errText = await res.text()
                    console.error("WhatsApp Text Error:", errText)
                    throw new Error(`Failed to send text: ${res.status}`)
                }
                results.push({ type: "text", status: "sent" })
            } catch (e) {
                console.error("Error sending text:", e)
                results.push({ type: "text", status: "error", error: String(e) })
            }
        }

        // 2. Send Audio
        if (audio) {
            try {
                let url, payload, headers: any

                if (isZApi) {
                    // Check if it's a newsletter/channel
                    const isNewsletter = targetPhone.includes("@newsletter")

                    // For Newsletters, send-audio often fails or is silent. Use send-document (PTT) instead.
                    // For regular numbers/groups, prefer send-audio (waveform).
                    if (isNewsletter) {
                        console.log("Target is Newsletter. Using send-document/wav for audio.")
                        url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-document/wav`
                        payload = {
                            phone: targetPhone,
                            document: audio, // Base64 data URI
                            fileName: "audio.wav"
                        }
                        headers = { "Content-Type": "application/json" } as any
                        if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
                    } else {
                        url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-audio`

                        // Debug: Log the start of the audio string to check format
                        console.log("Sending audio to Z-API. Start:", audio.substring(0, 50))

                        // Z-API often works best with the full Data URI for base64
                        payload = {
                            phone: targetPhone,
                            audio: audio,
                            waveform: true
                        }
                        headers = { "Content-Type": "application/json" } as any
                        if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
                    }
                } else if (GENERIC_API_URL) {
                    // Evolution API fallback
                    url = `${GENERIC_API_URL}/message/sendWhatsAppAudio/${process.env.WHATSAPP_INSTANCE || "default"}`
                    payload = {
                        number: targetPhone,
                        mediatype: "audio",
                        mimetype: "audio/mpeg",
                        media: audio,
                        fileName: "audio.mp3"
                    }
                    headers = {
                        "Content-Type": "application/json",
                        "apikey": process.env.WHATSAPP_API_KEY || ""
                    }
                }

                if (url) {
                    const res = await fetch(url, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(payload)
                    })

                    if (!res.ok) {
                        const errText = await res.text()
                        console.error("WhatsApp Audio Error:", errText)

                        // Fallback: Try sending as document (sometimes channels accept docs but not audio messages)
                        if (isZApi) {
                            console.log("Attempting fallback: Send as document (PTT)")
                            const docUrl = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-document/wav`
                            const docPayload = {
                                phone: targetPhone,
                                document: payload?.audio,
                                fileName: "audio.wav"
                            }
                            const docRes = await fetch(docUrl, {
                                method: "POST",
                                headers,
                                body: JSON.stringify(docPayload)
                            })
                            if (docRes.ok) {
                                results.push({ type: "audio", status: "sent_as_document" })
                                return // Exit success
                            } else {
                                console.error("Fallback Document Error:", await docRes.text())
                            }
                        }

                        throw new Error(`Failed to send audio: ${res.status} - ${errText}`)
                    }
                    results.push({ type: "audio", status: "sent" })
                }
            } catch (e) {
                console.error("Error sending audio:", e)
                results.push({ type: "audio", status: "error", error: String(e) })
            }
        }

        // 3. Send Poll
        if (poll && poll.question && poll.options && poll.options.length > 0) {
            try {
                let url, payload, headers: any

                if (isZApi) {
                    url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-poll`
                    payload = {
                        phone: targetPhone,
                        message: poll.question,
                        poll: poll.options
                    }
                    headers = { "Content-Type": "application/json" }
                    if (CLIENT_TOKEN) headers["Client-Token"] = CLIENT_TOKEN
                }

                if (url) {
                    const res = await fetch(url, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(payload)
                    })

                    if (!res.ok) {
                        const errText = await res.text()
                        console.error("WhatsApp Poll Error:", errText)
                        throw new Error(`Failed to send poll: ${res.status}`)
                    }
                    results.push({ type: "poll", status: "sent" })
                }
            } catch (e) {
                console.error("Error sending poll:", e)
                results.push({ type: "poll", status: "error", error: String(e) })
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error("WhatsApp send error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
