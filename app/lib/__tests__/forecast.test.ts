import { describe, expect, it } from "vitest";

import type { ErcotSppRow } from "@/app/lib/ercot/types";
import { weeklyMedianForecast } from "@/app/lib/forecast/model";

function row(date: string, hour: number, interval: number, price: number): ErcotSppRow {
  return {
    deliveryDate: date,
    deliveryHour: hour,
    deliveryInterval: interval,
    settlementPoint: "HB_WEST",
    settlementPointType: "HU",
    settlementPointPrice: price,
    DSTFlag: false,
  };
}

describe("weeklyMedianForecast", () => {
  it("returns 96 points and rounds medians to 2 decimals", () => {
    const historyRows: ErcotSppRow[] = [
      row("2026-02-03", 1, 1, 10.111),
      row("2026-01-27", 1, 1, 20.119),
      row("2026-02-03", 1, 2, 30.001),
      row("2026-01-27", 1, 2, 30.009),
    ];

    const out = weeklyMedianForecast({
      targetDate: "2026-02-10",
      historyRows,
      lookbackWeeks: 2,
      timezone: "America/Chicago",
    });

    expect(out).toHaveLength(96);
    expect(out[0]).toEqual({ slot: 0, ts: "2026-02-10 00:00", value: 15.12 });
    expect(out[1]).toEqual({ slot: 1, ts: "2026-02-10 00:15", value: 30.01 });
    expect(out[2].value).toBeNull();
  });

  it("respects lookbackWeeks window", () => {
    const historyRows: ErcotSppRow[] = [
      row("2026-02-03", 1, 1, 10),
      row("2026-01-27", 1, 1, 50),
    ];

    const out1 = weeklyMedianForecast({
      targetDate: "2026-02-10",
      historyRows,
      lookbackWeeks: 1,
      timezone: "America/Chicago",
    });
    const out2 = weeklyMedianForecast({
      targetDate: "2026-02-10",
      historyRows,
      lookbackWeeks: 2,
      timezone: "America/Chicago",
    });

    expect(out1[0].value).toBe(10);
    expect(out2[0].value).toBe(30);
  });
});
