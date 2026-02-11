import { describe, expect, it } from "vitest";

import { computeBacktestMetrics } from "@/app/lib/forecast/backtest";
import type { BacktestIntervalRow } from "@/app/lib/api/backtest/types";

describe("computeBacktestMetrics", () => {
  it("computes mae/rmse/bias/coverage with null-safe filtering", () => {
    const rows: BacktestIntervalRow[] = [
      {
        slot: 0,
        ts: "2026-01-10 00:00",
        forecast4w: 10,
        forecast8w: 13,
        actual: 11,
        err4w: -1,
        err8w: 2,
        absErr4w: 1,
        absErr8w: 2,
      },
      {
        slot: 1,
        ts: "2026-01-10 00:15",
        forecast4w: 12,
        forecast8w: null,
        actual: 11,
        err4w: 1,
        err8w: null,
        absErr4w: 1,
        absErr8w: null,
      },
    ];

    expect(computeBacktestMetrics(rows)).toEqual({
      mae4w: 1,
      mae8w: 2,
      rmse4w: 1,
      rmse8w: 2,
      bias4w: 0,
      bias8w: 2,
      coverage4w: 2,
      coverage8w: 1,
    });
  });

  it("returns null metrics when coverage is zero", () => {
    const rows: BacktestIntervalRow[] = [
      {
        slot: 0,
        ts: "2026-01-10 00:00",
        forecast4w: null,
        forecast8w: null,
        actual: null,
        err4w: null,
        err8w: null,
        absErr4w: null,
        absErr8w: null,
      },
    ];

    expect(computeBacktestMetrics(rows)).toEqual({
      mae4w: null,
      mae8w: null,
      rmse4w: null,
      rmse8w: null,
      bias4w: null,
      bias8w: null,
      coverage4w: 0,
      coverage8w: 0,
    });
  });
});
