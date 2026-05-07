import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { Card } from "./card"
import { cn } from "../../lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon?: LucideIcon
  hint?: string
  className?: string
}

export function MetricCard({ label, value, delta, deltaLabel, icon: Icon, hint, className }: MetricCardProps) {
  const positive = typeof delta === "number" && delta >= 0
  const showDelta = typeof delta === "number"

  return (
    <Card className={cn("p-6 flex flex-col gap-3 hover:border-primary/50 transition-colors", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : null}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="flex items-center gap-2 text-xs">
        {showDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              positive ? "text-emerald-500" : "text-destructive"
            )}
          >
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta!).toFixed(delta && Math.abs(delta) < 10 ? 1 : 0)}%
          </span>
        ) : null}
        {(deltaLabel || hint) && (
          <span className="text-muted-foreground">{deltaLabel ?? hint}</span>
        )}
      </div>
    </Card>
  )
}
