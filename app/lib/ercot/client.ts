import {
  ERCOT_BASE_RETRY_MS,
  ERCOT_BASE_URL,
  ERCOT_CLIENT_ID,
  ERCOT_HTTP_TIMEOUT_MS,
  ERCOT_MAX_HTTP_RETRIES,
  ERCOT_PRODUCT_PATH,
  ERCOT_SCOPE,
  ERCOT_TOKEN_URL,
} from "@/app/lib/ercot/constants";
import { mapErcotData } from "@/app/lib/ercot/mapper";
import type { ErcotMeta, ErcotRawResponse, ErcotSppRow } from "@/app/lib/ercot/types";
import { requireEnv } from "@/app/lib/shared/env";
import { fetchWithRetry } from "@/app/lib/shared/http";

let cachedToken: { token: string; expMs: number } | null = null;
let inFlightTokenPromise: Promise<string> | null = null;

export async function fetchSppNodeZoneHub(params: {
  deliveryDateFrom: string;
  deliveryDateTo: string;
  settlementPoint: string;
  page?: number;
}): Promise<{ rows: ErcotSppRow[]; meta: ErcotMeta }> {
  const subscriptionKey = requireEnv("ERCOT_SUBSCRIPTION_KEY");
  const idToken = await getIdTokenCached();

  const url = new URL(`${ERCOT_BASE_URL}/${ERCOT_PRODUCT_PATH}`);
  url.searchParams.set("deliveryDateFrom", params.deliveryDateFrom);
  url.searchParams.set("deliveryDateTo", params.deliveryDateTo);
  url.searchParams.set("settlementPoint", params.settlementPoint);
  url.searchParams.set("page", String(params.page ?? 1));

  const res = await fetchWithRetry({
    input: url.toString(),
    init: {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        Authorization: `Bearer ${idToken}`,
      },
      cache: "no-store",
    },
    label: "ERCOT data",
    maxRetries: ERCOT_MAX_HTTP_RETRIES,
    baseRetryMs: ERCOT_BASE_RETRY_MS,
    timeoutMs: ERCOT_HTTP_TIMEOUT_MS,
  });

  const raw = (await res.json()) as ErcotRawResponse;
  if (!raw.data || !raw.fields) throw new Error("Unexpected ERCOT response shape (missing data/fields)");

  return { rows: mapErcotData(raw.fields, raw.data), meta: raw._meta };
}

// Token lasts 1 hour; cache for ~50 min to reduce overhead.
async function getIdTokenCached(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expMs > now) return cachedToken.token;
  if (inFlightTokenPromise) return inFlightTokenPromise;

  inFlightTokenPromise = (async () => {
    const username = requireEnv("ERCOT_USERNAME");
    const password = requireEnv("ERCOT_PASSWORD");

    const body = new URLSearchParams({
      username,
      password,
      grant_type: "password",
      scope: ERCOT_SCOPE,
      client_id: ERCOT_CLIENT_ID,
      response_type: "id_token",
    });

    const res = await fetchWithRetry({
      input: ERCOT_TOKEN_URL,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
      },
      label: "ERCOT token",
      maxRetries: ERCOT_MAX_HTTP_RETRIES,
      baseRetryMs: ERCOT_BASE_RETRY_MS,
      timeoutMs: ERCOT_HTTP_TIMEOUT_MS,
    });

    const json = (await res.json()) as { id_token?: string };
    if (!json.id_token) throw new Error("ERCOT token response missing id_token");

    cachedToken = { token: json.id_token, expMs: Date.now() + 50 * 60 * 1000 };
    return json.id_token;
  })();

  try {
    return await inFlightTokenPromise;
  } finally {
    inFlightTokenPromise = null;
  }
}
