import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShoppingCart, Users, Share2, FileText, AlertTriangle,
    Database, Globe, MessageSquare, Mail,
    CheckCircle2, Clock, X, Terminal
} from "lucide-react"
import { cn } from "../lib/utils"

// --- Mock Data ---

type AutomationStatus = "active" | "paused" | "error"

interface Automation {
    id: string
    title: string
    description: string
    category: "Scraping" | "CRM" | "Social Media" | "Email" | "Utility"
    status: AutomationStatus
    icon: any
    stats: {
        successRate: string
        lastRun: string
    }
    flow: {
        source: any
        logic: string
        destination: any
    }
    logs: { id: number; time: string; status: "success" | "error"; message: string }[]
}

const AUTOMATIONS: Automation[] = [
    {
        id: "1",
        title: "E-commerce Scraper",
        description: "Monitors competitor pricing and updates a Google Sheet.",
        category: "Scraping",
        status: "active",
        icon: ShoppingCart,
        stats: { successRate: "99%", lastRun: "2 mins ago" },
        flow: { source: Globe, logic: "Extract Price", destination: Database },
        logs: [
            { id: 1, time: "10:23 AM", status: "success", message: "Parsed 45 items from Amazon" },
            { id: 2, time: "09:15 AM", status: "success", message: "Parsed 42 items from Amazon" },
            { id: 3, time: "08:00 AM", status: "error", message: "Timeout waiting for selector" },
        ]
    },
    {
        id: "2",
        title: "Lead Generation",
        description: "Watches a Webhook, cleans data via AI, and pushes to a CRM.",
        category: "CRM",
        status: "active",
        icon: Users,
        stats: { successRate: "95%", lastRun: "15 mins ago" },
        flow: { source: Globe, logic: "Enrich Data", destination: Users },
        logs: [
            { id: 1, time: "11:00 AM", status: "success", message: "New lead added: John Doe" },
            { id: 2, time: "10:45 AM", status: "success", message: "New lead added: Jane Smith" },
        ]
    },
    {
        id: "3",
        title: "Social Media Auto-Poster",
        description: "Takes new Supabase entries and posts them to X/Twitter and LinkedIn.",
        category: "Social Media",
        status: "paused",
        icon: Share2,
        stats: { successRate: "100%", lastRun: "Yesterday" },
        flow: { source: Database, logic: "Format Post", destination: Share2 },
        logs: [
            { id: 1, time: "Yesterday", status: "success", message: "Posted to Twitter" },
        ]
    },
    {
        id: "4",
        title: "Daily Report Generator",
        description: "Aggregates database stats and sends a summary via Slack/Email.",
        category: "Email",
        status: "active",
        icon: FileText,
        stats: { successRate: "100%", lastRun: "08:00 AM" },
        flow: { source: Database, logic: "Summarize", destination: Mail },
        logs: [
            { id: 1, time: "08:00 AM", status: "success", message: "Report sent to #general" },
        ]
    },
    {
        id: "5",
        title: "Error Monitor",
        description: "Watches other n8n workflows and alerts the team if an automation fails.",
        category: "Utility",
        status: "active",
        icon: AlertTriangle,
        stats: { successRate: "100%", lastRun: "Running..." },
        flow: { source: Terminal, logic: "Watch Events", destination: MessageSquare },
        logs: [
            { id: 1, time: "Now", status: "success", message: "Monitoring active flows..." },
        ]
    },
]

const CATEGORIES = ["All", "Scraping", "CRM", "Social Media", "Email"]

// --- Components ---

function StatusDot({ status }: { status: AutomationStatus }) {
    if (status === "active") {
        return (
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
        )
    }
    return <span className="h-3 w-3 rounded-full bg-muted-foreground/30"></span>
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation()
                onChange()
            }}
            className={cn(
                "w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                checked ? "bg-primary" : "bg-muted"
            )}
        >
            <motion.div
                initial={false}
                animate={{ x: checked ? 20 : 2 }}
                className="w-5 h-5 bg-background rounded-full shadow-sm absolute top-0.5 left-0"
            />
        </button>
    )
}

function SlideOver({ isOpen, onClose, automation }: { isOpen: boolean; onClose: () => void; automation: Automation | null }) {
    return (
        <AnimatePresence>
            {isOpen && automation && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l z-50 shadow-xl p-6 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Execution Logs</h2>
                            <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <automation.icon className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{automation.title}</h3>
                                <p className="text-sm text-muted-foreground">{automation.category}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {automation.logs.map((log) => (
                                <div key={log.id} className="p-4 rounded-lg bg-muted/30 border flex gap-3 text-sm">
                                    <div className={cn("mt-0.5", log.status === "success" ? "text-emerald-500" : "text-red-500")}>
                                        {log.status === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">{log.status.toUpperCase()}</span>
                                            <span className="text-muted-foreground text-xs">{log.time}</span>
                                        </div>
                                        <p className="text-muted-foreground">{log.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export function TaskAutomations() {
    const [filter, setFilter] = useState("All")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [automations, setAutomations] = useState(AUTOMATIONS)

    const filteredAutomations = automations.filter(a => filter === "All" || a.category === filter)
    const selectedAutomation = automations.find(a => a.id === selectedId) || null

    const toggleStatus = (id: string) => {
        setAutomations(prev => prev.map(a => {
            if (a.id === id) {
                return { ...a, status: a.status === "active" ? "paused" : "active" }
            }
            return a
        }))
    }

    return (
        <div className="grid gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Task Automations</h1>
                    <p className="text-muted-foreground mt-2">
                        Command center for your autonomous agents and workflows.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                filter === cat
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <AnimatePresence>
                    {filteredAutomations.map((automation) => (
                        <motion.div
                            key={automation.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedId(automation.id)}
                            className="group relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            {/* Glassmorphism gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
                                        <automation.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusDot status={automation.status} />
                                        <ToggleSwitch
                                            checked={automation.status === "active"}
                                            onChange={() => toggleStatus(automation.id)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg">{automation.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {automation.description}
                                    </p>
                                </div>

                                {/* Node Map Visual */}
                                <div className="flex items-center justify-between py-4 border-t border-b border-border/50 relative">
                                    {/* Connecting Line */}
                                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-border -z-10" />

                                    <div className="bg-card px-2 flex flex-col items-center gap-1 z-0">
                                        <automation.flow.source className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Source</span>
                                    </div>
                                    <div className="bg-card px-2 flex flex-col items-center gap-1 z-0">
                                        <div className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-medium border">
                                            {automation.flow.logic}
                                        </div>
                                    </div>
                                    <div className="bg-card px-2 flex flex-col items-center gap-1 z-0">
                                        <automation.flow.destination className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dest</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        {automation.stats.successRate} Success
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {automation.stats.lastRun}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <SlideOver
                isOpen={!!selectedId}
                onClose={() => setSelectedId(null)}
                automation={selectedAutomation}
            />
        </div>
    )
}
