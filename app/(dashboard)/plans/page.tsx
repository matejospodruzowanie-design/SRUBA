import { getUserRoutines, createRoutine, deleteRoutine } from "./actions";
import { PlansContent } from "./plans-content";

export default async function PlansPage() {
  const routines = await getUserRoutines();

  return <PlansContent initialRoutines={routines} />;
}
