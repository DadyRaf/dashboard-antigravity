import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js"

interface UserProfile {
    name: string | null
    email: string | null
    companyName: string | null
    avatarUrl: string | null
    jobTitle: string | null
}

interface UserContextType {
    user: User | null
    session: Session | null
    profile: UserProfile | null
    isLoading: boolean
    signInWithEmail: (email: string) => Promise<void>
    signInAnonymously: () => Promise<void>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

// Default fallback profile for UI until real profile is loaded
const DEFAULT_PROFILE: UserProfile = {
    name: "User",
    email: "",
    companyName: "Company",
    avatarUrl: null,
    jobTitle: "Member"
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email)
            } else {
                setProfile(null)
                setIsLoading(false)
            }
        })

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email)
            } else {
                setProfile(null)
                setIsLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.log('Error fetching profile, using temporary default', error)
                // If table doesn't exist or no profile yet, use default with email
                setProfile({ ...DEFAULT_PROFILE, email: email || '' })
            } else if (data) {
                setProfile(data)
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const signInWithEmail = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })
        if (error) throw error
    }

    const signInAnonymously = async () => {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
    }

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return

        try {
            // Optimistic update
            setProfile(prev => prev ? { ...prev, ...updates } : null)

            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates })

            if (error) throw error
        } catch (error) {
            console.error('Error updating profile:', error)
            throw error
        }
    }

    return (
        <UserContext.Provider value={{
            user,
            session,
            profile,
            isLoading,
            signInWithEmail,
            signInAnonymously,
            signOut,
            updateProfile
        }}>
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
