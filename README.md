# ERCOT 15-Minute Forecast App

Web app and API for 15-minute HB_WEST price forecasting using ERCOT NP6-905-CD data.

## Features

- `Forecast` mode for dates in the next 7 days (America/Chicago)
- `Backtest` mode for historical dates (forecast vs actual)
- 96 interval output (15-minute cadence)
- Dual model variants:
  - `4-Week` weekly-median
  - `8-Week` weekly-median
- Comparison and performance metrics:
  - Forecast delta (`4-Week - 8-Week`)
  - Backtest MAE, RMSE, Bias, Coverage
- UI views:
  - `Chart`, `Table`, `Both`
  - Hover tooltips with interval values

## Tech Stack

- Next.js (App Router, TypeScript)
- React
- Tailwind CSS
- Luxon
- Vitest

## Setup

Create `.env` in project root:

```env
ERCOT_SUBSCRIPTION_KEY="your_subscription_key"
ERCOT_USERNAME="your_ercot_username"
ERCOT_PASSWORD="your_ercot_password"
```

Install and run:

```bash
npm install
npm run dev
```

Open:

- UI: `http://localhost:3000`

## API

### `GET /api/forecast?date=YYYY-MM-DD`

Forecast endpoint for near-term dates.

Validation:

- `date` must be ISO (`YYYY-MM-DD`)
- date must be within today .. today+6 (`America/Chicago`)

Response includes:

- `forecast4w`, `forecast8w`, `comparison`
- `forecast` (alias of `forecast4w` for compatibility)

Common errors:

- `400 INVALID_DATE`
- `400 DATE_OUT_OF_RANGE`
- `503 UPSTREAM_RATE_LIMITED`
- `500 FORECAST_FAILED`

### `GET /api/backtest?date=YYYY-MM-DD`

Historical evaluation endpoint.

Validation:

- `date` must be ISO (`YYYY-MM-DD`)
- date must be before today (`America/Chicago`)

Response includes:

- interval `rows` (`forecast4w`, `forecast8w`, `actual`, errors)
- aggregate `metrics` (`mae*`, `rmse*`, `bias*`, `coverage*`)

Common errors:

- `400 INVALID_DATE`
- `400 DATE_NOT_HISTORICAL`
- `503 UPSTREAM_RATE_LIMITED`
- `500 BACKTEST_FAILED`

## Modeling Notes

- History window: last 56 days, ending at target date - 1
- Forecast method: same-weekday slot median
  - 4-week lookback
  - 8-week lookback
- Output rounding: 2 decimals
- DST duplicate-slot policy: prefer `DSTFlag=false` when duplicate slots exist

## Project Structure

- `app/api/forecast/route.ts` - forecast API route
- `app/api/backtest/route.ts` - backtest API route
- `app/lib/ercot/*` - ERCOT client + history ingestion
- `app/lib/forecast/*` - normalization, model, comparison, backtest metrics
- `app/lib/api/*` - API DTO types
- `app/components/*` - UI components + reusable chart model
- `app/page.tsx` - page orchestration and mode switching

## Quality Checks

```bash
npm test
npm run lint
npm run build
```
