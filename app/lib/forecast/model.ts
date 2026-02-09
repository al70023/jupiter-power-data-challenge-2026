import { DateTime } from "luxon";

import type { ErcotSppRow } from "@/app/lib/ercot/types";
import { to96SlotSeries } from "@/app/lib/forecast/normalize";
import type { ForecastPoint } from "@/app/lib/forecast/types";
import { median, roundTo } from "@/app/lib/shared/number";

export function weeklyMedianForecast(params: {
  targetDate: string; // YYYY-MM-DD
  historyRows: ErcotSppRow[];
  lookbackWeeks: number;
  timezone: string;
}): ForecastPoint[] {
  const { targetDate, historyRows, lookbackWeeks, timezone } = params;

  const target = DateTime.fromISO(targetDate, { zone: timezone });
  const targetWeekday = target.weekday; // 1=Mon..7=Sun

  const rowsByDate = new Map<string, ErcotSppRow[]>();
  for (const row of historyRows) {
    if (!rowsByDate.has(row.deliveryDate)) rowsByDate.set(row.deliveryDate, []);
    rowsByDate.get(row.deliveryDate)!.push(row);
  }

  const candidateDates: string[] = [];
  for (let week = 1; week <= lookbackWeeks; week++) {
    const date = target.minus({ weeks: week });
    if (date.weekday === targetWeekday) candidateDates.push(date.toISODate()!);
  }

  const slotBuckets: number[][] = Array.from({ length: 96 }, () => []);
  for (const date of candidateDates) {
    const dayRows = rowsByDate.get(date);
    if (!dayRows) continue;

    const series = to96SlotSeries(date, dayRows);
    for (let slot = 0; slot < 96; slot++) {
      const price = series[slot].price;
      if (typeof price === "number" && Number.isFinite(price)) slotBuckets[slot].push(price);
    }
  }

  return Array.from({ length: 96 }, (_, slot) => {
    const minutes = slot * 15;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    const m = median(slotBuckets[slot]);
    return {
      slot,
      ts: `${targetDate} ${hh}:${mm}`,
      value: m === null ? null : roundTo(m, 2),
    };
  });
}
