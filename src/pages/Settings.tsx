import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Building,
    Camera,
    CheckCircle2,
    Lock,
    Mail,
    Palette,
    Save,
    ShieldCheck,
    User,
} from "lucide-react"
import { useUser } from "../context/user-context"
import { useClient } from "../context/client-context"
import { supabase } from "../lib/supabase"
import { applyBrandVars } from "../lib/branding"
import { cn } from "../lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import type { ClientBranding } from "../types/db"

export function Settings() {
    const { profile, user, updateProfile } = useUser()
    const { client } = useClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [localProfile, setLocalProfile] = useState({
        name: "",
        jobTitle: "",
        companyName: "",
        avatarUrl: "" as string | null,
    })
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })

    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (profile) {
            setLocalProfile({
                name: profile.name || "",
                jobTitle: profile.jobTitle || "",
                companyName: profile.companyName || "",
                avatarUrl: profile.avatarUrl || null,
            })
        }
    }, [profile])

    useEffect(() => {
        if (!user) {
            setIsAdmin(false)
            return
        }
        let cancelled = false
        supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (cancelled) return
                setIsAdmin((data as { is_admin?: boolean } | null)?.is_admin === true)
            })
        return () => {
            cancelled = true
        }
    }, [user])

    const handleAvatarClick = () => fileInputRef.current?.click()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = URL.createObjectURL(file)
            setLocalProfile((prev) => ({ ...prev, avatarUrl: imageUrl }))
            setHasChanges(true)
            setSaveSuccess(false)
        }
    }

    const handleChange = (field: keyof typeof localProfile, value: string) => {
        setLocalProfile((prev) => ({ ...prev, [field]: value }))
        setHasChanges(true)
        setSaveSuccess(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        await new Promise((resolve) => setTimeout(resolve, 400))
        await updateProfile(localProfile)
        setIsSaving(false)
        setHasChanges(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
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
                    Manage your profile, security preferences{isAdmin ? ", and brand" : ""}.
                </p>
            </div>

            <Tabs defaultValue="profile" className="gap-6">
                <TabsList>
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Lock className="w-4 h-4" />
                        Security
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="branding">
                            <Palette className="w-4 h-4" />
                            Branding
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-xl p-6 shadow-sm space-y-6"
                    >
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-lg">Profile</h2>
                            </div>
                            {saveSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-emerald-500 text-sm font-medium"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Saved
                                </motion.div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    onClick={handleAvatarClick}
                                    className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors"
                                >
                                    {localProfile.avatarUrl ? (
                                        <img src={localProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <User className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <p className="text-xs text-muted-foreground">Click to change</p>
                            </div>

                            <div className="flex-1 grid gap-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Full Name">
                                        <Input value={localProfile.name} onChange={(e) => handleChange("name", e.target.value)} />
                                    </Field>
                                    <Field label="Job Title">
                                        <Input value={localProfile.jobTitle} onChange={(e) => handleChange("jobTitle", e.target.value)} />
                                    </Field>
                                </div>
                                <Field label={<span className="flex items-center gap-2"><Building className="w-4 h-4 text-muted-foreground" /> Company Name</span>} hint="Displayed in your profile.">
                                    <Input value={localProfile.companyName} onChange={(e) => handleChange("companyName", e.target.value)} />
                                </Field>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                                        {isSaving ? "Updating…" : (<><Save className="w-4 h-4" /> Update profile</>)}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="security">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border rounded-xl p-6 shadow-sm space-y-6"
                    >
                        <div className="flex items-center gap-2 pb-4 border-b">
                            <Lock className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold text-lg">Login</h2>
                        </div>

                        <div className="space-y-6">
                            <Field label={<span className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> Email</span>} hint="Email changes require re-verification.">
                                <Input type="email" value={profile?.email ?? ""} readOnly disabled />
                            </Field>

                            <div className="pt-4 border-t space-y-4">
                                <h3 className="font-medium">Reset password</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="password"
                                        placeholder="New password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                                    />
                                </div>

                                {passwords.new && (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Password strength</span>
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
                                    <Button>
                                        <ShieldCheck className="w-4 h-4" /> Update password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="branding">
                        <BrandingPanel client={client} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}

function Field({
    label,
    hint,
    children,
}: {
    label: React.ReactNode
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
    )
}

interface BrandingPanelProps {
    client: ClientBranding | null
}

function BrandingPanel({ client }: BrandingPanelProps) {
    const [form, setForm] = useState({
        name: client?.name ?? "",
        logo_url: client?.logo_url ?? "",
        favicon_url: client?.favicon_url ?? "",
        brand_primary: client?.brand_primary ?? "",
        brand_primary_foreground: client?.brand_primary_foreground ?? "",
        brand_accent: client?.brand_accent ?? "",
        brand_radius: client?.brand_radius ?? "",
    })
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState<string | null>(null)

    useEffect(() => {
        if (!client) return
        setForm({
            name: client.name,
            logo_url: client.logo_url ?? "",
            favicon_url: client.favicon_url ?? "",
            brand_primary: client.brand_primary,
            brand_primary_foreground: client.brand_primary_foreground,
            brand_accent: client.brand_accent,
            brand_radius: client.brand_radius,
        })
    }, [client])

    const handleSave = async () => {
        if (!client) return
        setSaving(true)
        setFeedback(null)

        const { error } = await supabase
            .from("clients")
            .update({
                name: form.name,
                logo_url: form.logo_url || null,
                favicon_url: form.favicon_url || null,
                brand_primary: form.brand_primary,
                brand_primary_foreground: form.brand_primary_foreground,
                brand_accent: form.brand_accent,
                brand_radius: form.brand_radius,
            })
            .eq("id", client.id)

        setSaving(false)
        if (error) {
            setFeedback(`Could not save: ${error.message}`)
            return
        }

        applyBrandVars({
            ...client,
            ...form,
            logo_url: form.logo_url || null,
            favicon_url: form.favicon_url || null,
        })
        setFeedback("Branding saved. Reload the page for full effect.")
    }

    if (!client) {
        return (
            <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground">
                Loading client…
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-6 shadow-sm space-y-6"
        >
            <div className="flex items-center gap-2 pb-4 border-b">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Branding</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Display name">
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Logo URL" hint="Square image, displayed in the sidebar header.">
                    <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="Favicon URL">
                    <Input value={form.favicon_url} onChange={(e) => setForm({ ...form, favicon_url: e.target.value })} placeholder="https://…" />
                </Field>
                <Field label="Border radius" hint="e.g. 0.5rem">
                    <Input value={form.brand_radius} onChange={(e) => setForm({ ...form, brand_radius: e.target.value })} />
                </Field>
                <Field label="Primary (HSL triplet)" hint="e.g. 247 74% 59%">
                    <Input value={form.brand_primary} onChange={(e) => setForm({ ...form, brand_primary: e.target.value })} />
                </Field>
                <Field label="Primary foreground (HSL triplet)">
                    <Input value={form.brand_primary_foreground} onChange={(e) => setForm({ ...form, brand_primary_foreground: e.target.value })} />
                </Field>
                <Field label="Accent (HSL triplet)">
                    <Input value={form.brand_accent} onChange={(e) => setForm({ ...form, brand_accent: e.target.value })} />
                </Field>
                <Field label="Preview">
                    <div
                        className="h-9 rounded-md flex items-center justify-center text-xs font-medium border border-input"
                        style={{
                            background: `hsl(${form.brand_primary})`,
                            color: `hsl(${form.brand_primary_foreground})`,
                        }}
                    >
                        Primary action
                    </div>
                </Field>
            </div>

            {feedback ? (
                <div className="text-xs text-muted-foreground">{feedback}</div>
            ) : null}

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : (<><Save className="w-4 h-4" /> Save branding</>)}
                </Button>
            </div>
        </motion.div>
    )
}
