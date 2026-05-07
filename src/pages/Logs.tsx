import { useEffect, useMemo, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, FileText, Filter, RefreshCw } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useClient } from "../context/client-context"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Select } from "../components/ui/select"
import { Input } from "../components/ui/input"
import { StatusDot, STATUS_LABELS } from "../components/ui/status-dot"
import { DataTable, type DataTableColumn } from "../components/ui/data-table"
import { JsonViewer } from "../components/ui/json-viewer"
import { EmptyState } from "../components/ui/empty-state"
import { Skeleton } from "../components/ui/skeleton"
import { DateRangePicker, presetToISO, type DateRangePreset } from "../components/ui/date-range-picker"
import type { Execution, ExecutionStatus, Service } from "../types/db"

const PAGE_SIZE = 50

type Row = Execution & { service_name: string | null }

export function Logs() {
    const { client, services } = useClient()
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [serviceFilter, setServiceFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [rangePreset, setRangePreset] = useState<DateRangePreset>("7d")
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const allServices = useMemo<Service[]>(() => services, [services])

    const fetchRows = useCallback(async () => {
        if (!client) return
        setLoading(true)

        let q = supabase
            .from("executions")
            .select(`*, services(name)`)
            .eq("client_id", client.id)
            .order("started_at", { ascending: false })
            .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

        if (serviceFilter !== "all") {
            q = q.eq("service_id", serviceFilter)
        }
        if (statusFilter !== "all") {
            q = q.eq("status", statusFilter)
        }
        const since = presetToISO(rangePreset)
        if (since) {
            q = q.gte("started_at", since)
        }
        if (search.trim()) {
            q = q.ilike("workflow_name", `%${search.trim()}%`)
        }

        const { data, error } = await q
        setLoading(false)

        if (error) {
            console.error("Failed to load executions", error)
            setRows([])
            setHasMore(false)
            return
        }

        const result = (data ?? []).map((r: any) => ({
            ...r,
            service_name: r.services?.name ?? null,
        })) as Row[]

        setHasMore(result.length > PAGE_SIZE)
        setRows(result.slice(0, PAGE_SIZE))
    }, [client, page, serviceFilter, statusFilter, rangePreset, search])

    useEffect(() => {
        fetchRows()
    }, [fetchRows])

    // Realtime: prepend new rows for this client.
    useEffect(() => {
        if (!client) return
        const channel = supabase
            .channel(`executions:${client.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "executions",
                    filter: `client_id=eq.${client.id}`,
                },
                () => {
                    if (page === 0) fetchRows()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [client, page, fetchRows])

    // Reset to first page when filters change.
    useEffect(() => {
        setPage(0)
    }, [serviceFilter, statusFilter, rangePreset, search])

    const columns: DataTableColumn<Row>[] = [
        {
            key: "time",
            header: "Time",
            render: (r) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.started_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: "service",
            header: "Service",
            render: (r) => r.service_name ? <Badge variant="muted">{r.service_name}</Badge> : <span className="text-xs text-muted-foreground">—</span>,
        },
        {
            key: "workflow",
            header: "Workflow",
            render: (r) => <span className="font-mono text-xs">{r.workflow_name}</span>,
        },
        {
            key: "status",
            header: "Status",
            render: (r) => <StatusDot status={r.status} showLabel />,
        },
        {
            key: "duration",
            header: "Duration",
            align: "right",
            render: (r) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {r.duration_ms != null ? formatDuration(r.duration_ms) : "—"}
                </span>
            ),
        },
    ]

    return (
        <div className="grid gap-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                    <p className="text-muted-foreground mt-2">
                        Every n8n workflow run for {client?.name}, in one place.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRows}>
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            <Card className="p-4 flex flex-wrap items-center gap-3">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-48"
                >
                    <option value="all">All services</option>
                    {allServices.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </Select>
                <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                >
                    <option value="all">All statuses</option>
                    {(Object.keys(STATUS_LABELS) as ExecutionStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                        </option>
                    ))}
                </Select>
                <DateRangePicker value={rangePreset} onChange={setRangePreset} className="w-44" />
                <Input
                    type="search"
                    placeholder="Search workflow name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[180px]"
                />
            </Card>

            {loading && rows.length === 0 ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    rowKey={(r) => r.id}
                    onRowClick={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
                    expandedRowId={expandedId}
                    renderExpanded={(r) => (
                        <div className="space-y-3">
                            {r.error_message ? (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs p-3">
                                    {r.error_message}
                                </div>
                            ) : null}
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payload</div>
                                    <JsonViewer value={r.payload} />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Result</div>
                                    <JsonViewer value={r.result} />
                                </div>
                            </div>
                        </div>
                    )}
                    emptyState={
                        <EmptyState
                            icon={FileText}
                            title="No executions found"
                            description="Trigger a workflow or adjust your filters to see runs here."
                        />
                    }
                />
            )}

            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    Page {page + 1} · {rows.length} row{rows.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasMore}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}m ${s}s`
}
