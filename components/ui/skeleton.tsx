/**
 * Reusable skeleton components for loading states.
 * Use these in loading.tsx files for instant navigation feel.
 */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton rounded-xl ${className ?? "h-24"}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({
  width = "100%",
  className,
}: {
  width?: string;
  className?: string;
}) {
  return (
    <div
      className={`skeleton rounded-md ${className ?? "h-4"}`}
      style={{ width }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({
  size = "h-10 w-10",
}: {
  size?: string;
}) {
  return (
    <div
      className={`skeleton rounded-full ${size}`}
      aria-hidden="true"
    />
  );
}

/** Full-page loading skeleton for dashboard-like pages */
export function PageSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonLine width="180px" className="h-6" />
          <SkeletonLine width="120px" className="h-3" />
        </div>
        <SkeletonCircle size="h-10 w-10 sm:h-12 sm:w-12" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} className="h-[72px] sm:h-[84px]" />
        ))}
      </div>

      {/* CTA button */}
      <SkeletonCard className="h-[76px]" />

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <SkeletonCard className="h-[88px]" />
        <SkeletonCard className="h-[88px]" />
      </div>

      {/* Content area */}
      <SkeletonCard className="h-64" />
    </div>
  );
}

/** Loading skeleton for list pages (exercises, history, plans) */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true">
      <div className="space-y-2">
        <SkeletonLine width="200px" className="h-6" />
        <SkeletonLine width="160px" className="h-3" />
      </div>

      {/* Filter/search bar */}
      <SkeletonCard className="h-10" />

      {/* List items */}
      <div className="space-y-2">
        {[...Array(rows)].map((_, i) => (
          <SkeletonCard key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton for detail pages */
export function DetailSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true">
      <SkeletonLine width="100px" className="h-4" />
      <SkeletonLine width="280px" className="h-7" />
      <SkeletonCard className="h-48" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
