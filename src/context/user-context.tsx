import { createContext, useContext, useState, useEffect } from "react"

interface UserProfile {
    name: string
    email: string
    companyName: string
    avatarUrl: string | null
    jobTitle: string
}

interface UserContextType {
    profile: UserProfile
    updateProfile: (updates: Partial<UserProfile>) => void
}

// Default mock data
const DEFAULT_PROFILE: UserProfile = {
    name: "Alex Sterling",
    email: "alex@antigravity.dev",
    companyName: "Antigravity Inc.",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
    jobTitle: "Lead Engineer"
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

    // In a real app, this would fetch from Supabase on mount
    useEffect(() => {
        // Mock fetch
        console.log("Fetching user profile...")
    }, [])

    const updateProfile = (updates: Partial<UserProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }))
    }

    return (
        <UserContext.Provider value={{ profile, updateProfile }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider")
    }
    return context
}
