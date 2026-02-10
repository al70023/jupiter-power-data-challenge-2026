"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";

import type { ForecastApiResponse, ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import { APP_TIMEZONE } from "@/app/lib/shared/constants";
import { formatDateInTz } from "@/app/lib/shared/date";

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
      <h1 className="text-3xl font-semibold">ERCOT 15-Min Forecast</h1>

      <section className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
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
          {loading ? "Loading..." : "Fetch Forecast"}
        </button>
      </section>

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      {result ? (
        <section className="mt-4 rounded border p-4 text-sm">
          <p>
            Loaded forecast for <strong>{result.date}</strong> with <strong>{result.count}</strong> intervals.
          </p>
          <p className="mt-1 text-gray-700">
            Model: {result.model?.name} ({result.model?.variants.forecast4w.lookbackWeeks}w and{" "}
            {result.model?.variants.forecast8w.lookbackWeeks}w)
          </p>
        </section>
      ) : null}
    </main>
  );
}
