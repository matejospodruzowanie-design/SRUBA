import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PrefetchManager } from "@/components/layout/prefetch-manager";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-zinc-950">
      <PrefetchManager />
      <InstallPrompt />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-28 lg:pb-0 safe-top">
        <div className="mx-auto max-w-3xl lg:max-w-5xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
