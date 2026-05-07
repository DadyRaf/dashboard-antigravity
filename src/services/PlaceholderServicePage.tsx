import { Mail } from "lucide-react"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { getIcon } from "../lib/icons"
import type { EnabledService } from "../types/db"

export function PlaceholderServicePage({ service }: { service: EnabledService }) {
  const Icon = getIcon(service.icon)

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="muted">{service.category}</Badge>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          </div>
          {service.description ? (
            <p className="text-muted-foreground max-w-2xl">{service.description}</p>
          ) : null}
        </div>
      </div>

      <Card className="p-12 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Dashboard view coming soon</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            We're still building the metrics view for this service. The underlying automations
            are running in the background — reach out to expand what's tracked here.
          </p>
        </div>
        <a
          href="mailto:aaraf@arminbaniaz.com"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Mail className="w-4 h-4" />
          Contact AA Consulting
        </a>
      </Card>
    </div>
  )
}
