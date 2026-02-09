import { describe, expect, it } from "vitest";

import type { ErcotSppRow } from "@/app/lib/ercot/types";
import { to96SlotSeries } from "@/app/lib/forecast/normalize";

function makeRow(overrides: Partial<ErcotSppRow>): ErcotSppRow {
  return {
    deliveryDate: "2025-11-02",
    deliveryHour: 1,
    deliveryInterval: 1,
    settlementPoint: "HB_WEST",
    settlementPointType: "HU",
    settlementPointPrice: 0,
    DSTFlag: false,
    ...overrides,
  };
}

describe("to96SlotSeries", () => {
  it("maps standard intervals to expected slots", () => {
    const rows: ErcotSppRow[] = [
      makeRow({ deliveryHour: 1, deliveryInterval: 1, settlementPointPrice: 10 }),
      makeRow({ deliveryHour: 1, deliveryInterval: 2, settlementPointPrice: 11 }),
      makeRow({ deliveryHour: 24, deliveryInterval: 4, settlementPointPrice: 99 }),
    ];

    const series = to96SlotSeries("2025-11-02", rows);

    expect(series).toHaveLength(96);
    expect(series[0].price).toBe(10);
    expect(series[1].price).toBe(11);
    expect(series[95].price).toBe(99);
    expect(series[2].price).toBeNull();
  });

  it("prefers DSTFlag=false for duplicate hour/interval rows", () => {
    const dstTrue = makeRow({
      deliveryHour: 2,
      deliveryInterval: 1,
      DSTFlag: true,
      settlementPointPrice: 34.14,
    });
    const dstFalse = makeRow({
      deliveryHour: 2,
      deliveryInterval: 1,
      DSTFlag: false,
      settlementPointPrice: 57.75,
    });
    const rowsA: ErcotSppRow[] = [dstTrue, dstFalse];
    const rowsB: ErcotSppRow[] = [dstFalse, dstTrue];

    const slot = (2 - 1) * 4 + (1 - 1); // slot 4
    const seriesA = to96SlotSeries("2025-11-02", rowsA);
    const seriesB = to96SlotSeries("2025-11-02", rowsB);

    expect(seriesA[slot].price).toBe(57.75);
    expect(seriesA[slot].dst).toBe(false);
    expect(seriesB[slot].price).toBe(57.75);
    expect(seriesB[slot].dst).toBe(false);
  });

  it("demonstrates order dependence for duplicate rows with same DSTFlag", () => {
    const a = makeRow({
      deliveryHour: 2,
      deliveryInterval: 1,
      DSTFlag: false,
      settlementPointPrice: 34.14,
    });
    const b = makeRow({
      deliveryHour: 2,
      deliveryInterval: 1,
      DSTFlag: false,
      settlementPointPrice: 57.75,
    });
    const rowsA: ErcotSppRow[] = [a, b];
    const rowsB: ErcotSppRow[] = [b, a];

    const slot = (2 - 1) * 4 + (1 - 1); // slot 4
    const seriesA = to96SlotSeries("2025-11-02", rowsA);
    const seriesB = to96SlotSeries("2025-11-02", rowsB);

    expect(seriesA[slot].dst).toBe(false);
    expect(seriesB[slot].dst).toBe(false);
    expect(seriesA[slot].price).toBe(34.14);
    expect(seriesB[slot].price).toBe(57.75);
    expect(seriesA[slot].price).not.toBe(seriesB[slot].price);
  });
});
