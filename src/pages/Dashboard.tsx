import { Activity, CheckCircle2, FileJson } from "lucide-react"

export function Dashboard() {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Overview of your active scrapers and recent automation findings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-40 rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-muted-foreground">Active Tasks</h3>
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-4xl font-bold">12</div>
                    <div className="text-sm text-green-500 font-medium">+2 running now</div>
                </div>
                <div className="h-40 rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-muted-foreground">Pages Scraped</h3>
                        <FileJson className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-4xl font-bold">1,420</div>
                    <div className="text-sm text-muted-foreground">Today's count</div>
                </div>
                <div className="h-40 rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-muted-foreground">Success Rate</h3>
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-4xl font-bold">98.5%</div>
                    <div className="text-sm text-muted-foreground">Last 24 hours</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                <div className="lg:col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <h3 className="font-semibold text-lg mb-6">Recent Activity Trend</h3>
                    <div className="h-[80%] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        Activity Graph Placeholder
                    </div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
                    <h3 className="font-semibold text-lg mb-4">System Status</h3>
                    <div className="space-y-4 flex-1">
                        {['Database Connection', 'N8N Webhook', 'Proxy Rotator'].map(item => (
                            <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                <span className="text-sm font-medium">{item}</span>
                                <span className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    Operational
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
