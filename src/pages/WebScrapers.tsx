import { Play, Pause, RefreshCw, MoreHorizontal } from "lucide-react"

const SCRAPERS = [
    { id: 1, name: "LinkedIn Profile Scraper", status: "Running", lastRun: "2 mins ago", success: "100%" },
    { id: 2, name: "Amazon Price Monitor", status: "Idle", lastRun: "1 hour ago", success: "98%" },
    { id: 3, name: "News Aggregator", status: "Failed", lastRun: "4 hours ago", success: "0%" },
    { id: 4, name: "Real Estate Listings", status: "Idle", lastRun: "Yesterday", success: "95%" },
]

export function WebScrapers() {
    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Web Scrapers</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage and monitor your active scraping tasks.
                    </p>
                </div>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Run New Scraper
                </button>
            </div>

            <div className="border rounded-xl bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 font-medium text-sm text-muted-foreground">
                    <div className="col-span-4">Scraper Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Last Run</div>
                    <div className="col-span-2">Success Rate</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>
                {SCRAPERS.map((scraper) => (
                    <div key={scraper.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                        <div className="col-span-4 font-medium">{scraper.name}</div>
                        <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                ${scraper.status === 'Running' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    scraper.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                                {scraper.status === 'Running' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                                {scraper.status}
                            </span>
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground">{scraper.lastRun}</div>
                        <div className="col-span-2 text-sm">{scraper.success}</div>
                        <div className="col-span-1 flex justify-end gap-2">
                            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                {scraper.status === 'Running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
