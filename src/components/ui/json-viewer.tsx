import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface JsonViewerProps {
  value: unknown
  initiallyOpen?: boolean
  className?: string
}

export function JsonViewer({ value, initiallyOpen = true, className }: JsonViewerProps) {
  const [open, setOpen] = useState(initiallyOpen)
  const json = formatJson(value)

  return (
    <div className={cn("rounded-md border border-border bg-muted/30 text-xs font-mono overflow-hidden", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-3 py-1.5 hover:bg-muted/50 transition-colors text-muted-foreground"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span>{open ? "Hide" : "Show"} JSON</span>
      </button>
      {open && (
        <pre className="p-3 pt-0 overflow-auto whitespace-pre-wrap break-all max-h-80 text-foreground/80">
          {json}
        </pre>
      )}
    </div>
  )
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return "—"
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
