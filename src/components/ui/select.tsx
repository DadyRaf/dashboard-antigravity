import { forwardRef } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative inline-flex w-full">
      <select
        ref={ref}
        className={cn(
          "appearance-none flex h-9 w-full items-center rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    </div>
  )
)
Select.displayName = "Select"
