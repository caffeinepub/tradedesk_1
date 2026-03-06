import { useEffect, useRef } from "react";

export const TV_SYMBOL_MAP: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  BNB: "BINANCE:BNBUSDT",
  XRP: "BINANCE:XRPUSDT",
  ADA: "BINANCE:ADAUSDT",
  DOT: "BINANCE:DOTUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  LINK: "BINANCE:LINKUSDT",
  LTC: "BINANCE:LTCUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  UNI: "BINANCE:UNIUSDT",
  MATIC: "BINANCE:MATICUSDT",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  AMZN: "NASDAQ:AMZN",
  GOOGL: "NASDAQ:GOOGL",
  MSFT: "NASDAQ:MSFT",
  GOLD: "TVC:GOLD",
  SILVER: "TVC:SILVER",
  PLATINUM: "TVC:PLATINUM",
  COPPER: "TVC:COPPER",
  SPX: "SP:SPX",
  NDX: "NASDAQ:NDX",
  DJI: "DJ:DJI",
  FTSE: "LSE:UKX",
  N225: "TVC:NI225",
  DAX: "XETR:DAX",
};

interface TradingViewChartProps {
  symbol: string;
  height?: number;
  interval?: string;
  hideToolbars?: boolean;
  timezone?: string;
  studies?: string[];
}

export function TradingViewChart({
  symbol,
  height = 400,
  interval = "D",
  hideToolbars = false,
  timezone = "Etc/UTC",
  studies = [],
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tvSymbol = TV_SYMBOL_MAP[symbol];

  useEffect(() => {
    if (!tvSymbol || !containerRef.current) return;

    // Unique container id to avoid DOM conflicts when multiple charts exist
    const containerId = `tv-chart-${symbol}-${Date.now()}`;
    const container = containerRef.current;
    container.id = containerId;

    // Clear any previous widget content
    container.innerHTML = "";

    const initWidget = () => {
      const win = window as unknown as { TradingView?: unknown };
      if (!win.TradingView || !container) return;
      try {
        const win = window as unknown as {
          TradingView: {
            widget: new (config: Record<string, unknown>) => undefined;
          };
        };
        new win.TradingView.widget({
          container_id: containerId,
          symbol: tvSymbol,
          interval: interval,
          timezone: timezone,
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0a0a0a",
          enable_publishing: false,
          hide_top_toolbar: hideToolbars,
          hide_legend: hideToolbars,
          save_image: false,
          height: height,
          width: "100%",
          backgroundColor: "rgba(10, 10, 15, 1)",
          gridColor: "rgba(255, 255, 255, 0.04)",
          withdateranges: !hideToolbars,
          hide_side_toolbar: hideToolbars,
          allow_symbol_change: false,
          studies: studies,
        });
      } catch {
        // Widget init failed silently
      }
    };

    // Check if tv.js is already loaded
    if ((window as unknown as { TradingView?: unknown }).TradingView) {
      initWidget();
    } else {
      // Check if a script is already being loaded
      const existingScript = document.querySelector(
        'script[src="https://s3.tradingview.com/tv.js"]',
      );
      if (existingScript) {
        // Wait for the existing script to load
        existingScript.addEventListener("load", initWidget);
        widgetRef.current = setTimeout(initWidget, 2000);
      } else {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = initWidget;
        document.head.appendChild(script);
        widgetRef.current = setTimeout(initWidget, 3000);
      }
    }

    return () => {
      if (widgetRef.current) clearTimeout(widgetRef.current);
      // Clean up container content on unmount
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [symbol, tvSymbol, interval, hideToolbars, height, timezone, studies]);

  if (!tvSymbol) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground font-mono text-sm bg-muted/20 border border-border rounded-md"
        style={{ height }}
      >
        Chart not available for {symbol}
      </div>
    );
  }

  return (
    <div className="relative rounded-md overflow-hidden border border-border bg-[oklch(0.08_0.005_240)]">
      {/* Loading skeleton */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-[oklch(0.08_0.005_240)] animate-pulse z-0"
        style={{ height }}
        aria-hidden="true"
      >
        <div className="space-y-2 w-full px-4">
          <div className="h-3 bg-muted/30 rounded w-3/4" />
          <div className="h-20 bg-muted/20 rounded" />
          <div className="h-3 bg-muted/30 rounded w-1/2" />
        </div>
      </div>
      {/* TradingView widget mounts here */}
      <div ref={containerRef} className="relative z-10" style={{ height }} />
    </div>
  );
}
