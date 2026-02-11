type ForecastControlsProps = {
  title: string;
  actionLabel: string;
  selectedDate: string;
  minDate?: string;
  maxDate?: string;
  loading: boolean;
  onDateChange: (value: string) => void;
  onLoad: () => void;
};

export function ForecastControls(props: ForecastControlsProps) {
  const { title, actionLabel, selectedDate, minDate, maxDate, loading, onDateChange, onLoad } = props;

  return (
    <section className="mt-6 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <input
          type="date"
          min={minDate}
          max={maxDate}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </label>

      <button
        type="button"
        onClick={onLoad}
        disabled={loading || !selectedDate}
        className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading..." : actionLabel}
      </button>
    </section>
  );
}
