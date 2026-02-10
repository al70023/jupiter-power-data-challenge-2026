import { DateTime } from "luxon";

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function parseDateInTimezone(date: string, timezone: string): DateTime | null {
  if (!isISODate(date)) return null;
  const d = DateTime.fromISO(date, { zone: timezone });
  if (!d.isValid) return null;
  return d.startOf("day");
}

export function isDateInSelectableWindow(params: {
  date: DateTime;
  timezone: string;
  maxDaysAhead: number;
}): boolean {
  const { date, timezone, maxDaysAhead } = params;
  const today = DateTime.now().setZone(timezone).startOf("day");
  return date >= today && date <= today.plus({ days: maxDaysAhead });
}

export function getSelectableDateRange(params: { timezone: string; maxDaysAhead: number }) {
  const { timezone, maxDaysAhead } = params;
  const start = DateTime.now().setZone(timezone).startOf("day");
  const end = start.plus({ days: maxDaysAhead });
  return { start, end };
}

export function formatDateInTz(dt: DateTime, timezone: string): string {
  return dt.setZone(timezone).toISODate()!;
}
