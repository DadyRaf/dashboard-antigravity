// Resolves which client (tenant) the dashboard should render for.
//
// Resolution order:
//   1. ?client=<slug> query param (dev override; useful when testing locally without editing hosts).
//   2. Subdomain of the current hostname (e.g. acme.dashboard.com -> "acme").
//      The root domain is configurable via VITE_ROOT_DOMAIN.
//   3. VITE_DEFAULT_CLIENT_SLUG (fallback for localhost / apex domain).

const ROOT_DOMAIN = (import.meta.env.VITE_ROOT_DOMAIN as string | undefined) ?? ""
const DEFAULT_SLUG = (import.meta.env.VITE_DEFAULT_CLIENT_SLUG as string | undefined) ?? "demo"

const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin"])

export function resolveClientSlug(): string {
  if (typeof window === "undefined") return DEFAULT_SLUG

  const params = new URLSearchParams(window.location.search)
  const override = params.get("client")?.trim()
  if (override) return override

  const hostname = window.location.hostname
  const subdomain = extractSubdomain(hostname, ROOT_DOMAIN)

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return DEFAULT_SLUG
  }

  return subdomain
}

function extractSubdomain(hostname: string, rootDomain: string): string | null {
  if (!hostname) return null

  // localhost / 127.0.0.1 / IP -> no subdomain.
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null
  }

  if (rootDomain && hostname.endsWith("." + rootDomain)) {
    const prefix = hostname.slice(0, -rootDomain.length - 1)
    return prefix.split(".")[0] || null
  }

  // Heuristic fallback: for `acme.example.com`, take the leftmost label
  // when there are 3+ parts.
  const parts = hostname.split(".")
  if (parts.length >= 3) return parts[0]

  return null
}
