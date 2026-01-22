import { Sidebar } from "./Sidebar"
import { ThemeProvider } from "./theme-provider"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "./theme-provider"
import { UserProvider } from "../context/user-context"

function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors border border-input shadow-sm bg-background hover:text-accent-foreground"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

type LayoutProps = {
    children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <UserProvider>
                <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
                    <Sidebar />
                    <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                        <header className="h-16 px-8 flex items-center justify-end border-b border-border/50 shrink-0">
                            <ThemeToggle />
                        </header>
                        <div className="flex-1 overflow-auto p-8">
                            <div className="max-w-7xl mx-auto h-full">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </UserProvider>
        </ThemeProvider>
    )
}
