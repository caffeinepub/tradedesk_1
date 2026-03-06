import type { ActiveOrderLines } from "@/components/ChartOrderLines";
import { ChartOrderLines } from "@/components/ChartOrderLines";
import { ALL_INDICATORS, IndicatorsPanel } from "@/components/IndicatorsPanel";
import { OrderPanel } from "@/components/OrderPanel";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { TradingViewChart } from "@/components/TradingViewChart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccountMode } from "@/context/AccountModeContext";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useAllAssets } from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Bell,
  Clock,
  FlaskConical,
  Globe,
  LineChart,
  Radio,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
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

// ── Timezone definitions ──────────────────────────────────────────────────────
interface TZ {
  label: string;
  value: string;
  group: string;
}

const TIMEZONES: TZ[] = [
  // UTC
  { label: "UTC", value: "Etc/UTC", group: "UTC" },
  // Americas
  { label: "New York (UTC-5/4)", value: "America/New_York", group: "Americas" },
  { label: "Chicago (UTC-6/5)", value: "America/Chicago", group: "Americas" },
  { label: "Denver (UTC-7/6)", value: "America/Denver", group: "Americas" },
  {
    label: "Los Angeles (UTC-8/7)",
    value: "America/Los_Angeles",
    group: "Americas",
  },
  { label: "Toronto (UTC-5/4)", value: "America/Toronto", group: "Americas" },
  { label: "São Paulo (UTC-3)", value: "America/Sao_Paulo", group: "Americas" },
  // Europe
  { label: "London (UTC+0/1)", value: "Europe/London", group: "Europe" },
  { label: "Amsterdam (UTC+1/2)", value: "Europe/Amsterdam", group: "Europe" },
  { label: "Berlin (UTC+1/2)", value: "Europe/Berlin", group: "Europe" },
  { label: "Madrid (UTC+1/2)", value: "Europe/Madrid", group: "Europe" },
  { label: "Paris (UTC+1/2)", value: "Europe/Paris", group: "Europe" },
  { label: "Zurich (UTC+1/2)", value: "Europe/Zurich", group: "Europe" },
  { label: "Athens (UTC+2/3)", value: "Europe/Athens", group: "Europe" },
  { label: "Helsinki (UTC+2/3)", value: "Europe/Helsinki", group: "Europe" },
  { label: "Istanbul (UTC+3)", value: "Europe/Istanbul", group: "Europe" },
  { label: "Moscow (UTC+3)", value: "Europe/Moscow", group: "Europe" },
  // Asia & Pacific
  { label: "Dubai (UTC+4)", value: "Asia/Dubai", group: "Asia/Pacific" },
  { label: "Karachi (UTC+5)", value: "Asia/Karachi", group: "Asia/Pacific" },
  { label: "Kolkata (UTC+5:30)", value: "Asia/Kolkata", group: "Asia/Pacific" },
  { label: "Dhaka (UTC+6)", value: "Asia/Dhaka", group: "Asia/Pacific" },
  { label: "Bangkok (UTC+7)", value: "Asia/Bangkok", group: "Asia/Pacific" },
  { label: "Shanghai (UTC+8)", value: "Asia/Shanghai", group: "Asia/Pacific" },
  {
    label: "Hong Kong (UTC+8)",
    value: "Asia/Hong_Kong",
    group: "Asia/Pacific",
  },
  {
    label: "Singapore (UTC+8)",
    value: "Asia/Singapore",
    group: "Asia/Pacific",
  },
  { label: "Taipei (UTC+8)", value: "Asia/Taipei", group: "Asia/Pacific" },
  { label: "Tokyo (UTC+9)", value: "Asia/Tokyo", group: "Asia/Pacific" },
  { label: "Seoul (UTC+9)", value: "Asia/Seoul", group: "Asia/Pacific" },
  {
    label: "Sydney (UTC+10/11)",
    value: "Australia/Sydney",
    group: "Asia/Pacific",
  },
  {
    label: "Auckland (UTC+12/13)",
    value: "Pacific/Auckland",
    group: "Asia/Pacific",
  },
  // Africa
  {
    label: "Johannesburg (UTC+2)",
    value: "Africa/Johannesburg",
    group: "Africa",
  },
  { label: "Cairo (UTC+2)", value: "Africa/Cairo", group: "Africa" },
  { label: "Lagos (UTC+1)", value: "Africa/Lagos", group: "Africa" },
];

