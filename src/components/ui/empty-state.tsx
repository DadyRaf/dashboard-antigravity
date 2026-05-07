import type { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-12 gap-3", className)}>
      {Icon ? (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="font-semibold text-base">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
