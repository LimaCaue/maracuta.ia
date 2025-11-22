import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        // This is a placeholder for the transmit functionality.
        // Currently just logs and returns success to prevent 404 errors in the frontend.
        const body = await req.json()
        console.log("Transmit request received:", body?.mime, body?.audio ? "Audio present" : "No audio")

        return NextResponse.json({ success: true, message: "Transmitted (mock)" })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
