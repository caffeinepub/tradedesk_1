// Alpaca Live Trading credentials
const ALPACA_KEY = "CKNDWWTEBUCSQ2G3CR2HGMFPH4";
const ALPACA_SECRET = "4tAMbmkWN5P1KkjxFSPLCbs1388Jr1JTTPfa4ixfPzTF";
const ALPACA_BASE = "https://api.alpaca.markets";

const headers = {
  "APCA-API-KEY-ID": ALPACA_KEY,
  "APCA-API-SECRET-KEY": ALPACA_SECRET,
  "Content-Type": "application/json",
};

// Metals and indices that Alpaca doesn't support
const UNSUPPORTED_METALS = new Set([
  "GOLD",
  "SILVER",
  "PLATINUM",
  "COPPER",
  "XAU",
  "XAG",
  "XPT",
]);
const UNSUPPORTED_INDICES = new Set([
  "SPX",
  "NDX",
  "DJI",
  "FTSE",
  "N225",
  "DAX",
]);

// Crypto symbols that need /USD suffix on Alpaca
const CRYPTO_SYMBOLS = new Set([
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "ADA",
  "XRP",
  "DOGE",
  "DOT",
  "LINK",
  "UNI",
  "AVAX",
  "MATIC",
  "LTC",
  "BCH",
  "ATOM",
]);

/**
 * Convert app symbol to Alpaca symbol format.
 * Returns null if the asset is not supported on Alpaca.
 */
export function toAlpacaSymbol(appSymbol: string): string | null {
  const sym = appSymbol.toUpperCase();

  if (UNSUPPORTED_METALS.has(sym)) return null;
  if (UNSUPPORTED_INDICES.has(sym)) return null;

  if (CRYPTO_SYMBOLS.has(sym)) {
    return `${sym}/USD`;
  }

  // Stocks and other assets: pass through directly
  return sym;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  daytrade_count: number;
  pattern_day_trader: boolean;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  qty_available: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  filled_avg_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: null;
}

async function alpacaFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${ALPACA_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers ?? {}),
    },
    mode: "cors",
  });

  if (!response.ok) {
    let errorMessage = `Alpaca API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function getAlpacaAccount(): Promise<AlpacaAccount> {
  return alpacaFetch<AlpacaAccount>("/v2/account");
}

export async function getAlpacaPositions(): Promise<AlpacaPosition[]> {
  return alpacaFetch<AlpacaPosition[]>("/v2/positions");
}

export async function getAlpacaOrders(status = "all"): Promise<AlpacaOrder[]> {
  return alpacaFetch<AlpacaOrder[]>(`/v2/orders?status=${status}&limit=50`);
}

export interface AlpacaOrderRequest {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  type?: "market" | "limit";
  time_in_force?: "day" | "gtc" | "ioc" | "fok";
  limit_price?: number;
}

export async function placeAlpacaOrder(
  symbol: string,
  qty: number,
  side: "buy" | "sell",
): Promise<AlpacaOrder> {
  const body: AlpacaOrderRequest = {
    symbol,
    qty,
    side,
    type: "market",
    time_in_force: "day",
  };

  return alpacaFetch<AlpacaOrder>("/v2/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
