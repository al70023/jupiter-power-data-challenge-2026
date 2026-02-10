import type { ComparisonPoint } from "@/app/lib/forecast/types";
import type { ChartModel } from "@/app/components/types";

export function computeChartModel(rows: ComparisonPoint[]): ChartModel | null {
  const values = rows.flatMap((row) => [row.value4w, row.value8w]).filter((v): v is number => v !== null);
  if (values.length === 0) return null;

  const width = 960;
  const height = 360;
  const margin = { top: 12, right: 16, bottom: 42, left: 56 };
  const xMin = margin.left;
  const xMax = width - margin.right;
  const yMinPx = margin.top;
  const yMaxPx = height - margin.bottom;
  const minY = Math.min(...values);
  const maxY = Math.max(...values);

  const yTickCount = 6;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const t = i / yTickCount;
    const value = maxY - (maxY - minY) * t;
    const y = yMinPx + (yMaxPx - yMinPx) * t;
    return { value, y };
  });

  const xTickSlots = [0, 12, 24, 36, 48, 60, 72, 84, 95];
  const xTicks = xTickSlots.map((slot) => {
    const t = slot / 95;
    const x = xMin + (xMax - xMin) * t;
    const hh = String(Math.floor((slot * 15) / 60)).padStart(2, "0");
    const mm = String((slot * 15) % 60).padStart(2, "0");
    return { slot, x, label: `${hh}:${mm}` };
  });

  const markers4w = xTicks
    .map((tick) => {
      const value = rows[tick.slot]?.value4w ?? null;
      if (value === null) return null;
      return { x: tick.x, y: valueToY({ value, minY, maxY, yMinPx, yMaxPx }) };
    })
    .filter((m): m is { x: number; y: number } => m !== null);

  const markers8w = xTicks
    .map((tick) => {
      const value = rows[tick.slot]?.value8w ?? null;
      if (value === null) return null;
      return { x: tick.x, y: valueToY({ value, minY, maxY, yMinPx, yMaxPx }) };
    })
    .filter((m): m is { x: number; y: number } => m !== null);

  return {
    width,
    height,
    xMin,
    xMax,
    yMinPx,
    yMaxPx,
    minY,
    maxY,
    yTicks,
    xTicks,
    markers4w,
    markers8w,
    points4w: buildSeriesPoints({
      rows,
      xMin,
      xMax,
      yMinPx,
      yMaxPx,
      minY,
      maxY,
      pick: (row) => row.value4w,
    }),
    points8w: buildSeriesPoints({
      rows,
      xMin,
      xMax,
      yMinPx,
      yMaxPx,
      minY,
      maxY,
      pick: (row) => row.value8w,
    }),
  };
}

function buildSeriesPoints(params: {
  rows: ComparisonPoint[];
  xMin: number;
  xMax: number;
  yMinPx: number;
  yMaxPx: number;
  minY: number;
  maxY: number;
  pick: (row: ComparisonPoint) => number | null;
}): string {
  const { rows, xMin, xMax, yMinPx, yMaxPx, minY, maxY, pick } = params;
  const denom = Math.max(rows.length - 1, 1);
  const xRange = xMax - xMin;
  const yRangePx = yMaxPx - yMinPx;
  const yRange = Math.max(maxY - minY, 1e-9);

  return rows
    .map((row, i) => {
      const value = pick(row);
      if (value === null) return null;
      const x = xMin + (i / denom) * xRange;
      const y = yMaxPx - ((value - minY) / yRange) * yRangePx;
      return `${x},${y}`;
    })
    .filter((point): point is string => point !== null)
    .join(" ");
}

function valueToY(params: {
  value: number;
  minY: number;
  maxY: number;
  yMinPx: number;
  yMaxPx: number;
}): number {
  const { value, minY, maxY, yMinPx, yMaxPx } = params;
  const yRange = Math.max(maxY - minY, 1e-9);
  const yRangePx = yMaxPx - yMinPx;
  return yMaxPx - ((value - minY) / yRange) * yRangePx;
}
