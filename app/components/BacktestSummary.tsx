import type { BacktestApiSuccessResponse } from "@/app/lib/api/backtest/types";
import { formatNumber } from "@/app/lib/shared/number";

type BacktestSummaryProps = {
  result: BacktestApiSuccessResponse;
};

export function BacktestSummary(props: BacktestSummaryProps) {
  const { result } = props;

  return (
    <>
      <p>
        Backtest target date: <strong>{result.date}</strong>
      </p>
      <p className="mt-1">
        Intervals: <strong>{result.count}</strong> (15-minute)
      </p>
      <p className="mt-1 text-gray-700">Model: Weekly Median using 4-Week and 8-Week histories</p>
      <p className="mt-1 text-gray-700">
        Error units: $/MWh. Bias = forecast - actual (positive means over-forecast).
      </p>

      <div className="mt-3 grid gap-2 rounded border bg-gray-50 p-3 md:grid-cols-2">
        <div>
          <p className="font-medium">4-Week Forecast Accuracy</p>
          <p>MAE (avg absolute error): <strong>{formatNumber(result.metrics.mae4w)}</strong></p>
          <p>RMSE (root mean squared error): <strong>{formatNumber(result.metrics.rmse4w)}</strong></p>
          <p>Bias (avg signed error): <strong>{formatNumber(result.metrics.bias4w)}</strong></p>
          <p>Coverage (intervals with actuals): <strong>{result.metrics.coverage4w}</strong> / {result.count}</p>
        </div>
        <div>
          <p className="font-medium">8-Week Forecast Accuracy</p>
          <p>MAE (avg absolute error): <strong>{formatNumber(result.metrics.mae8w)}</strong></p>
          <p>RMSE (root mean squared error): <strong>{formatNumber(result.metrics.rmse8w)}</strong></p>
          <p>Bias (avg signed error): <strong>{formatNumber(result.metrics.bias8w)}</strong></p>
          <p>Coverage (intervals with actuals): <strong>{result.metrics.coverage8w}</strong> / {result.count}</p>
        </div>
      </div>
    </>
  );
}
