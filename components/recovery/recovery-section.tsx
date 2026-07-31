import { getMuscleRecovery } from "@/lib/recovery";
import { getUser } from "@/lib/session";
import { MuscleHeatmap } from "./muscle-heatmap";

export async function RecoverySection() {
  const user = await getUser();
  const muscles = await getMuscleRecovery(user.id);

  if (muscles.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">
          🫀 Regeneracja mięśni
        </h3>
        <p className="text-xs text-muted-foreground text-center py-4">
          Wykonaj pierwszy trening, aby zobaczyć mapę regeneracji
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-sm font-semibold mb-4">
        🫀 Regeneracja mięśni
      </h3>
      <MuscleHeatmap muscles={muscles} />
    </div>
  );
}