// Group timezones for the select optgroups
const TZ_GROUPS = Array.from(new Set(TIMEZONES.map((tz) => tz.group)));

export function Charts() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(
    TIMEFRAMES[5], // default 1D
  );
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    () => localStorage.getItem("vertex_chart_tz") ?? "Etc/UTC",
  );
  const [activeOrderLines, setActiveOrderLines] =
    useState<ActiveOrderLines | null>(null);
  const [clockTick, setClockTick] = useState(() => new Date());
  const [activeStudies, setActiveStudies] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("vertex_chart_studies") ?? "[]");
    } catch {
      return [];
    }
  });
  const [indicatorsPanelOpen, setIndicatorsPanelOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  const toggleStudy = (studyId: string) => {
    setActiveStudies((prev) => {
      const next = prev.includes(studyId)
        ? prev.filter((s) => s !== studyId)
        : [...prev, studyId];
      localStorage.setItem("vertex_chart_studies", JSON.stringify(next));
      return next;
    });
  };

  // Tick every second for real-time HH:MM:SS display
  useEffect(() => {
    const msUntilNextSecond = 1000 - new Date().getMilliseconds();
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setClockTick(new Date());
      interval = setInterval(() => setClockTick(new Date()), 1_000);
    }, msUntilNextSecond);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeightPx, setChartHeightPx] = useState(500);

  const { accountMode, setAccountMode } = useAccountMode();
  const isDemoMode = accountMode === "demo";
  const [showSwitchToRealDialog, setShowSwitchToRealDialog] = useState(false);
  const [showSwitchToDemoDialog, setShowSwitchToDemoDialog] = useState(false);

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

  // Persist selected timezone
  useEffect(() => {
    localStorage.setItem("vertex_chart_tz", selectedTimezone);
  }, [selectedTimezone]);

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

            {/* Timezone Selector */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground hidden sm:block" />
              <select
                id="charts-tz-select"
                data-ocid="charts.timezone.select"
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                title="Chart Timezone"
                className="h-7 px-2 pr-6 bg-secondary border border-border rounded-md font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors appearance-none cursor-pointer"
                style={{ minWidth: "140px" }}
              >
                {TZ_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {TIMEZONES.filter((tz) => tz.group === group).map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Indicators button */}
            <button
              type="button"
              data-ocid="charts.indicators.open_modal_button"
              onClick={() => setIndicatorsPanelOpen(true)}
              className="relative h-7 px-2.5 flex items-center gap-1.5 bg-secondary border border-border rounded-md font-mono text-xs text-foreground hover:bg-muted/50 transition-colors"
            >
              <LineChart className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Indicators</span>
              {activeStudies.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeStudies.length}
                </span>
              )}
            </button>

            {/* Alert button */}
            <button
              type="button"
              data-ocid="charts.alert.open_modal_button"
              onClick={() => setAlertDialogOpen(true)}
              title="Set price alert"
              className="h-7 px-2.5 flex items-center gap-1.5 bg-[oklch(0.18_0.06_55_/_0.5)] hover:bg-[oklch(0.22_0.07_55_/_0.7)] border border-[oklch(0.38_0.10_55_/_0.5)] rounded-md font-mono text-xs text-[oklch(0.82_0.16_55)] transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alert</span>
            </button>

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

        {/* ── Active Indicators Chips ────────────────────────────────────── */}
        {activeStudies.length > 0 && (
          <div className="px-4 py-1.5 border-b border-border bg-muted/10 flex flex-wrap gap-1.5 shrink-0">
            {activeStudies.map((studyId, i) => {
              const indicator = ALL_INDICATORS.find(
                (ind) => ind.studyId === studyId,
              );
              return (
                <span
                  key={studyId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono font-semibold"
                >
                  {indicator?.name ?? studyId}
                  <button
                    type="button"
                    data-ocid={`charts.indicator.delete_button.${i + 1}`}
                    onClick={() => toggleStudy(studyId)}
                    className="ml-0.5 hover:text-destructive transition-colors"
                    aria-label={`Remove ${indicator?.name ?? studyId}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              data-ocid="charts.indicators.clear_button"
              onClick={() => {
                setActiveStudies([]);
                localStorage.setItem("vertex_chart_studies", "[]");
              }}
              className="text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

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
            {/* ── Demo mode watermark ──────────────────────────────────── */}
            {isDemoMode && (
              <>
                {/* Diagonal watermark text */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden rounded-lg"
                  aria-hidden="true"
                >
                  <span
                    className="font-mono font-black uppercase select-none"
                    style={{
                      fontSize: "clamp(3rem, 10vw, 8rem)",
                      transform: "rotate(-30deg)",
                      opacity: 0.08,
                      color: "oklch(0.72 0.22 300)",
                      letterSpacing: "0.25em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    DEMO
                  </span>
                </div>
                {/* Demo badge pinned top-right */}
                <div
                  data-ocid="charts.demo_mode.panel"
                  className="absolute top-2 right-2 z-40 inline-flex items-center gap-2 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: "oklch(0.18 0.10 300 / 0.92)",
                    border: "1px solid oklch(0.42 0.18 300 / 0.70)",
                    backdropFilter: "blur(8px)",
                    color: "oklch(0.80 0.20 300)",
                  }}
                >
                  <FlaskConical
                    style={{
                      width: 10,
                      height: 10,
                      color: "oklch(0.75 0.22 300)",
                      flexShrink: 0,
                    }}
                  />
                  <span className="select-none">DEMO MODE</span>
                  <button
                    type="button"
                    data-ocid="charts.demo_mode.switch_to_real.button"
                    onClick={() => setShowSwitchToRealDialog(true)}
                    className="flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{
                      background: "oklch(0.30 0.14 145 / 0.85)",
                      border: "1px solid oklch(0.50 0.18 145 / 0.60)",
                      color: "oklch(0.80 0.20 145)",
                    }}
                  >
                    <Zap style={{ width: 8, height: 8 }} />
                    Switch to Real
                  </button>
                </div>
              </>
            )}

            {/* ── Real account badge pinned top-right ──────────────────── */}
            {!isDemoMode && (
              <div
                data-ocid="charts.real_mode.panel"
                className="absolute top-2 right-2 z-40 inline-flex items-center gap-2 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: "oklch(0.14 0.06 145 / 0.92)",
                  border: "1px solid oklch(0.38 0.14 145 / 0.70)",
                  backdropFilter: "blur(8px)",
                  color: "oklch(0.75 0.18 145)",
                }}
              >
                <ShieldCheck
                  style={{
                    width: 10,
                    height: 10,
                    color: "oklch(0.72 0.20 145)",
                    flexShrink: 0,
                  }}
                />
                <span className="select-none">REAL ACCOUNT</span>
                <button
                  type="button"
                  data-ocid="charts.real_mode.switch_to_demo.button"
                  onClick={() => setShowSwitchToDemoDialog(true)}
                  className="flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    background: "oklch(0.22 0.10 300 / 0.85)",
                    border: "1px solid oklch(0.40 0.16 300 / 0.60)",
                    color: "oklch(0.78 0.18 300)",
                  }}
                >
                  <FlaskConical style={{ width: 8, height: 8 }} />
                  Switch to Demo
                </button>
              </div>
            )}

            <div className="w-full h-full rounded-lg overflow-hidden">
              <TradingViewChart
                symbol={selectedSymbol}
                height={chartHeightPx || window.innerHeight - 160}
                interval={selectedTimeframe.interval}
                hideToolbars={false}
                timezone={selectedTimezone}
                studies={activeStudies}
              />
            </div>

            {/* Timezone indicator overlay */}
            {(() => {
              const tz = TIMEZONES.find((t) => t.value === selectedTimezone);
              const tzShort = tz
                ? tz.label.split(" ")[0]
                : (selectedTimezone.split("/").pop()?.replace("_", " ") ??
                  selectedTimezone);
              const timeStr = clockTick.toLocaleTimeString("en-US", {
                timeZone: selectedTimezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              });
              const dateStr = clockTick.toLocaleDateString("en-US", {
                timeZone: selectedTimezone,
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  data-ocid="charts.timezone.panel"
                  className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-semibold select-none pointer-events-none"
                  style={{
                    background: "oklch(0.12 0.008 240 / 0.88)",
                    border: "1px solid oklch(0.30 0.04 240 / 0.60)",
                    backdropFilter: "blur(6px)",
                    color: "oklch(0.72 0.06 240)",
                    letterSpacing: "0.04em",
                  }}
                >
                  <Globe
                    style={{
                      width: 10,
                      height: 10,
                      color: "oklch(0.60 0.12 220)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "oklch(0.85 0.08 220)" }}>
                    {tzShort}
                  </span>
                  <span style={{ color: "oklch(0.55 0.04 240)" }}>·</span>
                  <span style={{ color: "oklch(0.65 0.05 240)" }}>
                    {dateStr}
                  </span>
                  <span style={{ color: "oklch(0.55 0.04 240)" }}>·</span>
                  <span
                    style={{
                      color: "oklch(0.90 0.10 220)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {timeStr}
                  </span>
                </div>
              );
            })()}

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

      {/* ── Indicators Panel ─────────────────────────────────────────────── */}
      <IndicatorsPanel
        open={indicatorsPanelOpen}
        onClose={() => setIndicatorsPanelOpen(false)}
        activeStudies={activeStudies}
        onToggleStudy={toggleStudy}
      />

      {/* ── Switch to Real confirmation dialog ───────────────────────────── */}
      <AlertDialog
        open={showSwitchToRealDialog}
        onOpenChange={setShowSwitchToRealDialog}
      >
        <AlertDialogContent data-ocid="charts.switch_to_real.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Switch to Real Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>You are about to leave Demo mode. Please be aware:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    All trades will use real funds from your live balance.
                  </li>
                  <li>Orders cannot be reversed once placed.</li>
                  <li>Losses are real and will affect your account balance.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="charts.switch_to_real.cancel_button">
              Stay in Demo
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="charts.switch_to_real.confirm_button"
              onClick={() => setAccountMode("real")}
              className="bg-destructive/80 hover:bg-destructive text-white"
            >
              Yes, Switch to Real
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Switch to Demo confirmation dialog ───────────────────────────── */}
      <AlertDialog
        open={showSwitchToDemoDialog}
        onOpenChange={setShowSwitchToDemoDialog}
      >
        <AlertDialogContent data-ocid="charts.switch_to_demo.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              Switch to Demo Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>You are about to switch to Demo mode:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>All trades will use simulated funds only.</li>
                  <li>No real money will be at risk.</li>
                  <li>You can switch back to Real mode at any time.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="charts.switch_to_demo.cancel_button">
              Stay on Real
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="charts.switch_to_demo.confirm_button"
              onClick={() => setAccountMode("demo")}
              className="bg-purple-600/80 hover:bg-purple-600 text-white"
            >
              Yes, Switch to Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Price Alert Dialog ────────────────────────────────────────────── */}
      <PriceAlertDialog
        open={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        defaultSymbol={selectedSymbol}
        defaultPrice={displayPrice > 0 ? displayPrice : undefined}
        defaultAssetName={selectedAsset?.name}
      />
    </div>
  );
}
