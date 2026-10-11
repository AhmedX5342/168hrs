/** Preset swatches offered when picking a life-area color. */
export const AREA_COLORS = [
  "#2f80ed", // blue
  "#27ae60", // green
  "#9b51e0", // purple
  "#ec4899", // pink
  "#e8590c", // orange
  "#eb5757", // red
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#84cc16", // lime
  "#06b6d4", // cyan
  "#64748b", // slate
] as const;

/** Used for tasks that have no life area. */
export const NO_AREA_COLOR = "#94a3b8";

export const colorAt = (i: number): string => AREA_COLORS[i % AREA_COLORS.length]!;

/** First preset not already used by an existing area. */
export function nextAreaColor(areas: { color?: string | undefined }[]): string {
  const used = new Set(areas.map((a) => a.color?.toLowerCase()));
  return AREA_COLORS.find((c) => !used.has(c)) ?? colorAt(areas.length);
}

export const areaColorOf = (
  areas: { id: string; color: string }[],
  id?: string | undefined,
): string => areas.find((a) => a.id === id)?.color ?? NO_AREA_COLOR;

/** Soft translucent version of a color, for icon tiles and badges. */
export const tint = (color: string, pct = 18) =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;
