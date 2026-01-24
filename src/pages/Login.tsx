import { useState } from "react"
import { useUser } from "../context/user-context"
import { Navigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, CheckCircle } from "lucide-react"

export function Login() {
    const { user, signInWithEmail, signInAnonymously, isLoading } = useUser()
    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSent, setIsSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (user) {
        return <Navigate to="/" replace />
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsSubmitting(true)
        setError(null)
        try {
            await signInWithEmail(email)
            setIsSent(true)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Failed to sign in")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return null

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100 dark:border-zinc-700">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Antigravity
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {isSent ? (
                        <div className="text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle className="w-8 h-8" />
                            </motion.div>
                            <div>
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Check your email</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                                    We sent a magic link to <br />
                                    <span className="font-medium text-zinc-900 dark:text-white">{email}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSent(false)}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-4"
                            >
                                Try a different email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all outline-none"
                                        placeholder="you@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 dark:text-red-400 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center py-2.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Sending magic link..." : "Sign in with Magic Link"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-700 text-center">
                        <button
                            onClick={async () => {
                                try {
                                    await signInAnonymously()
                                } catch (err) {
                                    setError(err instanceof Error ? err.message : "Failed to sign in anonymously")
                                }
                            }}
                            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        >
                            Continue as Guest (Skip for now)
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
