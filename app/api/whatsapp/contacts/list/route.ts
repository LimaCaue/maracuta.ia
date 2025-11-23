import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = searchParams.get("page") || "1"
        const pageSize = searchParams.get("pageSize") || "20"

        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID
        const TOKEN = process.env.WHATSAPP_TOKEN
        const CLIENT_TOKEN = process.env.WHATSAPP_CLIENT_TOKEN

        if (!INSTANCE_ID || !TOKEN) {
            return NextResponse.json({ error: "Z-API configuration missing" }, { status: 500 })
        }

        const url = `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/contacts?page=${page}&pageSize=${pageSize}`

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
            console.error("List Contacts Error:", errText)
            return NextResponse.json({ error: "Failed to list contacts", details: errText }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error("List contacts error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
