import { lazy, type LazyExoticComponent, type ComponentType } from "react"

export interface ServiceSummary {
  label: string
  value: string | number
  delta?: number
  hint?: string
}

export interface ServiceRegistryEntry {
  Page: LazyExoticComponent<ComponentType>
  summary: (clientId: string) => Promise<ServiceSummary>
}

// Each service that has a fully-wired implementation registers here.
// Unknown slugs fall through to PlaceholderServicePage in the route wrapper.
export const serviceRegistry: Record<string, ServiceRegistryEntry> = {
  "outbound-sales-agents": {
    Page: lazy(() => import("./outbound-sales-agents/Page").then((m) => ({ default: m.OutboundSalesAgentsPage }))),
    summary: async (clientId) => {
      const { outboundSummary } = await import("./outbound-sales-agents/summary")
      return outboundSummary(clientId)
    },
  },
  "custom-knowledge-bases": {
    Page: lazy(() => import("./custom-knowledge-bases/Page").then((m) => ({ default: m.CustomKnowledgeBasesPage }))),
    summary: async (clientId) => {
      const { kbSummary } = await import("./custom-knowledge-bases/summary")
      return kbSummary(clientId)
    },
  },
}

export function getServiceEntry(slug: string): ServiceRegistryEntry | null {
  return serviceRegistry[slug] ?? null
}
