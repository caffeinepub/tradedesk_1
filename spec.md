# Vertex

## Current State
Full-stack trading platform with simulated buy/sell orders stored in an ICP Motoko backend. Live prices come from Binance, Yahoo Finance, and metals.live APIs. The backend handles portfolio, balance, trade history, and watchlist — all simulated. No real broker integration exists.

## Requested Changes (Diff)

### Add
- Alpaca Live Trading integration via HTTP outcalls from the frontend
- `useAlpacaTrading` hook that calls Alpaca REST API (`api.alpaca.markets`) for:
  - Place market buy order
  - Place market sell order
  - Get account info (buying power, portfolio value)
  - Get open positions
  - Get order history
- Alpaca config stored securely as constants in a dedicated config file (`alpacaConfig.ts`)
- `AlpacaAccountPanel` component on Dashboard showing Alpaca account balance, buying power, and equity
- Alpaca order placement wired into the TradeModal and OrderPanel (Charts page) -- when Real account mode is active, orders go to Alpaca; Demo mode stays with local simulation
- Alpaca positions synced into the Portfolio page when in Real mode
- Alpaca order history shown in Trade History when in Real mode
- "LIVE BROKER" badge in the order panel/modal when Alpaca is active

### Modify
- `TradeModal` -- when account mode is Real, call Alpaca instead of backend `buy`/`sell`
- `OrderPanel` (Charts page) -- same: Real mode routes orders to Alpaca
- `Portfolio` page -- show Alpaca positions in Real mode alongside or replacing backend portfolio
- `History` page -- show Alpaca order history in Real mode
- `Dashboard` -- add Alpaca account summary card in Real mode

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/config/alpacaConfig.ts` with API key, secret, and base URL for live trading
2. Create `src/frontend/src/hooks/useAlpacaAccount.ts` -- fetches Alpaca account info and positions
3. Create `src/frontend/src/hooks/useAlpacaOrders.ts` -- fetches Alpaca order history
4. Create `src/frontend/src/utils/alpacaApi.ts` -- utility functions for placing buy/sell market orders via Alpaca REST API using fetch with Authorization header
5. Update `TradeModal` to call `alpacaApi.placeOrder` in Real mode, show "LIVE BROKER" badge
6. Update `OrderPanel` in Charts.tsx to call `alpacaApi.placeOrder` in Real mode
7. Update `Portfolio` page to show Alpaca positions when in Real mode
8. Update `History` page to show Alpaca orders when in Real mode
9. Update `Dashboard` to show Alpaca account card in Real mode
10. Validate and deploy
