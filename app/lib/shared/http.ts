export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryAfterMs(res: Response, bodyText: string): number | null {
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }

  const match = bodyText.match(/try again in\s+(\d+)\s+seconds?/i);
  if (match) {
    const seconds = Number(match[1]);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }

  return null;
}

export async function fetchWithRetry(params: {
  input: string;
  init: RequestInit;
  label: string;
  maxRetries: number;
  baseRetryMs: number;
  timeoutMs?: number;
}): Promise<Response> {
  const { input, init, label, maxRetries, baseRetryMs, timeoutMs = 15_000 } = params;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout({ input, init, timeoutMs });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const retryable = isRetryableTransportError(err);
      if (!retryable || attempt === maxRetries) {
        throw new Error(`${label} failed: ${message}`);
      }

      const expBackoff = baseRetryMs * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 150);
      await sleep(expBackoff + jitter);
      continue;
    }

    if (res.ok) return res;

    const text = await res.text().catch(() => "");
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === maxRetries) {
      throw new Error(`${label} failed: ${res.status} ${res.statusText} ${text}`);
    }

    const serverDelay = parseRetryAfterMs(res, text);
    const expBackoff = baseRetryMs * 2 ** attempt;
    const jitter = Math.floor(Math.random() * 150);
    const delayMs = Math.max(serverDelay ?? 0, expBackoff + jitter);
    await sleep(delayMs);
  }

  throw new Error(`${label} failed: retries exhausted`);
}

async function fetchWithTimeout(params: {
  input: string;
  init: RequestInit;
  timeoutMs: number;
}): Promise<Response> {
  const { input, init, timeoutMs } = params;
  const timeoutController = new AbortController();
  const upstreamSignal = init.signal;

  const abortFromUpstream = () => timeoutController.abort();
  if (upstreamSignal?.aborted) timeoutController.abort();
  else if (upstreamSignal) upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });

  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: timeoutController.signal });
  } finally {
    clearTimeout(timeoutId);
    if (upstreamSignal) upstreamSignal.removeEventListener("abort", abortFromUpstream);
  }
}

function isRetryableTransportError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  if (/abort|timed?\s*out|network|fetch failed|socket/i.test(err.message)) return true;
  return false;
}
