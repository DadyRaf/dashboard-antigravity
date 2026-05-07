import { Suspense } from "react"
import { Navigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useClient } from "../context/client-context"
import { getServiceEntry } from "../services/registry"
import { PlaceholderServicePage } from "../services/PlaceholderServicePage"

export function ServicePage() {
  const { slug = "" } = useParams<{ slug: string }>()
  const { services } = useClient()

  const enabled = services.find((s) => s.slug === slug)
  if (!enabled) {
    return <Navigate to="/" replace />
  }

  const entry = getServiceEntry(slug)
  if (!entry) {
    return <PlaceholderServicePage service={enabled} />
  }

  const { Page } = entry
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      }
    >
      <Page />
    </Suspense>
  )
}
