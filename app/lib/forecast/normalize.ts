import type { ErcotSppRow } from "@/app/lib/ercot/types";
import type { NormalizedSlotPoint } from "@/app/lib/forecast/types";

function slotIndex(hour: number, interval: number): number {
  return (hour - 1) * 4 + (interval - 1);
}

function tsFromSlot(date: string, slot: number): string {
  const minutes = slot * 15;
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${date} ${hh}:${mm}`;
}

export function to96SlotSeries(date: string, rows: ErcotSppRow[]): NormalizedSlotPoint[] {
  const series: NormalizedSlotPoint[] = Array.from({ length: 96 }, (_, slot) => ({
    slot,
    ts: tsFromSlot(date, slot),
    price: null,
    dst: null,
  }));

  for (const row of rows) {
    if (row.deliveryDate !== date) continue;
    const slot = slotIndex(row.deliveryHour, row.deliveryInterval);
    if (slot < 0 || slot > 95) continue;

    const nextPoint: NormalizedSlotPoint = {
      slot,
      ts: tsFromSlot(date, slot),
      price: row.settlementPointPrice,
      dst: row.DSTFlag,
    };
    const existing = series[slot];

    // On fallback DST days, the repeated hour may create duplicate slot keys.
    // Prefer the standard-time value (DSTFlag=false) when both exist.
    if (existing.price === null) {
      series[slot] = nextPoint;
      continue;
    }
    if (existing.dst === true && nextPoint.dst === false) {
      series[slot] = nextPoint;
    }
  }

  return series;
}
