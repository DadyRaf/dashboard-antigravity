import { supabase } from "../../lib/supabase"
import type { KnowledgeQuery } from "../../types/db"

export interface KbMetrics {
    queries24h: number
    queriesPrev24h: number
    avgLatencyMs: number | null
    thumbsUpRate: number | null
    docCount: number | null
}

export interface QueriesPerHour {
    hour: string
    count: number
}

export interface TopQuery {
    query: string
    count: number
}

export interface LatencyBucket {
    bucket: string
    count: number
}

export async function fetchKbMetrics(clientId: string, docCount: number | null): Promise<KbMetrics> {
    const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const since48 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const [last24, prev24, recent] = await Promise.all([
        supabase
            .from("knowledge_queries")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("created_at", since24),
        supabase
            .from("knowledge_queries")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("created_at", since48)
            .lt("created_at", since24),
        supabase
            .from("knowledge_queries")
            .select("latency_ms, feedback")
            .eq("client_id", clientId)
            .gte("created_at", since24),
    ])

    const rows = recent.data ?? []
    const latencies = rows
        .map((r: any) => r.latency_ms)
        .filter((n: number | null): n is number => typeof n === "number")
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null

    const feedbackRows = rows.filter((r: any) => typeof r.feedback === "number" && r.feedback !== 0)
    const positives = feedbackRows.filter((r: any) => r.feedback === 1).length
    const thumbsUpRate = feedbackRows.length > 0 ? positives / feedbackRows.length : null

    return {
        queries24h: last24.count ?? 0,
        queriesPrev24h: prev24.count ?? 0,
        avgLatencyMs: avgLatency,
        thumbsUpRate,
        docCount,
    }
}

export async function fetchQueriesPerHour(clientId: string, hours = 24): Promise<QueriesPerHour[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
        .from("knowledge_queries")
        .select("created_at")
        .eq("client_id", clientId)
        .gte("created_at", since)
        .order("created_at", { ascending: true })

    const buckets = new Map<string, number>()
    for (let i = hours - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 60 * 60 * 1000)
        buckets.set(toHour(d), 0)
    }
    for (const row of data ?? []) {
        const key = toHour(new Date((row as any).created_at))
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
    return Array.from(buckets.entries()).map(([hour, count]) => ({ hour, count }))
}

export async function fetchTopQueries(clientId: string, days = 7, limit = 6): Promise<TopQuery[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
        .from("knowledge_queries")
        .select("query")
        .eq("client_id", clientId)
        .gte("created_at", since)

    const counts = new Map<string, number>()
    for (const row of data ?? []) {
        const q = ((row as any).query as string).trim()
        if (!q) continue
        counts.set(q, (counts.get(q) ?? 0) + 1)
    }
    return Array.from(counts.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
}

export async function fetchLatencyHistogram(clientId: string, days = 7): Promise<LatencyBucket[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
        .from("knowledge_queries")
        .select("latency_ms")
        .eq("client_id", clientId)
        .gte("created_at", since)

    const bounds: Array<[number, number, string]> = [
        [0, 250, "<250ms"],
        [250, 500, "250-500ms"],
        [500, 1000, "500ms-1s"],
        [1000, 2000, "1-2s"],
        [2000, 5000, "2-5s"],
        [5000, Infinity, "5s+"],
    ]
    const counts = bounds.map(([, , label]) => ({ bucket: label, count: 0 }))
    for (const row of data ?? []) {
        const v = (row as any).latency_ms as number | null
        if (typeof v !== "number") continue
        for (let i = 0; i < bounds.length; i++) {
            const [lo, hi] = bounds[i]
            if (v >= lo && v < hi) {
                counts[i].count++
                break
            }
        }
    }
    return counts
}

export async function fetchRecentQueries(clientId: string, limit = 25): Promise<KnowledgeQuery[]> {
    const { data, error } = await supabase
        .from("knowledge_queries")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error || !data) return []
    return data as KnowledgeQuery[]
}

function toHour(d: Date): string {
    const copy = new Date(d)
    copy.setMinutes(0, 0, 0)
    return copy.toISOString()
}
