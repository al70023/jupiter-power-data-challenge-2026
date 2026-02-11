export type ViewMode = "chart" | "table" | "both";
export type PageMode = "forecast" | "backtest";

export type ChartMarker = {
  slot: number;
  ts: string;
  x: number;
  y: number;
  value: number;
};

export type ChartModel = {
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMinPx: number;
  yMaxPx: number;
  minY: number;
  maxY: number;
  yTicks: Array<{ value: number; y: number }>;
  xTicks: Array<{ slot: number; x: number; label: string }>;
  markers4w: ChartMarker[];
  markers8w: ChartMarker[];
  points4w: string;
  points8w: string;
};
