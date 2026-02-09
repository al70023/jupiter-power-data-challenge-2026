import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    statusText: init?.statusText,
  });
}

describe("ercot-client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env.ERCOT_SUBSCRIPTION_KEY = "sub-key";
    process.env.ERCOT_USERNAME = "user";
    process.env.ERCOT_PASSWORD = "pass";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete process.env.ERCOT_SUBSCRIPTION_KEY;
    delete process.env.ERCOT_USERNAME;
    delete process.env.ERCOT_PASSWORD;
  });

  it("retries data request on 429 and succeeds", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id_token: "token" })) // token
      .mockResolvedValueOnce(
        new Response('{ "message": "Rate limit is exceeded. Try again in 1 seconds." }', {
          status: 429,
          statusText: "Too Many Requests",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          _meta: { totalRecords: 1, totalPages: 1, currentPage: 1 },
          fields: [
            { name: "deliveryDate" },
            { name: "deliveryHour" },
            { name: "deliveryInterval" },
            { name: "settlementPoint" },
            { name: "settlementPointType" },
            { name: "settlementPointPrice" },
            { name: "DSTFlag" },
          ],
          data: [["2026-02-10", 1, 1, "HB_WEST", "HU", 42.12, false]],
        })
      );

    const { fetchSppNodeZoneHub } = await import("@/app/lib/ercot/client");
    const promise = fetchSppNodeZoneHub({
      deliveryDateFrom: "2026-02-10",
      deliveryDateTo: "2026-02-10",
      settlementPoint: "HB_WEST",
      page: 1,
    });
    await vi.runAllTimersAsync();
    const out = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].settlementPointPrice).toBe(42.12);
  });

  it("throws on non-retryable 400 from data endpoint", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id_token: "token" })) // token
      .mockResolvedValueOnce(new Response("bad request", { status: 400, statusText: "Bad Request" }));

    const { fetchSppNodeZoneHub } = await import("@/app/lib/ercot/client");

    await expect(
      fetchSppNodeZoneHub({
        deliveryDateFrom: "2026-02-10",
        deliveryDateTo: "2026-02-10",
        settlementPoint: "HB_WEST",
        page: 1,
      })
    ).rejects.toThrow(/ERCOT data failed: 400/i);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
