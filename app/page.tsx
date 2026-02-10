"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";

import type { ForecastApiResponse, ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import { APP_TIMEZONE } from "@/app/lib/shared/constants";
import { formatDateInTz } from "@/app/lib/shared/date";
import { 
  computeChartModel,
  ForecastChart,
  ForecastControls, 
  ForecastSummary,
  ForecastTable,
  ForecastViewToggle,
  ViewMode,
} from "@/app/components";

export default function Home() {
  const today = useMemo(() => DateTime.now().setZone(APP_TIMEZONE).startOf("day"), []);
  const minDate = useMemo(() => formatDateInTz(today, APP_TIMEZONE), [today]);
  const maxDate = useMemo(() => formatDateInTz(today.plus({ days: 6 }), APP_TIMEZONE), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(minDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastApiSuccessResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

  const chartModel = useMemo(
    () => (result ? computeChartModel(result.comparison) : null),
    [result]
  );

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

      <ForecastControls
        selectedDate={selectedDate}
        minDate={minDate}
        maxDate={maxDate}
        loading={loading}
        onDateChange={setSelectedDate}
        onLoad={() => fetchForecast(selectedDate)}
      />

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      {result ? (
        <section className="mt-4 rounded border p-4 text-sm">
          <ForecastSummary result={result} />
          <ForecastViewToggle value={viewMode} onChange={setViewMode} />

          {(viewMode === "chart" || viewMode === "both") && chartModel ? (
            <ForecastChart chartModel={chartModel} />
          ) : null}

          {viewMode === "table" || viewMode === "both" ? (
            <ForecastTable rows={result.comparison} />
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
