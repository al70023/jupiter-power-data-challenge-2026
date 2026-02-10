"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";

import type { ForecastApiResponse, ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import { APP_TIMEZONE } from "@/app/lib/shared/constants";
import { formatDateInTz } from "@/app/lib/shared/date";

function formatNumber(value: number | null): string {
  if (value === null) return "-";
  return value.toFixed(2);
}

export default function Home() {
  const today = useMemo(() => DateTime.now().setZone(APP_TIMEZONE).startOf("day"), []);
  const minDate = useMemo(() => formatDateInTz(today, APP_TIMEZONE), [today]);
  const maxDate = useMemo(() => formatDateInTz(today.plus({ days: 6 }), APP_TIMEZONE), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(minDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastApiSuccessResponse | null>(null);

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
        </section>
      ) : null}
    </main>
  );
}
