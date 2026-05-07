import { useEffect, useMemo, useState } from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import {
    BookOpen,
    Loader2,
    MessageSquare,
    RefreshCw,
    Send,
    ThumbsUp,
    Timer,
    Upload,
} from "lucide-react"
import { Card } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { MetricCard } from "../../components/ui/metric-card"
import { ChartCard, chartColors } from "../../components/ui/chart-card"
import { DataTable, type DataTableColumn } from "../../components/ui/data-table"
import { EmptyState } from "../../components/ui/empty-state"
import { Skeleton } from "../../components/ui/skeleton"
import { Textarea } from "../../components/ui/input"
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
    fetchKbMetrics,
    fetchLatencyHistogram,
    fetchQueriesPerHour,
    fetchRecentQueries,
    fetchTopQueries,
    type KbMetrics,
    type LatencyBucket,
    type QueriesPerHour,
    type TopQuery,
} from "./queries"
import type { KnowledgeQuery } from "../../types/db"

const SLUG = "custom-knowledge-bases"

export function CustomKnowledgeBasesPage() {
    const { client, services } = useClient()
    const { trigger, ready } = useN8n()
    const service = services.find((s) => s.slug === SLUG)
    const docCount = (service?.config?.kb_doc_count as number | undefined) ?? null
    const namespace = (service?.config?.kb_namespace as string | undefined) ?? null

    const [metrics, setMetrics] = useState<KbMetrics | null>(null)
    const [perHour, setPerHour] = useState<QueriesPerHour[]>([])
    const [topQueries, setTopQueries] = useState<TopQuery[]>([])
    const [latency, setLatency] = useState<LatencyBucket[]>([])
    const [recent, setRecent] = useState<KnowledgeQuery[]>([])
    const [loading, setLoading] = useState(true)

    const [testQuery, setTestQuery] = useState("")
    const [testing, setTesting] = useState(false)
    const [testAnswer, setTestAnswer] = useState<{ answer?: string; sources?: unknown } | null>(null)

    const [reindexing, setReindexing] = useState(false)
    const [ingestOpen, setIngestOpen] = useState(false)
    const [ingestUrls, setIngestUrls] = useState("")
    const [ingesting, setIngesting] = useState(false)
    const [feedback, setFeedback] = useState<string | null>(null)

    const [expandedId, setExpandedId] = useState<string | null>(null)

    const reload = useMemo(
        () => async () => {
            if (!client) return
            setLoading(true)
            const [m, ph, tq, lat, rq] = await Promise.all([
                fetchKbMetrics(client.id, docCount),
                fetchQueriesPerHour(client.id, 24),
                fetchTopQueries(client.id),
                fetchLatencyHistogram(client.id),
                fetchRecentQueries(client.id),
            ])
            setMetrics(m)
            setPerHour(ph)
            setTopQueries(tq)
            setLatency(lat)
            setRecent(rq)
            setLoading(false)
        },
        [client, docCount]
    )

    useEffect(() => {
        reload()
    }, [reload])

    useEffect(() => {
        if (!client) return
        const channel = supabase
            .channel(`kb:${client.id}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "knowledge_queries", filter: `client_id=eq.${client.id}` },
                () => reload()
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [client, reload])

    const handleReindex = async () => {
        if (!ready) return
        setReindexing(true)
        setFeedback(null)
        const res = await trigger("kb-reindex", { namespace }, service?.id ?? null)
        setReindexing(false)
        setFeedback(res.error ? `Reindex failed: ${res.error}` : "Reindex queued.")
    }

    const handleIngest = async () => {
        if (!ready) return
        const urls = ingestUrls
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean)
        if (urls.length === 0) {
            setFeedback("Provide at least one document URL.")
            return
        }
        setIngesting(true)
        setFeedback(null)
        const res = await trigger("kb-ingest", { namespace, urls }, service?.id ?? null)
        setIngesting(false)
        setIngestOpen(false)
        setIngestUrls("")
        setFeedback(res.error ? `Ingest failed: ${res.error}` : `Ingest queued for ${urls.length} document${urls.length === 1 ? "" : "s"}.`)
    }

    const handleTestQuery = async () => {
        if (!ready || !testQuery.trim()) return
        setTesting(true)
        setTestAnswer(null)
        const res = await trigger<{ answer?: string; sources?: unknown }>(
            "kb-query",
            { namespace, query: testQuery.trim() },
            service?.id ?? null
        )
        setTesting(false)
        if (res.error) {
            setTestAnswer({ answer: `Error: ${res.error}` })
        } else if (res.response) {
            setTestAnswer(res.response)
        }
        reload()
    }

    const queriesDelta =
        metrics && metrics.queriesPrev24h > 0
            ? ((metrics.queries24h - metrics.queriesPrev24h) / metrics.queriesPrev24h) * 100
            : undefined

    return (
        <div className="grid gap-6 pb-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Badge variant="muted">Operational Automation</Badge>
                    <h1 className="text-3xl font-bold tracking-tight">Custom AI Knowledge Bases</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        A private "company brain" trained on your internal documents. Searchable by every employee, in seconds.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setIngestOpen(true)} disabled={!ready}>
                        <Upload className="w-4 h-4" />
                        Ingest documents
                    </Button>
                    <Button variant="outline" onClick={handleReindex} disabled={reindexing || !ready}>
                        {reindexing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Reindex
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
                            label="Queries (24h)"
                            value={metrics.queries24h}
                            delta={queriesDelta}
                            deltaLabel="vs prior 24h"
                            icon={MessageSquare}
                        />
                        <MetricCard
                            label="Avg latency"
                            value={metrics.avgLatencyMs !== null ? `${Math.round(metrics.avgLatencyMs)}ms` : "—"}
                            icon={Timer}
                            hint="Last 24 hours"
                        />
                        <MetricCard
                            label="Thumbs-up rate"
                            value={metrics.thumbsUpRate !== null ? `${Math.round(metrics.thumbsUpRate * 100)}%` : "—"}
                            icon={ThumbsUp}
                            hint="With feedback"
                        />
                        <MetricCard
                            label="Indexed docs"
                            value={metrics.docCount ?? "—"}
                            icon={BookOpen}
                            hint={namespace ? `namespace: ${namespace}` : "No namespace set"}
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Queries per hour" description="Last 24 hours">
                    <AreaChart data={perHour} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="kbAreaPrimary" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="hour"
                            tickFormatter={(v) => new Date(v).toLocaleTimeString(undefined, { hour: "numeric" })}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            labelFormatter={(v) => new Date(v).toLocaleString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={chartColors.primary}
                            strokeWidth={2}
                            fill="url(#kbAreaPrimary)"
                        />
                    </AreaChart>
                </ChartCard>

                <ChartCard title="Latency distribution" description="Last 7 days">
                    <BarChart data={latency} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>
            </div>

            <ChartCard title="Top queries" description="Last 7 days" height={Math.max(topQueries.length * 36 + 24, 180)}>
                {topQueries.length === 0 ? (
                    <EmptyState title="No queries yet" description="Test queries below will populate this chart." />
                ) : (
                    <BarChart data={topQueries} layout="vertical" margin={{ top: 8, right: 16, left: 200, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                        <YAxis dataKey="query" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={220} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                )}
            </ChartCard>

            <Card className="overflow-hidden">
                <div className="p-6 pb-4">
                    <h3 className="font-semibold text-base">Recent queries</h3>
                    <p className="text-xs text-muted-foreground mt-1">Latest 25 queries against this knowledge base.</p>
                </div>
                <RecentQueriesTable
                    queries={recent}
                    loading={loading}
                    expandedId={expandedId}
                    onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                />
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col md:flex-row gap-3 md:items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Test the knowledge base
                        </label>
                        <Textarea
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            placeholder="What is our policy on remote work?"
                            rows={2}
                            className="resize-none"
                        />
                    </div>
                    <Button onClick={handleTestQuery} disabled={testing || !testQuery.trim() || !ready}>
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Run query
                    </Button>
                </div>
                {testAnswer ? (
                    <div className="max-w-7xl mx-auto px-8 pb-4 -mt-2">
                        <Card className="p-4 space-y-2">
                            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Answer</div>
                            <p className="text-sm whitespace-pre-wrap">{testAnswer.answer ?? "—"}</p>
                            {testAnswer.sources ? (
                                <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                        Show retrieved chunks
                                    </summary>
                                    <div className="mt-2">
                                        <JsonViewer value={testAnswer.sources} initiallyOpen />
                                    </div>
                                </details>
                            ) : null}
                        </Card>
                    </div>
                ) : null}
            </div>

            <Dialog open={ingestOpen} onClose={() => setIngestOpen(false)}>
                <DialogHeader>
                    <DialogTitle>Ingest documents</DialogTitle>
                    <DialogDescription>One URL per line. The kb-ingest workflow will fetch, chunk, and embed each document.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <Textarea
                        rows={6}
                        value={ingestUrls}
                        onChange={(e) => setIngestUrls(e.target.value)}
                        placeholder={"https://docs.acme.com/handbook.pdf\nhttps://docs.acme.com/policy.pdf"}
                    />
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIngestOpen(false)}>Cancel</Button>
                    <Button onClick={handleIngest} disabled={ingesting}>
                        {ingesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Queue ingest
                    </Button>
                </DialogFooter>
            </Dialog>
        </div>
    )
}

interface RecentQueriesTableProps {
    queries: KnowledgeQuery[]
    loading: boolean
    expandedId: string | null
    onToggle: (id: string) => void
}

function RecentQueriesTable({ queries, loading, expandedId, onToggle }: RecentQueriesTableProps) {
    const columns: DataTableColumn<KnowledgeQuery>[] = [
        {
            key: "time",
            header: "Time",
            render: (q) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(q.created_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: "query",
            header: "Query",
            render: (q) => <span className="text-sm line-clamp-1">{q.query}</span>,
        },
        {
            key: "latency",
            header: "Latency",
            align: "right",
            render: (q) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {q.latency_ms !== null ? `${q.latency_ms}ms` : "—"}
                </span>
            ),
        },
        {
            key: "feedback",
            header: "Feedback",
            align: "center",
            render: (q) => {
                if (q.feedback === 1) return <Badge variant="success">Helpful</Badge>
                if (q.feedback === -1) return <Badge variant="destructive">Unhelpful</Badge>
                return <span className="text-xs text-muted-foreground">—</span>
            },
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
            data={queries}
            rowKey={(q) => q.id}
            onRowClick={(q) => onToggle(q.id)}
            expandedRowId={expandedId}
            renderExpanded={(q) => (
                <div className="space-y-3">
                    {q.answer ? (
                        <div className="space-y-1">
                            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Answer</div>
                            <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                        </div>
                    ) : null}
                    <div className="space-y-1">
                        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source chunks</div>
                        <JsonViewer value={q.source_chunks} initiallyOpen={false} />
                    </div>
                </div>
            )}
            emptyState={
                <EmptyState
                    icon={MessageSquare}
                    title="No queries yet"
                    description="Run a test query below to see it appear here."
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
