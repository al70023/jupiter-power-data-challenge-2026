import { NextResponse } from "next/server";

import { fetchSppRange } from "@/app/lib/ercot/history";
import { buildComparisonRows } from "@/app/lib/forecast/comparison";
import { weeklyMedianForecast } from "@/app/lib/forecast/model";
import {
  APP_TIMEZONE,
  HISTORY_DAYS,
  LOOKBACK_WEEKS_LONG,
  LOOKBACK_WEEKS_SHORT,
  MAX_SELECTABLE_DAYS_AHEAD,
  SETTLEMENT_POINT_HB_WEST,
} from "@/app/lib/shared/constants";
import { getSelectableDateRange, isDateInSelectableWindow, parseDateInTimezone } from "@/app/lib/shared/date";

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
    if (!isDateInSelectableWindow({ date: parsedDate, timezone: APP_TIMEZONE, maxDaysAhead: MAX_SELECTABLE_DAYS_AHEAD })) {
      const { start, end } = getSelectableDateRange({
        timezone: APP_TIMEZONE,
        maxDaysAhead: MAX_SELECTABLE_DAYS_AHEAD,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "DATE_OUT_OF_RANGE",
          hint: `Select a date from ${start.toISODate()} through ${end.toISODate()}`,
        },
        { status: 400 }
      );
    }

    // build history window ending yesterday (or day-1 from target, for strict causality)
    const target = parsedDate;
    const histEnd = target.minus({ days: 1 }).toISODate()!;
    const histStart = target.minus({ days: HISTORY_DAYS }).toISODate()!;

    const historyRows = await fetchSppRange({
      deliveryDateFrom: histStart,
      deliveryDateTo: histEnd,
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
    const comparison = buildComparisonRows(forecast4w, forecast8w);

    return NextResponse.json({
      ok: true,
      date,
      settlementPoint: SETTLEMENT_POINT_HB_WEST,
      timezone: APP_TIMEZONE,
      model: {
        name: "weekly-median",
        variants: {
          forecast4w: { lookbackWeeks: LOOKBACK_WEEKS_SHORT },
          forecast8w: { lookbackWeeks: LOOKBACK_WEEKS_LONG },
        },
        historyDays: HISTORY_DAYS,
      },
      intervalMinutes: 15,
      count: comparison.length,
      forecast: forecast4w,
      forecast4w,
      forecast8w,
      comparison,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/429|rate limit/i.test(message)) {
      return NextResponse.json(
        {
          ok: false,
          error: "UPSTREAM_RATE_LIMITED",
          message,
          hint: "ERCOT API rate limit hit. Retry shortly.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "FORECAST_FAILED", message },
      { status: 500 }
    );
  }
}
