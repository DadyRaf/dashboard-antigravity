export type ExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "cancelled"

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "meeting_booked"
  | "disqualified"
  | "converted"

export interface Client {
  id: string
  slug: string
  name: string
  logo_url: string | null
  favicon_url: string | null
  brand_primary: string
  brand_primary_foreground: string
  brand_accent: string
  brand_radius: string
  default_theme: "light" | "dark"
  n8n_webhook_base: string | null
  is_active: boolean
  created_at: string
}

// What client_branding view exposes (subset of Client, anon-safe).
export type ClientBranding = Pick<
  Client,
  | "id"
  | "slug"
  | "name"
  | "logo_url"
  | "favicon_url"
  | "brand_primary"
  | "brand_primary_foreground"
  | "brand_accent"
  | "brand_radius"
  | "default_theme"
>

export interface Service {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  icon: string | null
  default_config: Record<string, unknown>
  is_available: boolean
  sort_order: number
}

export interface ClientService {
  id: string
  client_id: string
  service_id: string
  is_enabled: boolean
  config: Record<string, unknown>
  enabled_at: string
}

// Joined shape: client_services row with the service it points to.
export interface EnabledService extends Service {
  client_service_id: string
  config: Record<string, unknown>
}

export interface Execution {
  id: string
  client_id: string
  service_id: string | null
  workflow_name: string
  status: ExecutionStatus
  payload: Record<string, unknown> | null
  result: Record<string, unknown> | null
  error_message: string | null
  triggered_by: string | null
  started_at: string
  finished_at: string | null
  duration_ms: number | null
}

export interface Lead {
  id: string
  client_id: string
  execution_id: string | null
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  title: string | null
  source: string | null
  status: LeadStatus
  score: number | null
  notes: string | null
  enriched: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface KnowledgeQuery {
  id: string
  client_id: string
  kb_namespace: string | null
  query: string
  answer: string | null
  source_chunks: Array<Record<string, unknown>> | null
  latency_ms: number | null
  feedback: -1 | 0 | 1 | null
  user_id: string | null
  created_at: string
}
