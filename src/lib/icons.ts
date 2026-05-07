import {
  Activity,
  BookOpen,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  FileJson,
  FileText,
  Headphones,
  LayoutDashboard,
  Mail,
  Megaphone,
  PhoneCall,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  UserCircle,
  UserPlus,
  Video,
  Wrench,
  type LucideIcon,
} from "lucide-react"

// Static map so Vite can tree-shake. New icons must be imported above.
export const iconMap: Record<string, LucideIcon> = {
  Activity,
  BookOpen,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  FileJson,
  FileText,
  Headphones,
  LayoutDashboard,
  Mail,
  Megaphone,
  PhoneCall,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  UserCircle,
  UserPlus,
  Video,
  Wrench,
}

export function getIcon(name: string | null | undefined, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!name) return fallback
  return iconMap[name] ?? fallback
}
