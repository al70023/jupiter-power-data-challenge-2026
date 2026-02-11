export type BacktestModelMetadata = {
  name: string;
  historyDays: number;
  variants: {
    forecast4w: { lookbackWeeks: number };
    forecast8w: { lookbackWeeks: number };
  };
};

export type BacktestIntervalRow = {
  slot: number;
  ts: string;
  forecast4w: number | null;
  forecast8w: number | null;
  actual: number | null;
  err4w: number | null;
  err8w: number | null;
  absErr4w: number | null;
  absErr8w: number | null;
};

export type BacktestAggregateMetrics = {
  mae4w: number | null;
  mae8w: number | null;
  rmse4w: number | null;
  rmse8w: number | null;
  bias4w: number | null;
  bias8w: number | null;
  coverage4w: number;
  coverage8w: number;
};

export type BacktestApiSuccessResponse = {
  ok: true;
  date: string;
  settlementPoint: string;
  timezone: string;
  intervalMinutes: 15;
  count: number;
  model: BacktestModelMetadata;
  rows: BacktestIntervalRow[];
  metrics: BacktestAggregateMetrics;
};

export type BacktestApiErrorResponse = {
  ok: false;
  error: string;
  hint?: string;
  message?: string;
};

export type BacktestApiResponse = BacktestApiSuccessResponse | BacktestApiErrorResponse;
