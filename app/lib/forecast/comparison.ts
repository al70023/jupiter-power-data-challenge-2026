import type { ComparisonPoint, ForecastPoint } from "@/app/lib/forecast/types";
import { roundTo } from "@/app/lib/shared/number";

export function buildComparisonRows(
  forecast4w: ForecastPoint[],
  forecast8w: ForecastPoint[]
): ComparisonPoint[] {
  return forecast4w.map((row4, i) => {
    const row8 = forecast8w[i];
    const value4w = row4.value;
    const value8w = row8?.value ?? null;

    return {
      slot: row4.slot,
      ts: row4.ts,
      value4w,
      value8w,
      delta:
        typeof value4w === "number" && typeof value8w === "number"
          ? roundTo(value4w - value8w, 2)
          : null,
    };
  });
}
