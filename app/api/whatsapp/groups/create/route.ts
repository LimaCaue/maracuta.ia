import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { groupName, phones, autoInvite } = body

        if (!groupName || !phones || !Array.isArray(phones) || phones.length === 0) {
            return NextResponse.json({ error: "Invalid request. groupName and phones (array) are required." }, { status: 400 })
        }

        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
        const TOKEN = process.env.WHATSAPP_TOKEN
        const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN

        if (!INSTANCE_ID || !TOKEN) {
            return NextResponse.json({ error: "Z-API configuration missing" }, { status: 500 })
        }

        const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/create-group`

        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (CLIENT_TOKEN) {
            headers["Client-Token"] = CLIENT_TOKEN
        }

        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                groupName,
                phones,
                autoInvite: autoInvite ?? true
            })
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error("Create Group Error:", errText)
            return NextResponse.json({ error: "Failed to create group", details: errText }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("Create group error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
