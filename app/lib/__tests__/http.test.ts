import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWithRetry } from "@/app/lib/shared/http";

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries retryable transport errors and eventually succeeds", async () => {
    const abortErr = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(abortErr)
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchWithRetry({
      input: "https://example.test",
      init: { method: "GET" },
      label: "test fetch",
      maxRetries: 1,
      baseRetryMs: 10,
      timeoutMs: 100,
    });
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws immediately for non-retryable transport errors", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("DNS resolution failed"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry({
        input: "https://example.test",
        init: { method: "GET" },
        label: "test fetch",
        maxRetries: 3,
        baseRetryMs: 10,
        timeoutMs: 100,
      })
    ).rejects.toThrow(/test fetch failed/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
