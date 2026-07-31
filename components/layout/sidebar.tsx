import { getUser } from "@/lib/session";
import { UserMenu } from "./user-menu";
import { SidebarNav } from "./sidebar-nav";

export async function Sidebar() {
  const user = await getUser();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card/50">
      <div className="flex h-14 items-center gap-2 border-b border-border px-6">
        <span className="text-xl font-bold tracking-tight">ŚRUBA</span>
      </div>

      <SidebarNav />

      <div className="border-t border-border px-3 py-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
