import { DateTime } from "luxon";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/ercot/history", () => ({
  fetchSppRange: vi.fn(),
}));

vi.mock("@/app/lib/forecast/model", () => ({
  weeklyMedianForecast: vi.fn(),
}));

import { GET } from "../route";
import { weeklyMedianForecast } from "@/app/lib/forecast/model";
import { fetchSppRange } from "@/app/lib/ercot/history";
import type { ErcotSppRow } from "@/app/lib/ercot/types";

const weeklyMedianForecastMock = vi.mocked(weeklyMedianForecast);
const fetchSppRangeMock = vi.mocked(fetchSppRange);

function makeForecast(base: number, date: string) {
  return Array.from({ length: 96 }, (_, slot) => ({
    slot,
    ts: `${date} ${String(Math.floor((slot * 15) / 60)).padStart(2, "0")}:${String((slot * 15) % 60).padStart(2, "0")}`,
    value: Math.round((base + slot / 100) * 100) / 100,
  }));
}

function makeHistoryRow(params: {
  deliveryDate: string;
  deliveryHour: number;
  deliveryInterval: number;
  price: number;
}): ErcotSppRow {
  return {
    deliveryDate: params.deliveryDate,
    deliveryHour: params.deliveryHour,
    deliveryInterval: params.deliveryInterval,
    settlementPoint: "HB_WEST",
    settlementPointType: "HU",
    settlementPointPrice: params.price,
    DSTFlag: false,
  };
}

describe("GET /api/backtest", () => {
  beforeEach(() => {
    weeklyMedianForecastMock.mockReset();
    fetchSppRangeMock.mockReset();
  });

  it("returns 400 for invalid date", async () => {
    const req = new Request("http://localhost:3000/api/backtest?date=2026/02/10");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("INVALID_DATE");
  });

  it("returns 400 for non-historical date", async () => {
    const today = DateTime.now().setZone("America/Chicago").startOf("day").toISODate();
    const req = new Request(`http://localhost:3000/api/backtest?date=${today}`);
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("DATE_NOT_HISTORICAL");
  });

  it("returns interval rows with forecast and actual error columns", async () => {
    const date = DateTime.now().setZone("America/Chicago").startOf("day").minus({ days: 1 }).toISODate()!;
    const req = new Request(`http://localhost:3000/api/backtest?date=${date}`);

    const historyRows = [makeHistoryRow({ deliveryDate: "2026-02-01", deliveryHour: 1, deliveryInterval: 1, price: 10 })];
    const actualRows = [makeHistoryRow({ deliveryDate: date, deliveryHour: 1, deliveryInterval: 1, price: 39.1 })];

    fetchSppRangeMock
      .mockResolvedValueOnce(historyRows)
      .mockResolvedValueOnce(actualRows);

    weeklyMedianForecastMock
      .mockReturnValueOnce(makeForecast(40, date))
      .mockReturnValueOnce(makeForecast(35, date));

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.rows).toHaveLength(96);
    expect(body.rows[0]).toEqual({
      slot: 0,
      ts: `${date} 00:00`,
      forecast4w: 40,
      forecast8w: 35,
      actual: 39.1,
      err4w: 0.9,
      err8w: -4.1,
      absErr4w: 0.9,
      absErr8w: 4.1,
    });
    expect(body.metrics).toEqual({
      mae4w: 0.9,
      mae8w: 4.1,
      rmse4w: 0.9,
      rmse8w: 4.1,
      bias4w: 0.9,
      bias8w: -4.1,
      coverage4w: 1,
      coverage8w: 1,
    });
  });

  it("fetches causal history window ending day before target", async () => {
    const date = DateTime.now().setZone("America/Chicago").startOf("day").minus({ days: 1 });
    const dateIso = date.toISODate()!;
    const req = new Request(`http://localhost:3000/api/backtest?date=${dateIso}`);

    fetchSppRangeMock.mockResolvedValue([]);
    weeklyMedianForecastMock
      .mockReturnValueOnce(makeForecast(40, dateIso))
      .mockReturnValueOnce(makeForecast(35, dateIso));

    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(fetchSppRangeMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        deliveryDateFrom: date.minus({ days: 56 }).toISODate(),
        deliveryDateTo: date.minus({ days: 1 }).toISODate(),
      })
    );
    expect(fetchSppRangeMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        deliveryDateFrom: dateIso,
        deliveryDateTo: dateIso,
      })
    );
  });

  it("maps upstream rate-limit errors to 503", async () => {
    const date = DateTime.now().setZone("America/Chicago").startOf("day").minus({ days: 1 }).toISODate()!;
    const req = new Request(`http://localhost:3000/api/backtest?date=${date}`);

    fetchSppRangeMock.mockRejectedValue(new Error("ERCOT data failed: 429 Too Many Requests"));

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("UPSTREAM_RATE_LIMITED");
  });
});
