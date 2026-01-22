import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { User, Lock, Building, Camera, Mail, ShieldCheck, Check } from "lucide-react"
import { useUser } from "../context/user-context"
import { cn } from "../lib/utils"

export function Settings() {
    const { profile, updateProfile } = useUser()
    const [isEditing, setIsEditing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Local state for passwords
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            updateProfile({ avatarUrl: imageUrl })
        }
    }

    const getStrengthColor = (pass: string) => {
        if (!pass) return "bg-muted"
        if (pass.length < 6) return "bg-red-500"
        if (pass.length < 10) return "bg-yellow-500"
        return "bg-green-500"
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile, company branding, and security preferences.
                </p>
            </div>

            <div className="grid gap-8">
                {/* Profile & Branding Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-6 shadow-sm space-y-6"
                >
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Profile & Branding</h2>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                onClick={handleAvatarClick}
                                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                            >
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <User className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Click to change</p>
                        </div>

                        {/* Profile Fields */}
                        <div className="flex-1 grid gap-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => updateProfile({ name: e.target.value })}
                                        className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Job Title</label>
                                    <input
                                        type="text"
                                        value={profile.jobTitle}
                                        onChange={(e) => updateProfile({ jobTitle: e.target.value })}
                                        className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={profile.companyName}
                                    onChange={(e) => updateProfile({ companyName: e.target.value })}
                                    className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                                />
                                <p className="text-xs text-muted-foreground">This will be displayed in the sidebar.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border rounded-xl p-6 shadow-sm space-y-6"
                >
                    <div className="flex items-center gap-2 pb-4 border-b">
                        <Lock className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Login Details</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                Email Address
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => updateProfile({ email: e.target.value })}
                                    className="flex-1 p-2 rounded-md border bg-muted/50 text-muted-foreground focus:outline-none cursor-not-allowed"
                                    disabled
                                />
                                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
                                    Change Email
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">Email changes require re-verification.</p>
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <h3 className="font-medium">Reset Password</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                                    className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                                    className="w-full p-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            {passwords.new && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span>Password Strength</span>
                                        <span className="text-muted-foreground">
                                            {passwords.new.length < 6 ? "Weak" : passwords.new.length < 10 ? "Medium" : "Strong"}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn("h-full transition-all duration-300", getStrengthColor(passwords.new))}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (passwords.new.length / 12) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Update Password
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
