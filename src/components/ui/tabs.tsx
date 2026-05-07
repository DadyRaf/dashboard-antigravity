import { createContext, useContext, useState } from "react"
import { cn } from "../../lib/utils"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (v: string) => void
  className?: string
  children: React.ReactNode
}

export function Tabs({ defaultValue, value: controlled, onValueChange, className, children }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const value = controlled ?? internal
  const setValue = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted/50 p-1 self-start",
        className
      )}
      {...props}
    />
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be inside Tabs")
  const active = ctx.value === value

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be inside Tabs")
  if (ctx.value !== value) return null

  return (
    <div role="tabpanel" className={className} {...props}>
      {children}
    </div>
  )
}
