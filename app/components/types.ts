export type ViewMode = "chart" | "table" | "both";

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
  markers4w: Array<{ x: number; y: number }>;
  markers8w: Array<{ x: number; y: number }>;
  points4w: string;
  points8w: string;
};