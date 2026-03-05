# TradeDesk

## Current State
- Full-stack trading simulation with Motoko backend + React frontend
- Backend stores 28 assets (crypto, stocks, metals, indices) with hardcoded/simulated prices that increment slightly on each `getAllAssets()` call
- Frontend polls backend every 10s for prices
- Markets page shows asset list with search, category filter tabs, trade/watchlist actions
- No real market data; no charts

## Requested Changes (Diff)

### Add
- **Live price fetching** from public free APIs in the frontend:
  - Crypto: Binance REST API (`api.binance.com/api/v3/ticker/24hr`) for BTC, ETH, SOL, BNB, XRP, ADA, DOT, AVAX, LINK, LTC, DOGE, UNI, MATIC
  - Metals: Metals.live free API or fallback to a metals price proxy
  - Stocks & Indices: Yahoo Finance unofficial proxy (`query1.finance.yahoo.com/v8/finance/chart/`)
- **`useLivePrices` hook** that fetches live prices every 30s and returns a map of `symbol -> { price, change24h }`
- **Live price overlay** on the Markets page: replace backend prices with live data when available, showing a "LIVE" badge
- **TradingView Advanced Chart widget** embedded in the trade modal -- shows a real-time chart for the selected asset using TradingView's free embeddable widget iframe
- **TradingView Mini Chart widget** as an optional quick-view in the Markets table row or asset detail popover
- **Price staleness indicator**: show "LIVE" green badge when live data is loaded, "SIM" amber badge when falling back to backend simulation

### Modify
- `TradeModal` component: add a TradingView chart section above the buy/sell form
- `Markets.tsx`: use live prices from `useLivePrices` hook, overlay on backend asset data
- `Dashboard.tsx`: use live prices for watchlist and portfolio value display
- `useAllAssets` hook: merge backend asset metadata (name, category) with live price data from `useLivePrices`

### Remove
- Nothing removed; backend simulation remains as fallback when live data is unavailable

## Implementation Plan
1. Create `src/frontend/src/hooks/useLivePrices.ts` -- fetches Binance (crypto), Yahoo Finance proxy (stocks/indices), and metals API; merges into a `Record<string, {price: number, change24h: number}>` map; polls every 30s
2. Create `src/frontend/src/components/TradingViewChart.tsx` -- renders a TradingView Advanced Chart widget iframe for a given symbol, with symbol mapping (e.g. BTC -> BINANCE:BTCUSDT, AAPL -> NASDAQ:AAPL)
3. Create `src/frontend/src/components/TradingViewMiniChart.tsx` -- renders TradingView mini chart widget
4. Modify `Markets.tsx` -- import `useLivePrices`, overlay live price/change24h onto assets, show LIVE/SIM badge in header
5. Modify `Dashboard.tsx` -- import `useLivePrices`, overlay live prices for watchlist and portfolio
6. Modify `TradeModal.tsx` -- add TradingViewChart component above the trade form, collapsible
7. Validate typecheck + build
