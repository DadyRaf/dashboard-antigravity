import { Search, Globe, Facebook, MessageCircle, Twitter } from "lucide-react"

const PLATFORMS = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { id: 'reddit', name: 'Reddit', icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-600/10' }, // Using MessageCircle as placeholder for Reddit
    { id: 'twitter', name: 'X / Twitter', icon: Twitter, color: 'text-black dark:text-white', bg: 'bg-black/5 dark:bg-white/10' },
    { id: 'general', name: 'General Web', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
]

export function Research() {
    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Research</h1>
                <p className="text-muted-foreground mt-2">
                    Conduct deep-dive scrapers on major platforms for market research.
                </p>
            </div>

            <div className="bg-card border rounded-xl p-8 shadow-sm">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="space-y-4 text-center">
                        <h2 className="text-2xl font-semibold">Start a New Research Task</h2>
                        <p className="text-muted-foreground">Select a platform and enter your search query or URL.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {PLATFORMS.map((platform) => (
                            <button
                                key={platform.id}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-105 ${platform.bg} border-transparent hover:border-primary/50`}
                            >
                                <platform.icon className={`w-8 h-8 ${platform.color}`} />
                                <span className="font-medium text-sm">{platform.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Enter keywords, hashtags, or a specific URL to scrape..."
                            className="w-full pl-10 pr-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        />
                        <button className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
                            Start Research
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-96 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold text-lg mb-4">Previous Research Tasks</h3>
                <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    No research history found.
                </div>
            </div>
        </div>
    )
}
