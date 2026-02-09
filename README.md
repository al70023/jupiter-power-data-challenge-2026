# Jupiter Power Data Challenge 2026

Current implementation status for the ERCOT 15-minute forecast challenge.

## Scope Implemented So Far

- Backend data pipeline for ERCOT NP6-905-CD (`spp_node_zone_hub`)
- Forecast API endpoint for `HB_WEST`
- 15-minute output format (`96` slots/day)
- Dual forecast model: weekly median by slot for both 4-week and 8-week lookbacks
- Retry/backoff handling for upstream ERCOT rate limits (`429`)
- Unit/integration-style tests for normalization, forecast logic, pagination, retry behavior, and route contract

UI is not implemented yet (current `app/page.tsx` is still placeholder).

## Tech Stack

- Next.js (App Router, TypeScript)
- Luxon
- Vitest (unit tests)

## Environment Variables

Create `.env` in repo root:

```env
ERCOT_SUBSCRIPTION_KEY="your_subscription_key"
ERCOT_USERNAME="your_ercot_username"
ERCOT_PASSWORD="your_ercot_password"
```

## Main API

### `GET /api/forecast?date=YYYY-MM-DD`

Returns 15-minute forecast for `HB_WEST` for the requested date, including both 4-week and 8-week variants.

Validation:
- Date must be valid ISO format (`YYYY-MM-DD`)
- Date must be within selectable 7-day window (today through today+6, `America/Chicago`)

Response shape (abridged):

```json
{
  "ok": true,
  "date": "2026-02-10",
  "settlementPoint": "HB_WEST",
  "timezone": "America/Chicago",
  "intervalMinutes": 15,
  "count": 96,
  "forecast4w": [
    { "slot": 0, "ts": "2026-02-10 00:00", "value": 33.06 }
  ],
  "forecast8w": [
    { "slot": 0, "ts": "2026-02-10 00:00", "value": 32.81 }
  ],
  "comparison": [
    {
      "slot": 0,
      "ts": "2026-02-10 00:00",
      "value4w": 33.06,
      "value8w": 32.81,
      "delta": 0.25
    }
  ],
  "forecast": [
    { "slot": 0, "ts": "2026-02-10 00:00", "value": 33.06 }
  ]
}
```

Notes:
- `forecast` is kept as an alias of `forecast4w` for backward compatibility.

Error handling:
- `400 INVALID_DATE`
- `400 DATE_OUT_OF_RANGE`
- `503 UPSTREAM_RATE_LIMITED` (ERCOT throttling)
- `500 FORECAST_FAILED`

## Code Organization

- `app/lib/shared/`
  - cross-cutting helpers/constants (`date`, `number`, `env`, `http`)
- `app/lib/ercot/`
  - ERCOT API client, field mapping, pagination history fetch, ERCOT-specific types/constants
- `app/lib/forecast/`
  - normalization, forecast model, side-by-side comparison builder, forecast types
- `app/api/forecast/route.ts`
  - thin route orchestration and response shaping

## Forecast Logic (Current)

- Pulls historical rows for the prior `56` days ending at target date minus 1 day
- Computes two variants from the same fetched history:
  - `4-week`: last `4` same-weekday dates
  - `8-week`: last `8` same-weekday dates
- Normalizes to 96 slots/day
- Computes per-slot median, rounds to 2 decimals, and includes `delta = value4w - value8w`

## DST Handling (Current)

In normalization, duplicate slot keys can occur on fallback DST dates.

Current policy:
- Prefer `DSTFlag=false` over `DSTFlag=true` when both appear for the same slot
- This makes fallback duplicate handling deterministic for the common duplicate pair case

## Testing

Run tests:

```bash
npm test
```

Test layout:
- tests are organized under `__tests__` directories

Current tests:
- `app/lib/__tests__/normalize.test.ts`
  - standard slot mapping
  - duplicate handling preference (`DSTFlag=false`)
  - documented same-flag duplicate behavior
- `app/lib/__tests__/forecast.test.ts`
  - median/rounding correctness
  - lookback window behavior (`4w` vs `8w`)
- `app/lib/__tests__/history.test.ts`
  - multi-page fetch aggregation
  - single-page fallback behavior
- `app/lib/__tests__/ercot-client.test.ts`
  - retry behavior on `429`
  - fail-fast behavior on non-retryable `400`
- `app/api/forecast/__tests__/route.test.ts`
  - request validation
  - dual-forecast response contract
  - upstream rate-limit error mapping (`503`)

## Run Locally

```bash
npm install
npm run dev
```

Then open:
- `http://localhost:3000/api/forecast?date=YYYY-MM-DD`

## Known Gaps / Next Work

- Build frontend UX (date picker + table/chart)
- Add model performance/diagnostic display
- Continue improving README as features are added
