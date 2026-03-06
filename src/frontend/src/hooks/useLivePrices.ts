import { useQuery } from "@tanstack/react-query";

export type LivePriceData = Record<
  string,
  { price: number; change24h: number }
>;

// ── Binance crypto symbols ──────────────────────────────────────────────────
const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  BNB: "BNBUSDT",
  XRP: "XRPUSDT",
  ADA: "ADAUSDT",
  DOT: "DOTUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  LTC: "LTCUSDT",
  DOGE: "DOGEUSDT",
  UNI: "UNIUSDT",
  MATIC: "MATICUSDT",
};

// ── Yahoo Finance symbols ───────────────────────────────────────────────────
const YAHOO_SYMBOLS: Record<string, string> = {
  AAPL: "AAPL",
  TSLA: "TSLA",
  AMZN: "AMZN",
  GOOGL: "GOOGL",
  MSFT: "MSFT",
  SPX: "%5EGSPC",
  NDX: "%5ENDX",
  DJI: "%5EDJI",
  FTSE: "%5EFTSE",
  N225: "%5EN225",
  DAX: "%5EGDAXI",
};

// ── Fetch Binance crypto prices ─────────────────────────────────────────────
async function fetchBinancePrices(): Promise<LivePriceData> {
  try {
    const symbolList = Object.values(BINANCE_SYMBOLS)
      .map((s) => `"${s}"`)
      .join(",");
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolList}]`;
    const res = await fetch(url);
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    }>;

    const result: LivePriceData = {};
    for (const [appSymbol, binanceSymbol] of Object.entries(BINANCE_SYMBOLS)) {
      const item = data.find((d) => d.symbol === binanceSymbol);
      if (item) {
        result[appSymbol] = {
          price: Number.parseFloat(item.lastPrice),
          change24h: Number.parseFloat(item.priceChangePercent),
        };
      }
    }
    return result;
  } catch {
    return {};
  }
}

// ── Fetch a single Yahoo Finance symbol ─────────────────────────────────────
async function fetchYahooSymbol(
  appSymbol: string,
  yahooSymbol: string,
): Promise<{ symbol: string; price: number; change24h: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price: number = meta.regularMarketPrice ?? 0;
    const change24h: number = meta.regularMarketChangePercent ?? 0;
    if (!price) return null;
    return { symbol: appSymbol, price, change24h };
  } catch {
    return null;
  }
}

// ── Fetch all Yahoo Finance prices in parallel ───────────────────────────────
async function fetchYahooPrices(): Promise<LivePriceData> {
  try {
    const entries = Object.entries(YAHOO_SYMBOLS);
    const results = await Promise.allSettled(
      entries.map(([appSym, yahooSym]) => fetchYahooSymbol(appSym, yahooSym)),
    );
    const data: LivePriceData = {};
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        data[r.value.symbol] = {
          price: r.value.price,
          change24h: r.value.change24h,
        };
      }
    }
    return data;
  } catch {
    return {};
  }
}

// ── Fetch metals prices ───────────────────────────────────────────────────────
// Fallback static prices with small drift if API fails
const METALS_FALLBACK: LivePriceData = {
  GOLD: { price: 2350, change24h: 0.3 },
  SILVER: { price: 28.5, change24h: 0.8 },
  PLATINUM: { price: 980, change24h: -0.2 },
  COPPER: { price: 4.2, change24h: 0.5 },
};

async function fetchMetalsPrices(): Promise<LivePriceData> {
  try {
    const res = await fetch("https://api.metals.live/v1/spot");
    if (!res.ok) return METALS_FALLBACK;
    const data = await res.json();

    // metals.live returns an array of single-key objects: [{gold: 2300}, {silver: 28}, ...]
    const merged: Record<string, number> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        Object.assign(merged, item);
      }
    } else if (typeof data === "object") {
      Object.assign(merged, data);
    }

    const result: LivePriceData = {};
    const mapping: Record<string, string> = {
      GOLD: "gold",
      SILVER: "silver",
      PLATINUM: "platinum",
      COPPER: "copper",
    };
    for (const [appSym, metalKey] of Object.entries(mapping)) {
      const price = merged[metalKey] ?? merged[metalKey.toLowerCase()];
      if (price && typeof price === "number") {
        result[appSym] = {
          price,
          // metals.live typically doesn't return change, use fallback
          change24h: METALS_FALLBACK[appSym]?.change24h ?? 0,
        };
      }
    }

    // Fill any missing metals with fallback
    for (const sym of ["GOLD", "SILVER", "PLATINUM", "COPPER"]) {
      if (!result[sym]) {
        result[sym] = METALS_FALLBACK[sym];
      }
    }

    return result;
  } catch {
    return METALS_FALLBACK;
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
async function fetchAllLivePrices(): Promise<{
  data: LivePriceData;
  isLive: boolean;
}> {
  // Run all fetches independently in parallel
  const [cryptoPrices, stockPrices, metalsPrices] = await Promise.all([
    fetchBinancePrices(),
    fetchYahooPrices(),
    fetchMetalsPrices(),
  ]);

  const merged: LivePriceData = {
    ...cryptoPrices,
    ...stockPrices,
    ...metalsPrices,
  };

  const isLive = Object.keys(merged).length > 0;
  return { data: merged, isLive };
}

export function useLivePrices(): { data: LivePriceData; isLive: boolean } {
  const { data } = useQuery({
    queryKey: ["livePrices"],
    queryFn: fetchAllLivePrices,
    refetchInterval: 5_000,
    staleTime: 4_000,
    // Never throw — always return fallback on error
    retry: false,
    throwOnError: false,
  });

  return {
    data: data?.data ?? {},
    isLive: data?.isLive ?? false,
  };
}
