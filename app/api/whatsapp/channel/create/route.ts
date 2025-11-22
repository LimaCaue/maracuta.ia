import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
        const TOKEN = process.env.WHATSAPP_TOKEN
        const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN

        if (!INSTANCE_ID || !TOKEN) {
            return NextResponse.json({ error: "Z-API configuration missing" }, { status: 500 })
        }

        const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/create-newsletter`

        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (CLIENT_TOKEN) {
            headers["Client-Token"] = CLIENT_TOKEN
        }

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ name })
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error("Create Newsletter Error:", errText)
            return NextResponse.json({ error: "Failed to create newsletter", details: errText }, { status: res.status })
        }

        const data = await res.json()
        // Z-API response structure for create-newsletter:
        // { value: { id: "123...@newsletter", ... } } or similar. 
        // We need to inspect the actual response, but usually it returns the object created.

        return NextResponse.json(data)

    } catch (error) {
        console.error("Create channel error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
