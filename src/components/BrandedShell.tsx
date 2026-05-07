import { AlertTriangle, Loader2 } from "lucide-react"
import { useClient } from "../context/client-context"

export function BrandedShell({ children }: { children: React.ReactNode }) {
  const { client, isLoading, error, slug } = useClient()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Client not found</h1>
          <p className="text-muted-foreground text-sm">
            We couldn't find a dashboard for <span className="font-mono">{slug}</span>.
            {error ? <span className="block mt-2 text-xs">{error}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, contact AA Consulting Services.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
