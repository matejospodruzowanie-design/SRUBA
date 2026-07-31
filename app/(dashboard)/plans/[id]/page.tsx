import { notFound } from "next/navigation";
import { getRoutine } from "../actions";
import { PlanEditor } from "./plan-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const routine = await getRoutine(id);

  if (!routine) {
    notFound();
  }

  return <PlanEditor routine={routine} />;
}
