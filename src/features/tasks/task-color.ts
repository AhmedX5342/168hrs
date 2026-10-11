import { areaColorOf, tint } from "@/features/life-areas/colors";

export function taskAreaColor(
  areas: { id: string; color: string }[],
  areaId?: string | undefined,
): string {
  return areaColorOf(areas, areaId);
}

export function taskAreaTint(
  areas: { id: string; color: string }[],
  areaId?: string | undefined,
  pct = 18,
): string {
  return tint(taskAreaColor(areas, areaId), pct);
}
