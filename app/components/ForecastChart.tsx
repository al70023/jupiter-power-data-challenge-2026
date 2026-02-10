import { formatNumber } from "@/app/lib/shared/number";
import { ChartModel } from "@/app/components/types";

type ForecastChartProps = {
  chartModel: ChartModel;
};

export function ForecastChart(props: ForecastChartProps) {
  const { chartModel } = props;

  return (
    <div className="mt-4 rounded border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold">Forecast Curves</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded bg-blue-600" />
          4-Week
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-6 rounded bg-emerald-600" />
          8-Week
        </span>
        <span className="text-gray-600">
          Y range: {formatNumber(chartModel.minY)} to {formatNumber(chartModel.maxY)} ($/MWh)
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartModel.width} ${chartModel.height}`}
          className="min-w-215 w-full"
          role="img"
          aria-label="4-week and 8-week forecast comparison chart"
        >
          {chartModel.yTicks.map((tick, idx) => (
            <g key={`y-${idx}`}>
              <line
                x1={chartModel.xMin}
                y1={tick.y}
                x2={chartModel.xMax}
                y2={tick.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={chartModel.xMin - 8}
                y={tick.y + 3}
                fontSize="10"
                textAnchor="end"
                fill="#4b5563"
              >
                {formatNumber(tick.value)}
              </text>
            </g>
          ))}
          <line
            x1={chartModel.xMin}
            y1={chartModel.yMinPx}
            x2={chartModel.xMin}
            y2={chartModel.yMaxPx}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          <line
            x1={chartModel.xMin}
            y1={chartModel.yMaxPx}
            x2={chartModel.xMax}
            y2={chartModel.yMaxPx}
            stroke="#9ca3af"
            strokeWidth="1"
          />
          <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={chartModel.points4w} />
          <polyline fill="none" stroke="#059669" strokeWidth="2" points={chartModel.points8w} />
          {chartModel.markers4w.map((m, idx) => (
            <circle key={`m4-${idx}`} cx={m.x} cy={m.y} r="2.5" fill="#2563eb" />
          ))}
          {chartModel.markers8w.map((m, idx) => (
            <circle key={`m8-${idx}`} cx={m.x} cy={m.y} r="2.5" fill="#059669" />
          ))}

          {chartModel.xTicks.map((tick, idx) => (
            <g key={`x-${idx}`}>
              <line
                x1={tick.x}
                y1={chartModel.yMaxPx}
                x2={tick.x}
                y2={chartModel.yMaxPx + 5}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text x={tick.x} y={chartModel.yMaxPx + 18} fontSize="10" textAnchor="middle" fill="#4b5563">
                {tick.label}
              </text>
            </g>
          ))}

          <text
            x={(chartModel.xMin + chartModel.xMax) / 2}
            y={chartModel.height - 6}
            fontSize="11"
            textAnchor="middle"
            fill="#374151"
          >
            Timestamp (America/Chicago)
          </text>
          <text
            x="12"
            y={(chartModel.yMinPx + chartModel.yMaxPx) / 2}
            fontSize="11"
            textAnchor="middle"
            fill="#374151"
            transform={`rotate(-90 12 ${(chartModel.yMinPx + chartModel.yMaxPx) / 2})`}
          >
            Settlement Point Price ($/MWh)
          </text>
        </svg>
      </div>
    </div>
  );
}
