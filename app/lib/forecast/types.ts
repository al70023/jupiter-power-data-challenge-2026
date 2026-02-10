export type NormalizedSlotPoint = {
  slot: number; // 0..95
  ts: string; // "YYYY-MM-DD HH:mm"
  price: number | null;
  dst: boolean | null;
};

export type ForecastPoint = {
  slot: number;
  ts: string;
  value: number | null;
};

export type ComparisonPoint = {
  slot: number;
  ts: string;
  value4w: number | null;
  value8w: number | null;
  delta: number | null;
};
