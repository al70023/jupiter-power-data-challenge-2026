import type { BacktestIntervalRow } from "@/app/lib/api/backtest/types";
import { formatNumber } from "@/app/lib/shared/number";

type BacktestTableProps = {
  rows: BacktestIntervalRow[];
};

export function BacktestTable(props: BacktestTableProps) {
  const { rows } = props;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="px-2 py-1">
              Timestamp
              <span className="block">(America/Chicago)</span>
            </th>
            <th className="px-2 py-1">
              4-Week Forecast
              <span className="block">($/MWh)</span>
            </th>
            <th className="px-2 py-1">
              8-Week Forecast
              <span className="block">($/MWh)</span>
            </th>
            <th className="px-2 py-1">
              Actual ERCOT Price
              <span className="block">($/MWh)</span>
            </th>
            <th className="px-2 py-1">
              Signed Error, 4-Week
              <span className="block">(Forecast - Actual, $/MWh)</span>
            </th>
            <th className="px-2 py-1">
              Signed Error, 8-Week
              <span className="block">(Forecast - Actual, $/MWh)</span>
            </th>
            <th className="px-2 py-1">
              Absolute Error, 4-Week
              <span className="block">($/MWh)</span>
            </th>
            <th className="px-2 py-1">
              Absolute Error, 8-Week
              <span className="block">($/MWh)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slot} className="border-b">
              <td className="px-2 py-1 font-mono">{row.ts}</td>
              <td className="px-2 py-1">{formatNumber(row.forecast4w)}</td>
              <td className="px-2 py-1">{formatNumber(row.forecast8w)}</td>
              <td className="px-2 py-1">{formatNumber(row.actual)}</td>
              <td className="px-2 py-1">{formatNumber(row.err4w)}</td>
              <td className="px-2 py-1">{formatNumber(row.err8w)}</td>
              <td className="px-2 py-1">{formatNumber(row.absErr4w)}</td>
              <td className="px-2 py-1">{formatNumber(row.absErr8w)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
