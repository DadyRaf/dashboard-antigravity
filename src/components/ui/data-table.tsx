import { Fragment, type ReactNode } from "react"
import { cn } from "../../lib/utils"

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  className?: string
  align?: "left" | "right" | "center"
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  expandedRowId?: string | null
  renderExpanded?: (row: T) => ReactNode
  emptyState?: ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  expandedRowId,
  renderExpanded,
  emptyState,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyState ?? <div className="p-8 text-center text-sm text-muted-foreground">No data</div>}</td>
            </tr>
          ) : (
            data.map((row) => {
              const id = rowKey(row)
              const isExpanded = expandedRowId === id
              return (
                <Fragment key={id}>
                  <tr
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      onRowClick && "cursor-pointer hover:bg-muted/30",
                      isExpanded && "bg-muted/30"
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpanded ? (
                    <tr className="border-b border-border/50 bg-muted/10">
                      <td colSpan={columns.length} className="p-4">
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
