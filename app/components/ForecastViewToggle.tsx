import type { ViewMode } from "@/app/components/types";

type ForecastViewToggleProps = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ForecastViewToggle(props: ForecastViewToggleProps) {
  const { value, onChange } = props;

  return (
    <div className="mt-4 inline-flex rounded border p-1 text-xs">
      <button
        type="button"
        onClick={() => onChange("chart")}
        className={`rounded px-3 py-1 ${value === "chart" ? "bg-black text-white" : "text-gray-700"}`}
      >
        Chart
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`rounded px-3 py-1 ${value === "table" ? "bg-black text-white" : "text-gray-700"}`}
      >
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange("both")}
        className={`rounded px-3 py-1 ${value === "both" ? "bg-black text-white" : "text-gray-700"}`}
      >
        Both
      </button>
    </div>
  );
}
