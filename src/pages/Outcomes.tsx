import { ExternalLink, Calendar, Search } from "lucide-react"

const OUTCOMES = [
    {
        id: 1,
        title: "Latest Competitor Pricing",
        source: "Amazon vs Walmart",
        date: "Today, 10:23 AM",
        type: "Price Analysis",
        image: "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 2,
        title: "Q3 Real Estate Trends",
        source: "Zillow Data",
        date: "Yesterday",
        type: "Market Report",
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 3,
        title: "Tech News Summary",
        source: "Multiple Sources",
        date: "2 days ago",
        type: "Content Aggregation",
        image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
        id: 4,
        title: "Lead Generation List",
        source: "LinkedIn Sales Nav",
        date: "Last Week",
        type: "Contact List",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
]

export function Outcomes() {
    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Outcomes</h1>
                    <p className="text-muted-foreground mt-2">
                        Visual results and findings from your automated tasks.
                    </p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search outcomes..."
                        className="w-full bg-background pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {OUTCOMES.map((outcome, i) => (
                    <div
                        key={outcome.id}
                        className={`group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                    >
                        <div className="aspect-video w-full overflow-hidden bg-muted relative">
                            <img
                                src={outcome.image}
                                alt={outcome.title}
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-colors">
                                    View Full Report <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                    {outcome.type}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {outcome.date}
                                </span>
                            </div>
                            <h3 className={`font-bold tracking-tight mb-1 ${i === 0 ? 'text-2xl' : 'text-lg'}`}>
                                {outcome.title}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Source: {outcome.source}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
