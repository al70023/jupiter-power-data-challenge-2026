import { formatNumber } from "@/app/lib/shared/number";
import { ComparisonPoint } from "@/app/lib/forecast/types";

type ForecastTableProps = {
  rows: ComparisonPoint[];
};

export function ForecastTable(props: ForecastTableProps) {
  const { rows } = props;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-2 font-semibold">Timestamp (America/Chicago)</th>
            <th className="px-2 py-2 font-semibold">4-Week Forecasted Settlement Point Price ($/MWh)</th>
            <th className="px-2 py-2 font-semibold">8-Week Forecasted Settlement Point Price ($/MWh)</th>
            <th className="px-2 py-2 font-semibold">Delta (4w - 8w, $/MWh)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slot} className="border-b last:border-b-0">
              <td className="px-2 py-1.5 font-mono">{row.ts}</td>
              <td className="px-2 py-1.5">{formatNumber(row.value4w)}</td>
              <td className="px-2 py-1.5">{formatNumber(row.value8w)}</td>
              <td className="px-2 py-1.5">{formatNumber(row.delta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
