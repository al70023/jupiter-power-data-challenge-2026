"use client";

import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";

import type { ForecastApiResponse, ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import type { BacktestApiResponse, BacktestApiSuccessResponse, BacktestIntervalRow } from "@/app/lib/api/backtest/types";
import type { PageMode, ViewMode } from "@/app/components";
import { APP_TIMEZONE } from "@/app/lib/shared/constants";
import { formatDateInTz } from "@/app/lib/shared/date";
import { 
  computeBacktestChartModel,
  BacktestSummary,
  BacktestTable,
  computeChartModel,
  ForecastChart,
  ForecastControls, 
  ForecastSummary,
  ForecastTable,
  ForecastViewToggle,
  PageModeToggle,
} from "@/app/components";

const FORECAST_REQUEST_TIMEOUT_MS = 30_000;

export default function Home() {
  const today = useMemo(() => DateTime.now().setZone(APP_TIMEZONE).startOf("day"), []);
  const forecastMinDate = useMemo(() => formatDateInTz(today, APP_TIMEZONE), [today]);
  const forecastMaxDate = useMemo(() => formatDateInTz(today.plus({ days: 6 }), APP_TIMEZONE), [today]);
  const backtestMaxDate = useMemo(() => formatDateInTz(today.minus({ days: 1 }), APP_TIMEZONE), [today]);
  const backtestMinDate = useMemo(() => formatDateInTz(today.minus({ days: 365 }), APP_TIMEZONE), [today]);

  const [pageMode, setPageMode] = useState<PageMode>("forecast");
  const [selectedDate, setSelectedDate] = useState<string>(forecastMinDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastApiSuccessResponse | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestApiSuccessResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [backtestViewMode, setBacktestViewMode] = useState<ViewMode>("chart");

  const chartModel = useMemo(
    () => (forecastResult ? computeChartModel(forecastResult.comparison) : null),
    [forecastResult]
  );
  const backtestChartModel = useMemo(
    () => (backtestResult ? computeBacktestChartModel(backtestResult.rows) : null),
    [backtestResult]
  );
  const backtestRowBySlot = useMemo(() => {
    const m = new Map<number, BacktestIntervalRow>();
    if (!backtestResult) return m;
    for (const row of backtestResult.rows) m.set(row.slot, row);
    return m;
  }, [backtestResult]);

  useEffect(() => {
    if (pageMode === "forecast") {
      if (selectedDate < forecastMinDate || selectedDate > forecastMaxDate) {
        setSelectedDate(forecastMinDate);
      }
      return;
    }
    if (selectedDate > backtestMaxDate || selectedDate < backtestMinDate) {
      setSelectedDate(backtestMaxDate);
    }
  }, [pageMode, selectedDate, forecastMinDate, forecastMaxDate, backtestMinDate, backtestMaxDate]);

  async function fetchData(date: string) {
    setLoading(true);
    setError(null);
    setForecastResult(null);
    setBacktestResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORECAST_REQUEST_TIMEOUT_MS);

    try {
      const endpoint = pageMode === "forecast" ? "/api/forecast" : "/api/backtest";
      const res = await fetch(`${endpoint}?date=${encodeURIComponent(date)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as ForecastApiResponse | BacktestApiResponse;
      if (!json.ok) {
        setError(json.message ?? json.hint ?? json.error ?? "Request failed");
        return;
      }
      if (!res.ok) {
        setError("Request failed");
        return;
      }
      if (pageMode === "forecast") {
        setForecastResult(json as ForecastApiSuccessResponse);
      } else {
        setBacktestResult(json as BacktestApiSuccessResponse);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please retry in a few seconds.");
      } else {
        setError("Network error while fetching data.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold">ERCOT HB_WEST 15-Min Price Forecast</h1>
      <PageModeToggle value={pageMode} onChange={setPageMode} />

      <ForecastControls
        title={
          pageMode === "forecast"
            ? "Forecast Target Date (America/Chicago)"
            : "Backtest Target Date (America/Chicago)"
        }
        actionLabel={pageMode === "forecast" ? "Run Forecast" : "Run Backtest"}
        selectedDate={selectedDate}
        minDate={pageMode === "forecast" ? forecastMinDate : backtestMinDate}
        maxDate={pageMode === "forecast" ? forecastMaxDate : backtestMaxDate}
        loading={loading}
        onDateChange={setSelectedDate}
        onLoad={() => fetchData(selectedDate)}
      />

      {error ? (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      {pageMode === "forecast" && forecastResult ? (
        <section className="mt-4 rounded border p-4 text-sm">
          <ForecastSummary result={forecastResult} />
          <ForecastViewToggle value={viewMode} onChange={setViewMode} />

          {(viewMode === "chart" || viewMode === "both") && chartModel ? (
            <ForecastChart
              chartModel={chartModel}
              title="Forecast Curves"
              ariaLabel="4-week and 8-week forecast comparison chart"
            />
          ) : null}

          {viewMode === "table" || viewMode === "both" ? (
            <ForecastTable rows={forecastResult.comparison} />
          ) : null}
        </section>
      ) : null}

      {pageMode === "backtest" && backtestResult ? (
        <section className="mt-4 rounded border p-4 text-sm">
          <BacktestSummary result={backtestResult} />
          <ForecastViewToggle value={backtestViewMode} onChange={setBacktestViewMode} />

          {(backtestViewMode === "chart" || backtestViewMode === "both") && backtestChartModel ? (
            <ForecastChart
              chartModel={backtestChartModel}
              title="Backtest Curves"
              ariaLabel="backtest chart showing forecast and actual prices"
              tooltipExtraLinesForSlot={(slot) => {
                const row = backtestRowBySlot.get(slot);
                if (!row) return [];
                return [
                  `Error 4-Weeks: ${row.err4w === null ? "-" : row.err4w.toFixed(2)}`, 
                  `Error 8-Weeks: ${row.err8w === null ? "-" : row.err8w.toFixed(2)}`,
                ];
              }}
            />
          ) : null}

          {backtestViewMode === "table" || backtestViewMode === "both" ? (
            <BacktestTable rows={backtestResult.rows} />
          ) : null}
        </section>
      ) : null}

      {!forecastResult && !backtestResult && !loading && !error ? (
        <section className="mt-4 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {pageMode === "forecast" ? (
            <>Choose a date within the next 7 days and click <strong>Run Forecast</strong> to load the 4-week-median and 8-week-median forecasts.</>
          ) : (
            <>Choose a historical date and click <strong>Run Backtest</strong> to compare forecast values against actual ERCOT prices.</>
          )}
        </section>
      ) : null}
    </main>
  );
}
