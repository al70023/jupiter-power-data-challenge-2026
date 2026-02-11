import { formatNumber } from "@/app/lib/shared/number";
import { ComparisonPoint } from "@/app/lib/forecast/types";

type ForecastTableProps = {
  rows: ComparisonPoint[];
};

export function ForecastTable(props: ForecastTableProps) {
  const { rows } = props;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1 font-semibold">Timestamp (America/Chicago)</th>
            <th className="px-2 py-1 font-semibold">4-Week Forecast ($/MWh)</th>
            <th className="px-2 py-1 font-semibold">8-Week Forecast ($/MWh)</th>
            <th className="px-2 py-1 font-semibold">Delta (4-Week - 8-Week, $/MWh)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slot} className="border-b last:border-b-0">
              <td className="px-2 py-1 font-mono">{row.ts}</td>
              <td className="px-2 py-1">{formatNumber(row.value4w)}</td>
              <td className="px-2 py-1">{formatNumber(row.value8w)}</td>
              <td className="px-2 py-1">{formatNumber(row.delta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
