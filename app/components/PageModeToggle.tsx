import type { PageMode } from "@/app/components/types";

type PageModeToggleProps = {
  value: PageMode;
  onChange: (next: PageMode) => void;
};

export function PageModeToggle(props: PageModeToggleProps) {
  const { value, onChange } = props;

  return (
    <section className="mt-4 inline-flex rounded border p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("forecast")}
        className={`rounded px-3 py-1 ${
          value === "forecast" ? "bg-black text-white" : "text-gray-700"
        }`}
      >
        Forward Forecast
      </button>
      <button
        type="button"
        onClick={() => onChange("backtest")}
        className={`rounded px-3 py-1 ${
          value === "backtest" ? "bg-black text-white" : "text-gray-700"
        }`}
      >
        Historical Backtest
      </button>
    </section>
  );
}
