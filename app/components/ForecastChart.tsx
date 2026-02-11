"use client";

import { useMemo, useState } from "react";

import { formatNumber } from "@/app/lib/shared/number";
import type { ChartMarker, ChartModel } from "@/app/components/types";

type ForecastChartProps = {
  chartModel: ChartModel;
  title?: string;
  ariaLabel?: string;
  tooltipExtraLinesForSlot?: (slot: number) => string[];
};

export function ForecastChart(props: ForecastChartProps) {
  const { chartModel, title = "Forecast Curves", ariaLabel, tooltipExtraLinesForSlot } = props;
  const [hovered, setHovered] = useState<{ marker: ChartMarker } | null>(null);
  const majorSlots = useMemo(() => new Set(chartModel.xTicks.map((tick) => tick.slot)), [chartModel.xTicks]);
  const minorTicks = useMemo(() => {
    return Array.from({ length: 96 }, (_, slot) => slot)
      .filter((slot) => !majorSlots.has(slot))
      .map((slot) => ({
        slot,
        x: chartModel.xMin + (chartModel.xMax - chartModel.xMin) * (slot / 95),
      }));
  }, [chartModel.xMin, chartModel.xMax, majorSlots]);
  const valuesBySlot = useMemo(() => {
    const maps = new Map<string, Map<number, number>>();
    for (const series of chartModel.series) {
      const slotMap = new Map<number, number>();
      for (const marker of series.markers) slotMap.set(marker.slot, marker.value);
      maps.set(series.key, slotMap);
    }
    return maps;
  }, [chartModel.series]);

  const tooltip = useMemo(() => {
    if (!hovered) return null;
    const extraCount = tooltipExtraLinesForSlot?.(hovered.marker.slot).length ?? 0;
    const width = 280;
    const height = 32 + chartModel.series.length * 14 + extraCount * 14;
    const rawX = hovered.marker.x + 10;
    const x = Math.min(rawX, chartModel.xMax - width);
    const y = Math.max(chartModel.yMinPx + 4, hovered.marker.y - height - 8);
    return { x, y, width, height };
  }, [hovered, chartModel.xMax, chartModel.yMinPx, chartModel.series.length, tooltipExtraLinesForSlot]);

  return (
    <div className="mt-4 rounded border p-3">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold">{title}</span>
        {chartModel.series.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-1">
            <span className="h-2 w-6 rounded" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
        <span className="text-gray-600">
          Y range: {formatNumber(chartModel.minY)} to {formatNumber(chartModel.maxY)} ($/MWh)
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartModel.width} ${chartModel.height}`}
          className="min-w-215 w-full"
          role="img"
          aria-label={ariaLabel ?? "price comparison chart"}
          onMouseLeave={() => setHovered(null)}
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
          {chartModel.series.map((series) => (
            <g key={series.key}>
              <polyline fill="none" stroke={series.color} strokeWidth="1.5" points={series.points} />
              {series.markers.map((m, idx) => (
                <circle
                  key={`${series.key}-${idx}`}
                  cx={m.x}
                  cy={m.y}
                  r="3"
                  fill={series.color}
                  onMouseEnter={() => setHovered({ marker: m })}
                />
              ))}
            </g>
          ))}

          {hovered ? (
            <line
              x1={hovered.marker.x}
              y1={chartModel.yMinPx}
              x2={hovered.marker.x}
              y2={chartModel.yMaxPx}
              stroke="#9ca3af"
              strokeDasharray="3 3"
            />
          ) : null}

          {hovered && tooltip ? (
            <g>
              <rect
                x={tooltip.x}
                y={tooltip.y}
                width={tooltip.width}
                height={tooltip.height}
                rx="4"
                fill="#111827"
                opacity="0.95"
              />
              <text x={tooltip.x + 8} y={tooltip.y + 15} fontSize="10" fill="#f9fafb">
                {hovered.marker.ts}
              </text>
              {chartModel.series.map((series, idx) => (
                <text key={series.key} x={tooltip.x + 8} y={tooltip.y + 30 + idx * 14} fontSize="10" fill="#f9fafb">
                  {series.label}: {formatNumber(valuesBySlot.get(series.key)?.get(hovered.marker.slot) ?? null)} $/MWh
                </text>
              ))}
              {(tooltipExtraLinesForSlot?.(hovered.marker.slot) ?? []).map((line, idx) => (
                <text
                  key={`extra-${idx}`}
                  x={tooltip.x + 8}
                  y={tooltip.y + 30 + chartModel.series.length * 14 + idx * 14}
                  fontSize="10"
                  fill="#f9fafb"
                >
                  {line}
                </text>
              ))}
            </g>
          ) : null}

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
          {minorTicks.map((tick) => (
            <line
              key={`xm-${tick.slot}`}
              x1={tick.x}
              y1={chartModel.yMaxPx}
              x2={tick.x}
              y2={chartModel.yMaxPx + 3}
              stroke="#d1d5db"
              strokeWidth="1"
            />
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
