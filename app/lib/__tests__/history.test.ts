import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchSppRange } from "@/app/lib/ercot/history";
import type { ErcotMeta, ErcotSppRow } from "@/app/lib/ercot/types";

vi.mock("@/app/lib/ercot/client", () => ({
  fetchSppNodeZoneHub: vi.fn(),
}));

import { fetchSppNodeZoneHub } from "@/app/lib/ercot/client";

const fetchSppNodeZoneHubMock = vi.mocked(fetchSppNodeZoneHub);

function makeRow(deliveryDate: string): ErcotSppRow {
  return {
    deliveryDate,
    deliveryHour: 1,
    deliveryInterval: 1,
    settlementPoint: "HB_WEST",
    settlementPointType: "HU",
    settlementPointPrice: 10,
    DSTFlag: false,
  };
}

function makeMeta(overrides: Partial<ErcotMeta>): ErcotMeta {
  return {
    totalRecords: 1,
    currentPage: 1,
    ...overrides,
  };
}

describe("fetchSppRange", () => {
  beforeEach(() => {
    fetchSppNodeZoneHubMock.mockReset();
  });

  it("fetches all pages and concatenates rows", async () => {
    fetchSppNodeZoneHubMock
      .mockResolvedValueOnce({
        rows: [makeRow("2026-01-01")],
        meta: makeMeta({ totalPages: 3, totalRecords: 3, currentPage: 1 }),
      })
      .mockResolvedValueOnce({
        rows: [makeRow("2026-01-02")],
        meta: makeMeta({ totalPages: 3, totalRecords: 3, currentPage: 2 }),
      })
      .mockResolvedValueOnce({
        rows: [makeRow("2026-01-03")],
        meta: makeMeta({ totalPages: 3, totalRecords: 3, currentPage: 3 }),
      });

    const rows = await fetchSppRange({
      deliveryDateFrom: "2026-01-01",
      deliveryDateTo: "2026-01-03",
      settlementPoint: "HB_WEST",
    });

    expect(fetchSppNodeZoneHubMock).toHaveBeenCalledTimes(3);
    expect(fetchSppNodeZoneHubMock).toHaveBeenNthCalledWith(1, {
      deliveryDateFrom: "2026-01-01",
      deliveryDateTo: "2026-01-03",
      settlementPoint: "HB_WEST",
      page: 1,
    });
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.deliveryDate)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("returns first page only when totalPages is missing", async () => {
    fetchSppNodeZoneHubMock.mockResolvedValueOnce({
      rows: [makeRow("2026-01-01")],
      meta: makeMeta({ totalRecords: 1, currentPage: 1 }),
    });

    const rows = await fetchSppRange({
      deliveryDateFrom: "2026-01-01",
      deliveryDateTo: "2026-01-01",
      settlementPoint: "HB_WEST",
    });

    expect(fetchSppNodeZoneHubMock).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(1);
  });
});
