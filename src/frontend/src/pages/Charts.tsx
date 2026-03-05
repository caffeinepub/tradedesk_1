import type { ActiveOrderLines } from "@/components/ChartOrderLines";
import { ChartOrderLines } from "@/components/ChartOrderLines";
import { OrderPanel } from "@/components/OrderPanel";
import { TradingViewChart } from "@/components/TradingViewChart";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useAllAssets } from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import { ArrowDownRight, ArrowUpRight, BarChart2, Radio } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Asset } from "../backend.d";

// ── Timeframe definitions ─────────────────────────────────────────────────────
interface Timeframe {
  label: string;
  interval: string;
}

const TIMEFRAMES: Timeframe[] = [
  { label: "1m", interval: "1" },
  { label: "5m", interval: "5" },
  { label: "15m", interval: "15" },
  { label: "1H", interval: "60" },
  { label: "4H", interval: "240" },
  { label: "1D", interval: "D" },
  { label: "1W", interval: "W" },
];

// ── Asset groups for the symbol selector ──────────────────────────────────────
interface AssetGroup {
  label: string;
  symbols: string[];
}

const ASSET_GROUPS: AssetGroup[] = [
  {
    label: "Crypto",
    symbols: [
      "BTC",
      "ETH",
      "SOL",
      "BNB",
      "XRP",
      "ADA",
      "DOT",
      "AVAX",
      "LINK",
      "LTC",
      "DOGE",
      "UNI",
      "MATIC",
    ],
  },
  {
    label: "Stocks",
    symbols: ["AAPL", "TSLA", "AMZN", "GOOGL", "MSFT"],
  },
  {
    label: "Metals",
    symbols: ["GOLD", "SILVER", "PLATINUM", "COPPER"],
  },
  {
    label: "Indices",
    symbols: ["SPX", "NDX", "DJI", "FTSE", "N225", "DAX"],
  },
];

export function Charts() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(
    TIMEFRAMES[5], // default 1D
  );
  const [activeOrderLines, setActiveOrderLines] =
    useState<ActiveOrderLines | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeightPx, setChartHeightPx] = useState(500);

  const { data: assets } = useAllAssets();
  const { data: livePrices, isLive } = useLivePrices();

  // Build a lookup map from the backend assets
  const assetMap = new Map<string, Asset>(
    (assets ?? []).map((a) => [a.symbol, a]),
  );

  const selectedAsset = assetMap.get(selectedSymbol) ?? null;
  const liveData = livePrices[selectedSymbol];
  const displayPrice = liveData?.price ?? selectedAsset?.price ?? 0;
  const displayChange = liveData?.change24h ?? selectedAsset?.change24h ?? 0;
  const isPos = displayChange >= 0;

  // Label for the symbol selector: prefer backend name, else symbol
  const getLabel = (symbol: string) => {
    const asset = assetMap.get(symbol);
    return asset ? `${symbol} – ${asset.name}` : symbol;
  };

  // Clear order lines on symbol change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset
  useEffect(() => {
    setActiveOrderLines(null);
  }, [selectedSymbol]);

  // Track chart container height for overlay positioning
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartHeightPx(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setChartHeightPx(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="flex-1 overflow-hidden flex flex-row"
      data-ocid="charts.page"
    >
      {/* ── Left: Header + Chart ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 pt-4 pb-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Icon + Title */}
            <div className="flex items-center gap-2 mr-1">
              <div className="w-7 h-7 rounded bg-primary/15 border border-primary/30 flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-base font-bold text-foreground leading-none">
                  Charts
                </h1>
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                  Advanced
                </div>
              </div>
            </div>

            {/* Symbol Selector */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="charts-symbol-select"
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden sm:block"
              >
                Symbol
              </label>
              <select
                id="charts-symbol-select"
                data-ocid="charts.symbol.select"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="h-7 px-2 pr-6 bg-secondary border border-border rounded-md font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer"
                style={{ minWidth: "160px" }}
              >
                {ASSET_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.symbols.map((sym) => (
                      <option key={sym} value={sym}>
                        {getLabel(sym)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Live price display */}
            {displayPrice > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(displayPrice)}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${
                    isPos ? "price-positive" : "price-negative"
                  }`}
                >
                  {isPos ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {formatChange(displayChange)}
                </span>
                {liveData && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_145)] animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
            )}

            {/* Timeframe toggles */}
            <div className="flex items-center gap-1 ml-auto">
              {!isLive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.25_0.06_70)] text-[oklch(0.80_0.14_70)] border border-[oklch(0.40_0.09_70)] mr-1">
                  SIM
                </span>
              )}
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)] mr-1">
                  <Radio className="w-2 h-2 animate-pulse" />
                  LIVE
                </span>
              )}
              {TIMEFRAMES.map((tf) => {
                const isActive = tf.interval === selectedTimeframe.interval;
                return (
                  <button
                    key={tf.interval}
                    type="button"
                    data-ocid="charts.timeframe.tab"
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`h-6 px-2 text-[10px] font-mono font-semibold rounded transition-all duration-150 ${
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Chart ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex-1 p-3 min-h-0"
          data-ocid="charts.chart_point"
        >
          {/* Relative wrapper for overlay */}
          <div className="relative w-full h-full" ref={chartContainerRef}>
            <div className="w-full h-full rounded-lg overflow-hidden">
              <TradingViewChart
                symbol={selectedSymbol}
                height={chartHeightPx || window.innerHeight - 160}
                interval={selectedTimeframe.interval}
                hideToolbars={false}
              />
            </div>

            {/* Order lines overlay */}
            <AnimatePresence>
              {activeOrderLines && (
                <div className="absolute inset-0 pointer-events-none z-20 rounded-lg overflow-hidden">
                  <ChartOrderLines
                    lines={activeOrderLines}
                    chartHeightPx={chartHeightPx}
                    visiblePriceHigh={activeOrderLines.entryPrice * 1.06}
                    visiblePriceLow={activeOrderLines.entryPrice * 0.94}
                    onDismiss={() => setActiveOrderLines(null)}
                    currentPrice={displayPrice > 0 ? displayPrice : undefined}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Right: Order Panel ───────────────────────────────────────────── */}
      <OrderPanel
        symbol={selectedSymbol}
        asset={selectedAsset}
        onOrderPlaced={setActiveOrderLines}
      />
    </div>
  );
}
