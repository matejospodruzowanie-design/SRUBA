import { getWeeklyVolume, getWorkoutFrequency, getPRHistory, getMuscleDistribution, getTotalStats, getBodyMeasurements } from "./actions";
import { getUser } from "@/lib/session";
import { ProgressCharts } from "./progress-charts";
import { MeasurementForm } from "@/components/progress/measurement-form";

export default async function ProgressPage() {
  const user = await getUser();
  const [weeklyVolume, workoutFreq, prs, muscleDist, totalStats, bodyMeasurements] =
    await Promise.all([
      getWeeklyVolume(),
      getWorkoutFrequency(),
      getPRHistory(),
      getMuscleDistribution(),
      getTotalStats(),
      getBodyMeasurements(),
    ]);

  return (
    <>
      <ProgressCharts
        weeklyVolume={weeklyVolume}
        workoutFreq={workoutFreq}
        prs={prs}
        muscleDist={muscleDist}
        totalStats={totalStats}
        bodyMeasurements={bodyMeasurements}
        userWeight={user.weightKg}
        userHeight={user.heightCm}
        addMeasurementButton={
          <MeasurementForm currentWeight={user.weightKg} />
        }
      />
    </>
  );
}
