import { fetchOutboundMetrics } from "./queries"
import type { ServiceSummary } from "../registry"

export async function outboundSummary(clientId: string): Promise<ServiceSummary> {
    const metrics = await fetchOutboundMetrics(clientId)
    const delta =
        metrics.leadsPrev7d > 0
            ? ((metrics.leadsLast7d - metrics.leadsPrev7d) / metrics.leadsPrev7d) * 100
            : undefined

    return {
        label: "Leads (7d)",
        value: metrics.leadsLast7d,
        delta,
        hint: `${metrics.meetingsBooked} meeting${metrics.meetingsBooked === 1 ? "" : "s"} booked`,
    }
}
