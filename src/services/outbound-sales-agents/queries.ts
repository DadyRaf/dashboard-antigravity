import { supabase } from "../../lib/supabase"
import type { Lead, LeadStatus } from "../../types/db"

export interface OutboundMetrics {
    leadsLast7d: number
    leadsPrev7d: number
    replyRate: number
    meetingsBooked: number
    avgScore: number | null
}

export interface DailyLeadCount {
    date: string
    count: number
}

export interface FunnelBucket {
    status: LeadStatus
    label: string
    count: number
}

export interface SourceBreakdown {
    source: string
    count: number
}

const STATUS_LABELS: Record<LeadStatus, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    meeting_booked: "Meeting booked",
    disqualified: "Disqualified",
    converted: "Converted",
}

const FUNNEL_ORDER: LeadStatus[] = ["new", "contacted", "qualified", "meeting_booked", "converted"]

export async function fetchOutboundMetrics(clientId: string): Promise<OutboundMetrics> {
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const since14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [last7, prev7, allRecent] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).gte("created_at", since7),
        supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("client_id", clientId)
            .gte("created_at", since14)
            .lt("created_at", since7),
        supabase
            .from("leads")
            .select("status, score")
            .eq("client_id", clientId)
            .gte("created_at", since7),
    ])

    const recent = allRecent.data ?? []
    const total = recent.length || 1
    const replied = recent.filter((l: any) => l.status !== "new" && l.status !== "disqualified").length
    const meetings = recent.filter((l: any) => l.status === "meeting_booked" || l.status === "converted").length
    const scores = recent.map((l: any) => l.score).filter((n: number | null): n is number => typeof n === "number")
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

    return {
        leadsLast7d: last7.count ?? 0,
        leadsPrev7d: prev7.count ?? 0,
        replyRate: replied / total,
        meetingsBooked: meetings,
        avgScore,
    }
}

export async function fetchDailyLeads(clientId: string, days = 14): Promise<DailyLeadCount[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .eq("client_id", clientId)
        .gte("created_at", since)
        .order("created_at", { ascending: true })

    if (error || !data) return []

    const buckets = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        buckets.set(toDay(d), 0)
    }
    for (const row of data) {
        const day = toDay(new Date((row as any).created_at))
        buckets.set(day, (buckets.get(day) ?? 0) + 1)
    }

    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }))
}

export async function fetchFunnel(clientId: string, days = 30): Promise<FunnelBucket[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
        .from("leads")
        .select("status")
        .eq("client_id", clientId)
        .gte("created_at", since)

    if (error || !data) return FUNNEL_ORDER.map((s) => ({ status: s, label: STATUS_LABELS[s], count: 0 }))

    const counts = new Map<LeadStatus, number>()
    for (const row of data) {
        const s = (row as any).status as LeadStatus
        counts.set(s, (counts.get(s) ?? 0) + 1)
    }

    return FUNNEL_ORDER.map((s) => ({
        status: s,
        label: STATUS_LABELS[s],
        count: counts.get(s) ?? 0,
    }))
}

export async function fetchSourceBreakdown(clientId: string, days = 30): Promise<SourceBreakdown[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
        .from("leads")
        .select("source")
        .eq("client_id", clientId)
        .gte("created_at", since)

    if (error || !data) return []

    const counts = new Map<string, number>()
    for (const row of data) {
        const src = ((row as any).source as string | null) ?? "Unknown"
        counts.set(src, (counts.get(src) ?? 0) + 1)
    }
    return Array.from(counts.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
}

export async function fetchRecentLeads(clientId: string, limit = 25): Promise<Lead[]> {
    const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error || !data) return []
    return data as Lead[]
}

function toDay(d: Date): string {
    return d.toISOString().slice(0, 10)
}

export { STATUS_LABELS as LEAD_STATUS_LABELS, FUNNEL_ORDER }
