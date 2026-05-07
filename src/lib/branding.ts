import type { ClientBranding } from "../types/db"

// Applies a client's brand to the document root via CSS custom properties.
// Inline style on <html> overrides anything in :root / .dark from index.css.
export function applyBrandVars(client: ClientBranding) {
  const root = document.documentElement

  root.style.setProperty("--primary", client.brand_primary)
  root.style.setProperty("--primary-foreground", client.brand_primary_foreground)
  root.style.setProperty("--ring", client.brand_primary)
  root.style.setProperty("--accent", client.brand_accent)
  root.style.setProperty("--radius", client.brand_radius)

  if (client.favicon_url) {
    setFavicon(client.favicon_url)
  }

  document.title = `${client.name} · Dashboard`
}

export function clearBrandVars() {
  const root = document.documentElement
  root.style.removeProperty("--primary")
  root.style.removeProperty("--primary-foreground")
  root.style.removeProperty("--ring")
  root.style.removeProperty("--accent")
  root.style.removeProperty("--radius")
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.href = href
}
