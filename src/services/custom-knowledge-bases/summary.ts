import { fetchKbMetrics } from "./queries"
import type { ServiceSummary } from "../registry"

export async function kbSummary(clientId: string): Promise<ServiceSummary> {
    const metrics = await fetchKbMetrics(clientId, null)
    const delta =
        metrics.queriesPrev24h > 0
            ? ((metrics.queries24h - metrics.queriesPrev24h) / metrics.queriesPrev24h) * 100
            : undefined

    return {
        label: "Queries (24h)",
        value: metrics.queries24h,
        delta,
        hint: metrics.avgLatencyMs ? `${Math.round(metrics.avgLatencyMs)}ms avg` : "No queries yet",
    }
}
