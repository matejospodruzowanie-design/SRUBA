import Link from "next/link";
import { getUser } from "@/lib/session";
import { UserMenu } from "./user-menu";
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  BarChart3,
  Activity,
  Swords,
  Bot,
  User,
  Library,
  Download,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exercises", label: "Ćwiczenia", icon: Library },
  { href: "/workout", label: "Trening", icon: Dumbbell },
  { href: "/plans", label: "Plany", icon: Calendar },
  { href: "/history", label: "Historia", icon: BarChart3 },
  { href: "/progress", label: "Progress", icon: Activity },
  { href: "/challenges", label: "Pojedynki", icon: Swords },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/app", label: "Pobierz apkę", icon: Download },
  { href: "/profile", label: "Profil", icon: User },
];

export async function Sidebar() {
  const user = await getUser();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card/50">
      <div className="flex h-14 items-center gap-2 border-b border-border px-6">
        <span className="text-xl font-bold tracking-tight">ŚRUBA</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
