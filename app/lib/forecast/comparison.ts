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

export function computeComparisonSummary(rows: ComparisonPoint[]) {
  let nonNullCount = 0;
  let deltaSum = 0;
  let maxAbsDelta: number | null = null;

  for (const row of rows) {
    if (row.delta === null) continue;
    nonNullCount += 1;
    deltaSum += row.delta;
    const absDelta = Math.abs(row.delta);
    maxAbsDelta = maxAbsDelta === null ? absDelta : Math.max(maxAbsDelta, absDelta);
  }

  return {
    nonNullCount,
    avgDelta: nonNullCount > 0 ? deltaSum / nonNullCount : null,
    maxAbsDelta,
  };
}
