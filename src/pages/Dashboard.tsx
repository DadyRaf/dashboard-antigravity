import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
    Activity,
    AlertCircle,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
} from "lucide-react"
import { Card } from "../components/ui/card"
import { MetricCard } from "../components/ui/metric-card"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import { StatusDot } from "../components/ui/status-dot"
import { EmptyState } from "../components/ui/empty-state"
import { cn } from "../lib/utils"
import { getIcon } from "../lib/icons"
import { useClient } from "../context/client-context"
import { supabase } from "../lib/supabase"
import { getServiceEntry, type ServiceSummary } from "../services/registry"
import type { EnabledService, ExecutionStatus } from "../types/db"

interface ExecutionAggregates {
    total: number
    success: number
    error: number
    running: number
}

interface ActivityRow {
    id: string
    workflow_name: string
    status: ExecutionStatus
    started_at: string
    service_id: string | null
    service_name: string | null
}

export function Dashboard() {
    const { client, services } = useClient()

    const [aggregates, setAggregates] = useState<ExecutionAggregates | null>(null)
    const [activity, setActivity] = useState<ActivityRow[]>([])
    const [loading, setLoading] = useState(true)

    const reload = useMemo(
        () => async () => {
            if (!client) return
            const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            const [statusRes, activityRes] = await Promise.all([
                supabase
                    .from("executions")
                    .select("status")
                    .eq("client_id", client.id)
                    .gte("started_at", since24),
                supabase
                    .from("executions")
                    .select("id, workflow_name, status, started_at, service_id, services(name)")
                    .eq("client_id", client.id)
                    .order("started_at", { ascending: false })
                    .limit(20),
            ])
            const rows = (statusRes.data ?? []) as Array<{ status: ExecutionStatus }>
            const total = rows.length
            const success = rows.filter((r) => r.status === "success").length
            const error = rows.filter((r) => r.status === "error").length
            const running = rows.filter((r) => r.status === "running" || r.status === "pending").length
            setAggregates({ total, success, error, running })

            setActivity(
                (activityRes.data ?? []).map((r: any) => ({
                    id: r.id,
                    workflow_name: r.workflow_name,
                    status: r.status,
                    started_at: r.started_at,
                    service_id: r.service_id,
                    service_name: r.services?.name ?? null,
                }))
            )
            setLoading(false)
        },
        [client]
    )

    useEffect(() => {
        setLoading(true)
        reload()
    }, [reload])

    useEffect(() => {
        if (!client) return
        const channel = supabase
            .channel(`dashboard:${client.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "executions",
                    filter: `client_id=eq.${client.id}`,
                },
                () => reload()
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [client, reload])

    const successRate = useMemo(() => {
        if (!aggregates || aggregates.total === 0) return null
        return aggregates.success / aggregates.total
    }, [aggregates])

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {client?.name ? `${client.name} dashboard` : "Dashboard"}
                </h1>
                <p className="text-muted-foreground mt-2">
                    Live view of every automation running for you.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {!aggregates ? (
                    <>
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </>
                ) : (
                    <>
                        <MetricCard
                            label="Runs (24h)"
                            value={aggregates.total}
                            icon={Activity}
                            hint="All workflows"
                        />
                        <MetricCard
                            label="Success rate"
                            value={successRate !== null ? `${Math.round(successRate * 100)}%` : "—"}
                            icon={CheckCircle2}
                            hint={`${aggregates.success} of ${aggregates.total}`}
                        />
                        <MetricCard
                            label="In flight"
                            value={aggregates.running}
                            icon={Activity}
                            hint="Pending or running"
                        />
                        <MetricCard
                            label="Errors"
                            value={aggregates.error}
                            icon={AlertCircle}
                            hint="Last 24 hours"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Your services</h2>
                        <span className="text-xs text-muted-foreground">{services.length} active</span>
                    </div>
                    {services.length === 0 ? (
                        <Card className="p-8">
                            <EmptyState
                                icon={Boxes}
                                title="No services enabled yet"
                                description="Once AA Consulting enables services on your account, you'll see them here."
                            />
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {services.map((service) => (
                                <ServiceMiniCard key={service.id} service={service} clientId={client?.id ?? ""} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold">Recent activity</h2>
                        <Link to="/logs" className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <Card className="overflow-hidden">
                        {loading && activity.length === 0 ? (
                            <div className="p-6 space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : activity.length === 0 ? (
                            <EmptyState
                                icon={Activity}
                                title="Nothing yet"
                                description="Run a workflow to see it appear here in real time."
                            />
                        ) : (
                            <ul className="divide-y divide-border/50">
                                {activity.map((row) => (
                                    <li key={row.id}>
                                        <Link
                                            to="/logs"
                                            className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                                        >
                                            <StatusDot status={row.status} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs truncate">{row.workflow_name}</span>
                                                    {row.service_name ? (
                                                        <Badge variant="muted">{row.service_name}</Badge>
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {timeAgo(row.started_at)}
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}

interface ServiceMiniCardProps {
    service: EnabledService
    clientId: string
}

function ServiceMiniCard({ service, clientId }: ServiceMiniCardProps) {
    const Icon = getIcon(service.icon)
    const [summary, setSummary] = useState<ServiceSummary | null>(null)
    const [error, setError] = useState(false)
    const entry = getServiceEntry(service.slug)
    const wired = entry !== null

    useEffect(() => {
        if (!entry || !clientId) return
        let cancelled = false
        entry
            .summary(clientId)
            .then((s) => {
                if (!cancelled) setSummary(s)
            })
            .catch(() => {
                if (!cancelled) setError(true)
            })
        return () => {
            cancelled = true
        }
    }, [entry, clientId])

    const positive = typeof summary?.delta === "number" && summary.delta >= 0
    const showDelta = typeof summary?.delta === "number"

    return (
        <Link
            to={`/services/${service.slug}`}
            className="group block"
        >
            <Card className="p-5 h-full hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{service.name}</div>
                            <div className="text-xs text-muted-foreground">{service.category}</div>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0 group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                    {wired ? (
                        summary ? (
                            <>
                                <div>
                                    <div className="text-xs text-muted-foreground">{summary.label}</div>
                                    <div className="text-2xl font-bold tabular-nums leading-tight">{summary.value}</div>
                                </div>
                                <div className="flex flex-col items-end text-right gap-1">
                                    {showDelta ? (
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-0.5 text-xs font-medium",
                                                positive ? "text-emerald-500" : "text-destructive"
                                            )}
                                        >
                                            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {Math.abs(summary.delta!).toFixed(0)}%
                                        </span>
                                    ) : null}
                                    {summary.hint ? (
                                        <span className="text-[11px] text-muted-foreground">{summary.hint}</span>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <Skeleton className="h-7 w-20" />
                                <Skeleton className="h-3 w-12" />
                            </>
                        )
                    ) : (
                        <span className="text-xs text-muted-foreground italic">
                            {error ? "Could not load metrics" : "Coming soon"}
                        </span>
                    )}
                </div>
            </Card>
        </Link>
    )
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}
