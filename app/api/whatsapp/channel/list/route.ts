import { NextResponse } from "next/server"

export async function GET() {
    try {
        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
        const TOKEN = process.env.WHATSAPP_TOKEN
        const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN

        if (!INSTANCE_ID || !TOKEN) {
            return NextResponse.json({ error: "Z-API configuration missing" }, { status: 500 })
        }

        const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/newsletter`

        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (CLIENT_TOKEN) {
            headers["Client-Token"] = CLIENT_TOKEN
        }

        const res = await fetch(url, {
            method: "GET",
            headers
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error("List Newsletters Error:", errText)
            return NextResponse.json({ error: "Failed to list newsletters", details: errText }, { status: res.status })
        }

        const data = await res.json()
        // Z-API returns a list of newsletters.
        // We return it as is.
        return NextResponse.json(data)

    } catch (error) {
        console.error("List channels error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
