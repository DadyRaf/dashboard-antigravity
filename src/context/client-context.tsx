import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { resolveClientSlug } from "../lib/tenant"
import { applyBrandVars } from "../lib/branding"
import type { ClientBranding, EnabledService, Service } from "../types/db"
import { useUser } from "./user-context"

interface ClientContextValue {
  slug: string
  client: ClientBranding | null
  /** n8n webhook base URL for this client, if overridden. Only available once authed. */
  n8nWebhookBase: string | null
  services: EnabledService[]
  isLoading: boolean
  error: string | null
  refetchServices: () => Promise<void>
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const slug = useMemo(() => resolveClientSlug(), [])

  const [client, setClient] = useState<ClientBranding | null>(null)
  const [n8nWebhookBase, setN8nWebhookBase] = useState<string | null>(null)
  const [services, setServices] = useState<EnabledService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load branding (anonymous-safe) on slug change.
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    supabase
      .from("client_branding")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setClient(null)
        } else if (!data) {
          setError(`No client found for slug "${slug}".`)
          setClient(null)
        } else {
          const branding = data as ClientBranding
          setClient(branding)
          applyBrandVars(branding)
        }
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  // Once authenticated, fetch the protected client row to pick up n8n_webhook_base.
  useEffect(() => {
    if (!client || !user) {
      setN8nWebhookBase(null)
      return
    }
    let cancelled = false
    supabase
      .from("clients")
      .select("n8n_webhook_base")
      .eq("id", client.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        const base = (data as { n8n_webhook_base?: string | null } | null)?.n8n_webhook_base ?? null
        setN8nWebhookBase(base)
      })
    return () => {
      cancelled = true
    }
  }, [client, user])

  const fetchServices = useCallback(async () => {
    if (!client || !user) {
      setServices([])
      return
    }

    const { data, error } = await supabase
      .from("client_services")
      .select(
        `
        id,
        is_enabled,
        config,
        services (
          id,
          slug,
          name,
          category,
          description,
          icon,
          default_config,
          is_available,
          sort_order
        )
      `
      )
      .eq("client_id", client.id)
      .eq("is_enabled", true)

    if (error) {
      console.error("Failed to load client services", error)
      setServices([])
      return
    }

    const flattened: EnabledService[] = (data ?? [])
      .map((row: any) => {
        const svc = row.services as Service | null
        if (!svc) return null
        return {
          ...svc,
          client_service_id: row.id as string,
          config: (row.config as Record<string, unknown>) ?? {},
        }
      })
      .filter((s): s is EnabledService => s !== null)
      .sort((a, b) => a.sort_order - b.sort_order)

    setServices(flattened)
  }, [client, user])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const value = useMemo<ClientContextValue>(
    () => ({
      slug,
      client,
      n8nWebhookBase,
      services,
      isLoading,
      error,
      refetchServices: fetchServices,
    }),
    [slug, client, n8nWebhookBase, services, isLoading, error, fetchServices]
  )

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClient() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error("useClient must be used within a ClientProvider")
  return ctx
}
