# Jupiter Power Data Challenge 2026

Current implementation status for the ERCOT 15-minute HB_WEST forecast app.

## What Is Implemented

- ERCOT NP6-905-CD ingestion for `HB_WEST`
- Forecast API: `GET /api/forecast?date=YYYY-MM-DD`
- 96 interval outputs (15-minute cadence)
- Dual model variants from same history window:
  - `forecast4w` (weekly-median using 4 same-weekday lookbacks)
  - `forecast8w` (weekly-median using 8 same-weekday lookbacks)
- Comparison output per interval (`value4w`, `value8w`, `delta`)
- Frontend page with:
  - date picker (next 7 days)
  - fetch action, loading/error states
  - summary metrics
  - view toggle (`Chart`, `Table`, `Both`)
  - SVG chart with axis labels, ticks, and hover tooltip
  - table view of interval rows
- Upstream rate-limit handling (`429` -> `503 UPSTREAM_RATE_LIMITED`)
- Test coverage for normalize/forecast/history/client/route behavior

## Tech Stack

- Next.js App Router (TypeScript)
- React
- Luxon
- Tailwind CSS
- Vitest

## Environment Variables

Create `.env` in repo root:

```env
ERCOT_SUBSCRIPTION_KEY="your_subscription_key"
ERCOT_USERNAME="your_ercot_username"
ERCOT_PASSWORD="your_ercot_password"
```

## API Contract

### `GET /api/forecast?date=YYYY-MM-DD`

Validation:

- Date must parse as `YYYY-MM-DD`
- Date must be within selectable window: today through today + 6 days (`America/Chicago`)

Success response shape:

```json
{
  "ok": true,
  "date": "2026-02-10",
  "settlementPoint": "HB_WEST",
  "timezone": "America/Chicago",
  "model": {
    "name": "weekly-median",
    "historyDays": 56,
    "variants": {
      "forecast4w": { "lookbackWeeks": 4 },
      "forecast8w": { "lookbackWeeks": 8 }
    }
  },
  "intervalMinutes": 15,
  "count": 96,
  "forecast": [{ "slot": 0, "ts": "2026-02-10 00:00", "value": 33.06 }],
  "forecast4w": [{ "slot": 0, "ts": "2026-02-10 00:00", "value": 33.06 }],
  "forecast8w": [{ "slot": 0, "ts": "2026-02-10 00:00", "value": 32.81 }],
  "comparison": [
    {
      "slot": 0,
      "ts": "2026-02-10 00:00",
      "value4w": 33.06,
      "value8w": 32.81,
      "delta": 0.25
    }
  ]
}
```

Notes:

- `forecast` is an alias of `forecast4w` for backward compatibility.

Error responses:

- `400 INVALID_DATE`
- `400 DATE_OUT_OF_RANGE`
- `503 UPSTREAM_RATE_LIMITED`
- `500 FORECAST_FAILED`

## Forecast Method (Current)

- History window fetched: prior `56` days ending at target date - 1 day
- For each 15-minute slot:
  - 4-week variant: median from last 4 same-weekday dates
  - 8-week variant: median from last 8 same-weekday dates
- Output rounded to 2 decimals
- `delta = value4w - value8w`

## DST Duplicate Handling (Current)

When duplicate slot keys occur on fallback DST dates, normalization prefers `DSTFlag=false` over `DSTFlag=true` when both exist for the same slot.

## Project Structure

- `app/api/forecast/route.ts`
  - Request validation + orchestration
- `app/lib/api/forecast/types.ts`
  - API DTOs/contracts
- `app/lib/ercot/*`
  - ERCOT client, pagination/history fetch, ERCOT-specific types
- `app/lib/forecast/*`
  - normalization, model, comparison, domain types
- `app/lib/shared/*`
  - shared constants/helpers (`date`, `number`, `http`, `env`)
- `app/components/*`
  - `ForecastControls`, `ForecastSummary`, `ForecastViewToggle`, `ForecastChart`, `ForecastTable`, chart model mapping
- `app/page.tsx`
  - page-level state and component wiring

## Tests

Current tests live under `__tests__` directories:

- `app/lib/__tests__/normalize.test.ts`
- `app/lib/__tests__/forecast.test.ts`
- `app/lib/__tests__/history.test.ts`
- `app/lib/__tests__/ercot-client.test.ts`
- `app/api/forecast/__tests__/route.test.ts`

Run:

```bash
npm test
```

## Run Locally

```bash
npm install
npm run dev
```

Open:

- App UI: `http://localhost:3000`
- API example: `http://localhost:3000/api/forecast?date=2026-02-10`

## Next Planned Phase

- Backtesting mode to compare forecasted values vs actual historical prices and report MAE/RMSE/bias.
