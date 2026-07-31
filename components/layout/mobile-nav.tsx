"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  BarChart3,
  Activity,
  Library,
  Calendar,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/workout", label: "Trening", icon: Dumbbell },
  { href: "/exercises", label: "Ćwicz.", icon: Library },
  { href: "/history", label: "Historia", icon: BarChart3 },
  { href: "/plans", label: "Plany", icon: Calendar },
  { href: "/progress", label: "Progress", icon: Activity },
  { href: "/profile", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-black/95 backdrop-blur-xl safe-bottom">
      <div className="flex items-center justify-around h-[4.25rem] px-0.5 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] py-1.5 rounded-xl transition-all flex-shrink-0 ${
                isActive
                  ? "text-amber-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-amber-400" />
              )}
              <item.icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
