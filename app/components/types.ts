export type ViewMode = "chart" | "table" | "both";
export type PageMode = "forecast" | "backtest";

export type ChartMarker = {
  slot: number;
  ts: string;
  x: number;
  y: number;
  value: number;
};

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  points: string;
  markers: ChartMarker[];
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
  series: ChartSeries[];
};
