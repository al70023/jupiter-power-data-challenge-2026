import type { BacktestAggregateMetrics, BacktestIntervalRow } from "@/app/lib/api/backtest/types";
import type { ForecastPoint, NormalizedSlotPoint } from "@/app/lib/forecast/types";
import { roundTo } from "@/app/lib/shared/number";

export function buildBacktestRows(params: {
  forecast4w: ForecastPoint[];
  forecast8w: ForecastPoint[];
  actualSeries: NormalizedSlotPoint[];
}): BacktestIntervalRow[] {
  const { forecast4w, forecast8w, actualSeries } = params;

  return forecast4w.map((row4, slot) => {
    const row8 = forecast8w[slot];
    const actual = actualSeries[slot]?.price ?? null;
    const forecastValue4w = row4.value;
    const forecastValue8w = row8?.value ?? null;

    return {
      slot: row4.slot,
      ts: row4.ts,
      forecast4w: forecastValue4w,
      forecast8w: forecastValue8w,
      actual,
      err4w:
        typeof forecastValue4w === "number" && typeof actual === "number"
          ? roundTo(forecastValue4w - actual, 2)
          : null,
      err8w:
        typeof forecastValue8w === "number" && typeof actual === "number"
          ? roundTo(forecastValue8w - actual, 2)
          : null,
      absErr4w:
        typeof forecastValue4w === "number" && typeof actual === "number"
          ? roundTo(Math.abs(forecastValue4w - actual), 2)
          : null,
      absErr8w:
        typeof forecastValue8w === "number" && typeof actual === "number"
          ? roundTo(Math.abs(forecastValue8w - actual), 2)
          : null,
    };
  });
}

export function computeBacktestMetrics(rows: BacktestIntervalRow[]): BacktestAggregateMetrics {
  let coverage4w = 0;
  let coverage8w = 0;
  let absErrSum4w = 0;
  let absErrSum8w = 0;
  let sqErrSum4w = 0;
  let sqErrSum8w = 0;
  let errSum4w = 0;
  let errSum8w = 0;

  for (const row of rows) {
    if (typeof row.err4w === "number" && typeof row.absErr4w === "number") {
      coverage4w += 1;
      errSum4w += row.err4w;
      absErrSum4w += row.absErr4w;
      sqErrSum4w += row.err4w ** 2;
    }
    if (typeof row.err8w === "number" && typeof row.absErr8w === "number") {
      coverage8w += 1;
      errSum8w += row.err8w;
      absErrSum8w += row.absErr8w;
      sqErrSum8w += row.err8w ** 2;
    }
  }

  return {
    mae4w: coverage4w > 0 ? roundTo(absErrSum4w / coverage4w, 2) : null,
    mae8w: coverage8w > 0 ? roundTo(absErrSum8w / coverage8w, 2) : null,
    rmse4w: coverage4w > 0 ? roundTo(Math.sqrt(sqErrSum4w / coverage4w), 2) : null,
    rmse8w: coverage8w > 0 ? roundTo(Math.sqrt(sqErrSum8w / coverage8w), 2) : null,
    bias4w: coverage4w > 0 ? roundTo(errSum4w / coverage4w, 2) : null,
    bias8w: coverage8w > 0 ? roundTo(errSum8w / coverage8w, 2) : null,
    coverage4w,
    coverage8w,
  };
}
