import { useEffect, useMemo, useState } from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Loader2, Send, Sparkles, Target, TrendingUp, Users } from "lucide-react"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { MetricCard } from "../../components/ui/metric-card"
import { ChartCard, chartColors } from "../../components/ui/chart-card"
import { DataTable, type DataTableColumn } from "../../components/ui/data-table"
import { EmptyState } from "../../components/ui/empty-state"
import { Skeleton } from "../../components/ui/skeleton"
import {
    Dialog,
    DialogBody,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog"
import { JsonViewer } from "../../components/ui/json-viewer"
import { useClient } from "../../context/client-context"
import { supabase } from "../../lib/supabase"
import { useN8n } from "../../lib/use-n8n"
import {
    fetchDailyLeads,
    fetchFunnel,
    fetchOutboundMetrics,
    fetchRecentLeads,
    fetchSourceBreakdown,
    LEAD_STATUS_LABELS,
    type DailyLeadCount,
    type FunnelBucket,
    type OutboundMetrics,
    type SourceBreakdown,
} from "./queries"
import type { Lead, LeadStatus } from "../../types/db"

const SLUG = "outbound-sales-agents"

const STATUS_VARIANT: Record<LeadStatus, "default" | "muted" | "success" | "warning" | "destructive"> = {
    new: "muted",
    contacted: "default",
    qualified: "default",
    meeting_booked: "success",
    converted: "success",
    disqualified: "destructive",
}

export function OutboundSalesAgentsPage() {
    const { client, services } = useClient()
    const { trigger, ready } = useN8n()
    const service = services.find((s) => s.slug === SLUG)

    const [metrics, setMetrics] = useState<OutboundMetrics | null>(null)
    const [daily, setDaily] = useState<DailyLeadCount[]>([])
    const [funnel, setFunnel] = useState<FunnelBucket[]>([])
    const [sources, setSources] = useState<SourceBreakdown[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [activeLead, setActiveLead] = useState<Lead | null>(null)
    const [triggeringCampaign, setTriggeringCampaign] = useState(false)
    const [enriching, setEnriching] = useState(false)
    const [feedback, setFeedback] = useState<string | null>(null)

    const reload = useMemo(
        () => async () => {
            if (!client) return
            setLoading(true)
            const [m, d, f, s, l] = await Promise.all([
                fetchOutboundMetrics(client.id),
                fetchDailyLeads(client.id, 14),
                fetchFunnel(client.id),
                fetchSourceBreakdown(client.id),
                fetchRecentLeads(client.id),
            ])
            setMetrics(m)
            setDaily(d)
            setFunnel(f)
            setSources(s)
            setLeads(l)
            setLoading(false)
        },
        [client]
    )

    useEffect(() => {
        reload()
    }, [reload])

    useEffect(() => {
        if (!client) return
        const channel = supabase
            .channel(`outbound:${client.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "leads", filter: `client_id=eq.${client.id}` },
                () => reload()
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [client, reload])

    const handleTriggerCampaign = async () => {
        if (!ready) return
        setTriggeringCampaign(true)
        setFeedback(null)
        const res = await trigger(
            "outbound-campaign",
            { target_count: 50 },
            service?.id ?? null
        )
        setTriggeringCampaign(false)
        if (res.error) setFeedback(`Campaign failed: ${res.error}`)
        else setFeedback(`Campaign triggered. Execution ${res.executionId?.slice(0, 8) ?? ""}…`)
        reload()
    }

    const handleEnrich = async () => {
        if (!ready) return setFeedback("Client context not ready.")
        setEnriching(true)
        setFeedback(null)
        const res = await trigger("lead-enrichment", {}, service?.id ?? null)
        setEnriching(false)
        if (res.error) setFeedback(`Enrichment failed: ${res.error}`)
        else setFeedback("Enrichment job queued.")
        reload()
    }

    const deltaWeek =
        metrics && metrics.leadsPrev7d > 0
            ? ((metrics.leadsLast7d - metrics.leadsPrev7d) / metrics.leadsPrev7d) * 100
            : undefined

    return (
        <div className="grid gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Badge variant="muted">Lead Generation</Badge>
                    <h1 className="text-3xl font-bold tracking-tight">Outbound AI Sales Agents</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Autonomous agents finding prospects, researching them, and sending hyper-personalised cold outreach.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={handleEnrich} disabled={enriching || !ready}>
                        {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Enrich pending leads
                    </Button>
                    <Button onClick={handleTriggerCampaign} disabled={triggeringCampaign || !ready}>
                        {triggeringCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Trigger campaign
                    </Button>
                </div>
            </div>

            {feedback ? (
                <div className="text-xs px-4 py-2 rounded-md border border-border bg-muted/40 text-muted-foreground">
                    {feedback}
                </div>
            ) : null}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading || !metrics ? (
                    <>
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </>
                ) : (
                    <>
                        <MetricCard
                            label="Leads (7d)"
                            value={metrics.leadsLast7d}
                            delta={deltaWeek}
                            deltaLabel="vs prior 7d"
                            icon={Users}
                        />
                        <MetricCard
                            label="Reply rate"
                            value={`${(metrics.replyRate * 100).toFixed(1)}%`}
                            icon={TrendingUp}
                            hint="Last 7 days"
                        />
                        <MetricCard
                            label="Meetings booked"
                            value={metrics.meetingsBooked}
                            icon={Target}
                            hint="Last 7 days"
                        />
                        <MetricCard
                            label="Avg lead score"
                            value={metrics.avgScore !== null ? metrics.avgScore.toFixed(0) : "—"}
                            icon={Sparkles}
                            hint="Out of 100"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard title="Leads / day" description="Last 14 days" className="lg:col-span-2">
                    <LineChart data={daily} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke={chartColors.primary}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ChartCard>

                <ChartCard title="By source" description="Last 30 days">
                    {sources.length === 0 ? (
                        <EmptyState title="No source data yet" description="Triggered campaigns will populate this." />
                    ) : (
                        <PieChart>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Pie data={sources} dataKey="count" nameKey="source" innerRadius={45} outerRadius={75} paddingAngle={2}>
                                {sources.map((_, i) => (
                                    <Cell key={i} fill={chartColors.series[i % chartColors.series.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    )}
                </ChartCard>
            </div>

            <ChartCard title="Funnel" description="Last 30 days, by lead status" height={220}>
                <BarChart data={funnel} layout="vertical" margin={{ top: 8, right: 16, left: 90, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ChartCard>

            <Card className="overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-base">Recent leads</h3>
                        <p className="text-xs text-muted-foreground mt-1">Latest 25 across all campaigns. Click a row for details.</p>
                    </div>
                </div>
                <LeadsTable leads={leads} loading={loading} onSelect={setActiveLead} />
            </Card>

            <Dialog open={activeLead !== null} onClose={() => setActiveLead(null)}>
                {activeLead ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{activeLead.name ?? "Untitled lead"}</DialogTitle>
                            <DialogDescription>
                                {activeLead.title ? `${activeLead.title} · ` : ""}
                                {activeLead.company ?? "Unknown company"}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogBody className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <Field label="Email" value={activeLead.email} />
                                <Field label="Phone" value={activeLead.phone} />
                                <Field label="Source" value={activeLead.source} />
                                <Field
                                    label="Status"
                                    value={
                                        <Badge variant={STATUS_VARIANT[activeLead.status]}>
                                            {LEAD_STATUS_LABELS[activeLead.status]}
                                        </Badge>
                                    }
                                />
                                <Field label="Score" value={activeLead.score?.toString() ?? "—"} />
                                <Field
                                    label="Created"
                                    value={new Date(activeLead.created_at).toLocaleString()}
                                />
                            </div>
                            {activeLead.notes ? (
                                <div className="space-y-1">
                                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</div>
                                    <p className="text-sm whitespace-pre-wrap">{activeLead.notes}</p>
                                </div>
                            ) : null}
                            <div className="space-y-1">
                                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Enrichment</div>
                                <JsonViewer value={activeLead.enriched} />
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setActiveLead(null)}>Close</Button>
                        </DialogFooter>
                    </>
                ) : null}
            </Dialog>
        </div>
    )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
            <div>{value || "—"}</div>
        </div>
    )
}

interface LeadsTableProps {
    leads: Lead[]
    loading: boolean
    onSelect: (lead: Lead) => void
}

function LeadsTable({ leads, loading, onSelect }: LeadsTableProps) {
    const columns: DataTableColumn<Lead>[] = [
        {
            key: "name",
            header: "Name",
            render: (l) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{l.name ?? "—"}</span>
                    {l.title ? <span className="text-xs text-muted-foreground">{l.title}</span> : null}
                </div>
            ),
        },
        {
            key: "company",
            header: "Company",
            render: (l) => <span className="text-sm">{l.company ?? "—"}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (l) => <span className="text-xs text-muted-foreground">{l.email ?? "—"}</span>,
        },
        {
            key: "source",
            header: "Source",
            render: (l) => l.source ? <Badge variant="muted">{l.source}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
            key: "status",
            header: "Status",
            render: (l) => (
                <Badge variant={STATUS_VARIANT[l.status]}>{LEAD_STATUS_LABELS[l.status]}</Badge>
            ),
        },
        {
            key: "score",
            header: "Score",
            align: "right",
            render: (l) => <span className="text-sm tabular-nums">{l.score ?? "—"}</span>,
        },
    ]

    if (loading) {
        return (
            <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    return (
        <DataTable
            columns={columns}
            data={leads}
            rowKey={(l) => l.id}
            onRowClick={onSelect}
            emptyState={
                <EmptyState
                    icon={Users}
                    title="No leads yet"
                    description="Trigger a campaign to start filling the pipeline."
                />
            }
        />
    )
}

const tooltipStyle = {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: 12,
    color: "hsl(var(--popover-foreground))",
} as const
