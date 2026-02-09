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
}): Promise<Response> {
  const { input, init, label, maxRetries, baseRetryMs } = params;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(input, init);
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
