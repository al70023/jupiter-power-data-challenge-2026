import { NextResponse } from "next/server";
import { DateTime } from "luxon";

import type { BacktestApiErrorResponse, BacktestApiSuccessResponse } from "@/app/lib/api/backtest/types";
import { fetchSppRange } from "@/app/lib/ercot/history";
import { buildBacktestRows, computeBacktestMetrics } from "@/app/lib/forecast/backtest";
import { weeklyMedianForecast } from "@/app/lib/forecast/model";
import { to96SlotSeries } from "@/app/lib/forecast/normalize";
import {
  APP_TIMEZONE,
  HISTORY_DAYS,
  LOOKBACK_WEEKS_LONG,
  LOOKBACK_WEEKS_SHORT,
  SETTLEMENT_POINT_HB_WEST,
} from "@/app/lib/shared/constants";
import { parseDateInTimezone } from "@/app/lib/shared/date";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const parsedDate = date ? parseDateInTimezone(date, APP_TIMEZONE) : null;

    if (!date || !parsedDate) {
      return NextResponse.json(
        { ok: false, error: "INVALID_DATE", hint: "Use ?date=YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const today = DateTime.now().setZone(APP_TIMEZONE).startOf("day");
    if (parsedDate >= today) {
      return NextResponse.json(
        {
          ok: false,
          error: "DATE_NOT_HISTORICAL",
          hint: `Backtest date must be before ${today.toISODate()}`,
        },
        { status: 400 }
      );
    }

    const histStart = parsedDate.minus({ days: HISTORY_DAYS }).toISODate()!;
    const histEnd = parsedDate.minus({ days: 1 }).toISODate()!;

    const historyRows = await fetchSppRange({
      deliveryDateFrom: histStart,
      deliveryDateTo: histEnd,
      settlementPoint: SETTLEMENT_POINT_HB_WEST,
    });
    const actualRows = await fetchSppRange({
      deliveryDateFrom: date,
      deliveryDateTo: date,
      settlementPoint: SETTLEMENT_POINT_HB_WEST,
    });

    const forecast4w = weeklyMedianForecast({
      targetDate: date,
      historyRows,
      lookbackWeeks: LOOKBACK_WEEKS_SHORT,
      timezone: APP_TIMEZONE,
    });
    const forecast8w = weeklyMedianForecast({
      targetDate: date,
      historyRows,
      lookbackWeeks: LOOKBACK_WEEKS_LONG,
      timezone: APP_TIMEZONE,
    });
    const actualSeries = to96SlotSeries(date, actualRows);
    const rows = buildBacktestRows({ forecast4w, forecast8w, actualSeries });
    const metrics = computeBacktestMetrics(rows);

    const response: BacktestApiSuccessResponse = {
      ok: true,
      date,
      settlementPoint: SETTLEMENT_POINT_HB_WEST,
      timezone: APP_TIMEZONE,
      intervalMinutes: 15,
      count: rows.length,
      model: {
        name: "weekly-median",
        historyDays: HISTORY_DAYS,
        variants: {
          forecast4w: { lookbackWeeks: LOOKBACK_WEEKS_SHORT },
          forecast8w: { lookbackWeeks: LOOKBACK_WEEKS_LONG },
        },
      },
      rows,
      metrics,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/429|rate limit/i.test(message)) {
      const response: BacktestApiErrorResponse = {
        ok: false,
        error: "UPSTREAM_RATE_LIMITED",
        message,
        hint: "ERCOT API rate limit hit. Retry shortly.",
      };
      return NextResponse.json(response, { status: 503 });
    }

    const response: BacktestApiErrorResponse = { ok: false, error: "BACKTEST_FAILED", message };
    return NextResponse.json(response, { status: 500 });
  }
}
