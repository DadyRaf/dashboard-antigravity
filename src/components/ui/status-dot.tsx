import { cn } from "../../lib/utils"
import type { ExecutionStatus } from "../../types/db"

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  pending: "bg-muted-foreground/40",
  running: "bg-blue-500 animate-pulse",
  success: "bg-emerald-500",
  error: "bg-destructive",
  cancelled: "bg-amber-500",
}

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: "Pending",
  running: "Running",
  success: "Success",
  error: "Error",
  cancelled: "Cancelled",
}

interface StatusDotProps {
  status: ExecutionStatus
  showLabel?: boolean
  className?: string
}

export function StatusDot({ status, showLabel = false, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_COLORS[status])} />
      {showLabel && <span className="text-xs font-medium">{STATUS_LABELS[status]}</span>}
    </span>
  )
}

export { STATUS_LABELS }
