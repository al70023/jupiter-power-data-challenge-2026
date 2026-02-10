"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";

import type { ForecastApiResponse, ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import type { ComparisonPoint } from "@/app/lib/forecast/types";
import { APP_TIMEZONE } from "@/app/lib/shared/constants";
import { formatDateInTz } from "@/app/lib/shared/date";
import { computeComparisonSummary } from "@/app/lib/forecast/comparison";

function formatNumber(value: number | null): string {
  if (value === null) return "-";
  return value.toFixed(2);
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

type ViewMode = "chart" | "table" | "both";

export default function Home() {
  const today = useMemo(() => DateTime.now().setZone(APP_TIMEZONE).startOf("day"), []);
  const minDate = useMemo(() => formatDateInTz(today, APP_TIMEZONE), [today]);
  const maxDate = useMemo(() => formatDateInTz(today.plus({ days: 6 }), APP_TIMEZONE), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(minDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastApiSuccessResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const summary = useMemo(
    () => (result ? computeComparisonSummary(result.comparison) : null),
    [result]
  );
  const chartModel = useMemo(() => {
    if (!result) return null;
    const values = result.comparison
      .flatMap((row) => [row.value4w, row.value8w])
      .filter((v): v is number => v !== null);
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
        const value = result.comparison[tick.slot]?.value4w ?? null;
        if (value === null) return null;
        return {
          x: tick.x,
          y: valueToY({ value, minY, maxY, yMinPx, yMaxPx }),
        };
      })
      .filter((m): m is { x: number; y: number } => m !== null);
    const markers8w = xTicks
      .map((tick) => {
        const value = result.comparison[tick.slot]?.value8w ?? null;
        if (value === null) return null;
        return {
          x: tick.x,
          y: valueToY({ value, minY, maxY, yMinPx, yMaxPx }),
        };
      })
      .filter((m): m is { x: number; y: number } => m !== null);

    return {
      width,
      height,
      margin,
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
        rows: result.comparison,
        xMin,
        xMax,
        yMinPx,
        yMaxPx,
        minY,
        maxY,
        pick: (row) => row.value4w,
      }),
      points8w: buildSeriesPoints({
        rows: result.comparison,
        xMin,
        xMax,
        yMinPx,
        yMaxPx,
        minY,
        maxY,
        pick: (row) => row.value8w,
      }),
    };
  }, [result]);

  async function fetchForecast(date: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/forecast?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const json = (await res.json()) as ForecastApiResponse;
      if (!json.ok) {
        setError(json.message ?? json.hint ?? json.error ?? "Request failed");
        return;
      }
      if (!res.ok) {
        setError("Request failed");
        return;
      }
      setResult(json);
    } catch {
      setError("Network error while fetching forecast.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">ERCOT HB_WEST 15-Min Price Forecast</h1>

      <section className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Forecast Date (America/Chicago)</span>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <button
          type="button"
          onClick={() => fetchForecast(selectedDate)}
          disabled={loading || !selectedDate}
          className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Loading..." : "Load Forecast"}
        </button>
      </section>

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      {result ? (
        <section className="mt-4 rounded border p-4 text-sm">
          <p>
            Forecast date: <strong>{result.date}</strong>
          </p>
          <p className="mt-1">Intervals: <strong>{result.count}</strong> (15-minute)</p>
          <p className="mt-1 text-gray-700">
            Model: Weekly Median using 4-Week and 8-Week histories
          </p>

          {summary ? (
            <div className="mt-3 grid gap-2 rounded border bg-gray-50 p-3 sm:grid-cols-3">
              <p>
                Avg Delta: <strong>{formatNumber(summary.avgDelta)}</strong>
              </p>
              <p>
                Max |Delta|: <strong>{formatNumber(summary.maxAbsDelta)}</strong>
              </p>
              <p>
                Non-null intervals: <strong>{summary.nonNullCount}</strong> / {result.count}
              </p>
            </div>
          ) : null}

          <div className="mt-4 inline-flex rounded border p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`rounded px-3 py-1 ${viewMode === "chart" ? "bg-black text-white" : "text-gray-700"}`}
            >
              Chart
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded px-3 py-1 ${viewMode === "table" ? "bg-black text-white" : "text-gray-700"}`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={`rounded px-3 py-1 ${viewMode === "both" ? "bg-black text-white" : "text-gray-700"}`}
            >
              Both
            </button>
          </div>

          {(viewMode === "chart" || viewMode === "both") && chartModel ? (
            <div className="mt-4 rounded border p-3">
              <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold">Forecast Curves</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-6 rounded bg-blue-600" />
                  4-Week
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-6 rounded bg-emerald-600" />
                  8-Week
                </span>
                <span className="text-gray-600">
                  Y range: {formatNumber(chartModel.minY)} to {formatNumber(chartModel.maxY)} ($/MWh)
                </span>
              </div>
              <div className="overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartModel.width} ${chartModel.height}`}
                  className="min-w-215 w-full"
                  role="img"
                  aria-label="4-week and 8-week forecast comparison chart"
                >
                  {chartModel.yTicks.map((tick, idx) => (
                    <g key={`y-${idx}`}>
                      <line
                        x1={chartModel.xMin}
                        y1={tick.y}
                        x2={chartModel.xMax}
                        y2={tick.y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <text
                        x={chartModel.xMin - 8}
                        y={tick.y + 3}
                        fontSize="10"
                        textAnchor="end"
                        fill="#4b5563"
                      >
                        {formatNumber(tick.value)}
                      </text>
                    </g>
                  ))}
                  <line
                    x1={chartModel.xMin}
                    y1={chartModel.yMinPx}
                    x2={chartModel.xMin}
                    y2={chartModel.yMaxPx}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <line
                    x1={chartModel.xMin}
                    y1={chartModel.yMaxPx}
                    x2={chartModel.xMax}
                    y2={chartModel.yMaxPx}
                    stroke="#9ca3af"
                    strokeWidth="1"
                  />
                  <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={chartModel.points4w} />
                  <polyline fill="none" stroke="#059669" strokeWidth="2" points={chartModel.points8w} />
                  {chartModel.markers4w.map((m, idx) => (
                    <circle key={`m4-${idx}`} cx={m.x} cy={m.y} r="2.5" fill="#2563eb" />
                  ))}
                  {chartModel.markers8w.map((m, idx) => (
                    <circle key={`m8-${idx}`} cx={m.x} cy={m.y} r="2.5" fill="#059669" />
                  ))}

                  {chartModel.xTicks.map((tick, idx) => (
                    <g key={`x-${idx}`}>
                      <line
                        x1={tick.x}
                        y1={chartModel.yMaxPx}
                        x2={tick.x}
                        y2={chartModel.yMaxPx + 5}
                        stroke="#9ca3af"
                        strokeWidth="1"
                      />
                      <text x={tick.x} y={chartModel.yMaxPx + 18} fontSize="10" textAnchor="middle" fill="#4b5563">
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  <text
                    x={(chartModel.xMin + chartModel.xMax) / 2}
                    y={chartModel.height - 6}
                    fontSize="11"
                    textAnchor="middle"
                    fill="#374151"
                  >
                    Timestamp (America/Chicago)
                  </text>
                  <text
                    x="12"
                    y={(chartModel.yMinPx + chartModel.yMaxPx) / 2}
                    fontSize="11"
                    textAnchor="middle"
                    fill="#374151"
                    transform={`rotate(-90 12 ${(chartModel.yMinPx + chartModel.yMaxPx) / 2})`}
                  >
                    Settlement Point Price ($/MWh)
                  </text>
                </svg>
              </div>
            </div>
          ) : null}

          {viewMode === "table" || viewMode === "both" ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 font-semibold">Timestamp (America/Chicago)</th>
                    <th className="px-2 py-2 font-semibold">4-Week Forecasted Settlement Point Price ($/MWh)</th>
                    <th className="px-2 py-2 font-semibold">8-Week Forecasted Settlement Point Price ($/MWh)</th>
                    <th className="px-2 py-2 font-semibold">Delta (4w - 8w, $/MWh)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row) => (
                    <tr key={row.slot} className="border-b last:border-b-0">
                      <td className="px-2 py-1.5 font-mono">{row.ts}</td>
                      <td className="px-2 py-1.5">{formatNumber(row.value4w)}</td>
                      <td className="px-2 py-1.5">{formatNumber(row.value8w)}</td>
                      <td className="px-2 py-1.5">{formatNumber(row.delta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
