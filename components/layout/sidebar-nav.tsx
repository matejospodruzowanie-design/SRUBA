"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Główna">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-amber-500/10 text-amber-400 font-medium"
                : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-400"
            }`}
          >
            <item.icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
