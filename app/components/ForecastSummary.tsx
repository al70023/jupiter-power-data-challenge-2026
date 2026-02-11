import type { ForecastApiSuccessResponse } from "@/app/lib/api/forecast/types";
import { computeComparisonSummary } from "@/app/lib/forecast/comparison";
import { formatNumber } from "@/app/lib/shared/number";

type ForecastSummaryProps = {
  result: ForecastApiSuccessResponse;
};

export function ForecastSummary(props: ForecastSummaryProps) {
  const { result } = props;
  const summary = computeComparisonSummary(result.comparison);

  return (
    <>
      <p>
        Forecast target date: <strong>{result.date}</strong>
      </p>
      <p className="mt-1">
        Intervals: <strong>{result.count}</strong> (15-minute)
      </p>
      <p className="mt-1 text-gray-700">Model: Weekly Median using 4-Week and 8-Week histories</p>
      <p className="mt-1 text-gray-700">
        Comparison units: $/MWh. Delta = 4-week forecast - 8-week forecast.
      </p>

      <div className="mt-3 grid gap-2 rounded border bg-gray-50 p-3 sm:grid-cols-3">
        <p>
          Average Delta (4-Week - 8-Week): <strong>{formatNumber(summary.avgDelta)}</strong>
        </p>
        <p>
          Maximum Absolute Delta: <strong>{formatNumber(summary.maxAbsDelta)}</strong>
        </p>
        <p>
          Coverage (intervals with both forecasts): <strong>{summary.nonNullCount}</strong> / {result.count}
        </p>
      </div>
    </>
  );
}
