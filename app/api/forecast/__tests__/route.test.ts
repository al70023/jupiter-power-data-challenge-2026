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

function makeForecast(labelBase: number) {
  return Array.from({ length: 96 }, (_, slot) => ({
    slot,
    ts: `2026-02-10 ${String(Math.floor((slot * 15) / 60)).padStart(2, "0")}:${String((slot * 15) % 60).padStart(2, "0")}`,
    value: Math.round((labelBase + slot / 100) * 100) / 100,
  }));
}

function makeHistoryRow(deliveryDate: string): ErcotSppRow {
  return {
    deliveryDate,
    deliveryHour: 1,
    deliveryInterval: 1,
    settlementPoint: "HB_WEST",
    settlementPointType: "HU",
    settlementPointPrice: 25,
    DSTFlag: false,
  };
}

describe("GET /api/forecast", () => {
  beforeEach(() => {
    weeklyMedianForecastMock.mockReset();
    fetchSppRangeMock.mockReset();
  });

  it("returns 400 for invalid date format", async () => {
    const req = new Request("http://localhost:3000/api/forecast?date=2026/02/10");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("INVALID_DATE");
  });

  it("returns 400 for date out of allowed window", async () => {
    const outOfRange = DateTime.now().setZone("America/Chicago").startOf("day").plus({ days: 7 }).toISODate();
    const req = new Request(`http://localhost:3000/api/forecast?date=${outOfRange}`);
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("DATE_OUT_OF_RANGE");
  });

  it("returns dual forecast outputs and comparison rows", async () => {
    const today = DateTime.now().setZone("America/Chicago").startOf("day").toISODate();
    const req = new Request(`http://localhost:3000/api/forecast?date=${today}`);

    fetchSppRangeMock.mockResolvedValue([makeHistoryRow("2026-02-01")]);
    weeklyMedianForecastMock
      .mockReturnValueOnce(makeForecast(40)) // 4w
      .mockReturnValueOnce(makeForecast(35)); // 8w

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.count).toBe(96);
    expect(body.forecast4w).toHaveLength(96);
    expect(body.forecast8w).toHaveLength(96);
    expect(body.comparison).toHaveLength(96);
    expect(body.forecast).toEqual(body.forecast4w);
    expect(body.comparison[0]).toEqual({
      slot: 0,
      ts: body.forecast4w[0].ts,
      value4w: body.forecast4w[0].value,
      value8w: body.forecast8w[0].value,
      delta: 5,
    });
    expect(weeklyMedianForecastMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ lookbackWeeks: 4 })
    );
    expect(weeklyMedianForecastMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ lookbackWeeks: 8 })
    );
  });

  it("maps upstream rate-limit errors to 503", async () => {
    const today = DateTime.now().setZone("America/Chicago").startOf("day").toISODate();
    const req = new Request(`http://localhost:3000/api/forecast?date=${today}`);

    fetchSppRangeMock.mockRejectedValue(new Error("ERCOT data failed: 429 Too Many Requests"));

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("UPSTREAM_RATE_LIMITED");
  });
});
