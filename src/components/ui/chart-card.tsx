import { ResponsiveContainer } from "recharts"
import { Card } from "./card"
import { cn } from "../../lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  height?: number
  className?: string
}

export function ChartCard({ title, description, action, children, height = 240, className }: ChartCardProps) {
  return (
    <Card className={cn("p-6 flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-none">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// Standard color palette tied to our CSS theme tokens.
// Recharts needs concrete colors at render time, so we read them via CSS var resolution.
export const chartColors = {
  primary: "hsl(var(--primary))",
  primaryAlt: "hsl(var(--ring))",
  muted: "hsl(var(--muted-foreground))",
  success: "hsl(142 71% 45%)",
  warning: "hsl(38 92% 50%)",
  destructive: "hsl(var(--destructive))",
  series: [
    "hsl(var(--primary))",
    "hsl(217 91% 60%)",
    "hsl(142 71% 45%)",
    "hsl(38 92% 50%)",
    "hsl(280 87% 65%)",
    "hsl(0 84% 60%)",
  ],
}
