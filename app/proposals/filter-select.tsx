"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter } from "lucide-react"

export function FilterSelect() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentType = searchParams.get("type") || "all"
    const currentQuery = searchParams.get("q") || ""

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value
        const params = new URLSearchParams()
        if (type !== "all") params.set("type", type)
        if (currentQuery) params.set("q", currentQuery)
        params.set("page", "1") // Reset to page 1

        router.push(`/proposals?${params.toString()}`)
    }

    return (
        <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
                value={currentType}
                onChange={handleChange}
                className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-10 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
            >
                <option value="all">Todos os Tipos</option>
                <option value="PL">PL (Projeto de Lei)</option>
                <option value="PEC">PEC</option>
                <option value="MPV">MPV (Medida Provisória)</option>
                <option value="PLP">PLP (Lei Complementar)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 opacity-50"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>
        </div>
    )
}
