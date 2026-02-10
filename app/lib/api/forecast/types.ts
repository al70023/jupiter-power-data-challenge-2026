import type { ComparisonPoint, ForecastPoint } from "@/app/lib/forecast/types";

export type ForecastModelMetadata = {
  name: string;
  historyDays: number;
  variants: {
    forecast4w: { lookbackWeeks: number };
    forecast8w: { lookbackWeeks: number };
  };
};

export type ForecastApiSuccessResponse = {
  ok: true;
  date: string;
  settlementPoint: string;
  timezone: string;
  model: ForecastModelMetadata;
  intervalMinutes: 15;
  count: number;
  forecast: ForecastPoint[];
  forecast4w: ForecastPoint[];
  forecast8w: ForecastPoint[];
  comparison: ComparisonPoint[];
};

export type ForecastApiErrorResponse = {
  ok: false;
  error: string;
  hint?: string;
  message?: string;
};

export type ForecastApiResponse = ForecastApiSuccessResponse | ForecastApiErrorResponse;
