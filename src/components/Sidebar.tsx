import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, Database, Bot, FileText, Settings, ChevronLeft, ChevronRight, Menu, Search } from "lucide-react"
import { cn } from "../lib/utils"
import { Link, useLocation } from "react-router-dom"
import { useUser } from "../context/user-context"

type SidebarProps = {
    className?: string
}

const SIDEBAR_ITEMS = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Database, label: "Web Scrapers", href: "/scrapers" },
    { icon: Bot, label: "Task Automations", href: "/automations" },
    { icon: Search, label: "Research", href: "/research" },
    { icon: FileText, label: "Logs", href: "/logs" },
    { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar({ className }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const location = useLocation()
    const { profile } = useUser()

    const sidebarVariants = {
        expanded: { width: "240px" },
        collapsed: { width: "80px" },
    }

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
            <div className="flex items-center px-6 mb-10 h-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center overflow-hidden border border-border">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-primary-foreground">{profile?.companyName?.charAt(0) || "A"}</span>
                        )}
                    </div>
                    <motion.div
                        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col whitespace-nowrap overflow-hidden"
                    >
                        <span className="font-bold text-sm leading-none">{profile?.companyName || "Antigravity"}</span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">{profile?.name}</span>
                    </motion.div>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {SIDEBAR_ITEMS.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.label}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group relative",
                                isActive
                                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap overflow-hidden font-medium"
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
