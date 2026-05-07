import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, FileText, Settings, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "../lib/utils"
import { Link, useLocation } from "react-router-dom"
import { useClient } from "../context/client-context"
import { getIcon } from "../lib/icons"

type SidebarProps = {
    className?: string
}

interface NavItem {
    icon: LucideIcon
    label: string
    href: string
    type: "static" | "service"
}

export function Sidebar({ className }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const location = useLocation()
    const { client, services } = useClient()

    const items = useMemo<NavItem[]>(() => {
        const serviceItems: NavItem[] = services.map((s) => ({
            icon: getIcon(s.icon),
            label: s.name,
            href: `/services/${s.slug}`,
            type: "service",
        }))

        return [
            { icon: LayoutDashboard, label: "Dashboard", href: "/", type: "static" },
            ...serviceItems,
            { icon: FileText, label: "Logs", href: "/logs", type: "static" },
            { icon: Settings, label: "Settings", href: "/settings", type: "static" },
        ]
    }, [services])

    const sidebarVariants = {
        expanded: { width: "240px" },
        collapsed: { width: "80px" },
    }

    const clientName = client?.name ?? "Dashboard"
    const initial = clientName.charAt(0).toUpperCase()

    return (
        <motion.div
            initial="expanded"
            animate={isCollapsed ? "collapsed" : "expanded"}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
                "h-screen bg-card border-r border-border flex flex-col relative py-6 z-10",
                className
            )}
        >
            <div className="flex items-center px-6 mb-8 h-10">
                <Link to="/settings" className="flex items-center gap-3 overflow-hidden group/profile cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center overflow-hidden border border-border group-hover/profile:border-primary transition-colors">
                        {client?.logo_url ? (
                            <img src={client.logo_url} alt={clientName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-primary-foreground">{initial}</span>
                        )}
                    </div>
                    <motion.div
                        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col whitespace-nowrap overflow-hidden"
                    >
                        <span className="font-bold text-sm leading-none group-hover/profile:text-primary transition-colors">{clientName}</span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">{services.length} active service{services.length === 1 ? "" : "s"}</span>
                    </motion.div>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {items.map((item, index) => {
                    const isActive = location.pathname === item.href
                    const Icon = item.icon
                    const showDivider = index > 0 && items[index - 1].type !== item.type
                    return (
                        <div key={item.href}>
                            {showDivider && !isCollapsed && (
                                <div className="my-3 mx-3 border-t border-border/50" />
                            )}
                            {showDivider && isCollapsed && (
                                <div className="my-2 mx-3 border-t border-border/50" />
                            )}
                            <Link
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors group relative",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="whitespace-nowrap overflow-hidden font-medium text-sm"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md border whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}

                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}
                            </Link>
                        </div>
                    )
                })}
            </nav>

            <div className="px-4 mt-auto">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    )
}
