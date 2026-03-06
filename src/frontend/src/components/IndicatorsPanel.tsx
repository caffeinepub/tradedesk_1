import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Check, Minus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

// ── Indicator catalogue ────────────────────────────────────────────────────────

export interface Indicator {
  name: string;
  studyId: string;
  description: string;
  category: string;
}

export const ALL_INDICATORS: Indicator[] = [
  // Trend
  {
    name: "Moving Average",
    studyId: "MASimple@tv-basicstudies",
    description: "Smoothed average of closing prices",
    category: "Trend",
  },
  {
    name: "Exponential MA",
    studyId: "MAExp@tv-basicstudies",
    description: "Weighted moving average, recent data prioritised",
    category: "Trend",
  },
  {
    name: "MACD",
    studyId: "MACD@tv-basicstudies",
    description: "Trend momentum and direction",
    category: "Trend",
  },
  {
    name: "Bollinger Bands",
    studyId: "BB@tv-basicstudies",
    description: "Volatility bands around a moving average",
    category: "Trend",
  },
  {
    name: "Parabolic SAR",
    studyId: "PSAR@tv-basicstudies",
    description: "Identifies potential reversals",
    category: "Trend",
  },
  {
    name: "Ichimoku Cloud",
    studyId: "IchimokuCloud@tv-basicstudies",
    description: "Multi-component trend indicator",
    category: "Trend",
  },
  {
    name: "SuperTrend",
    studyId: "Supertrend@tv-basicstudies",
    description: "Trend following with ATR bands",
    category: "Trend",
  },
  // Oscillators
  {
    name: "RSI",
    studyId: "RSI@tv-basicstudies",
    description: "Relative Strength Index 0-100",
    category: "Oscillators",
  },
  {
    name: "Stochastic",
    studyId: "Stoch@tv-basicstudies",
    description: "Momentum oscillator 0-100",
    category: "Oscillators",
  },
  {
    name: "Williams %R",
    studyId: "WilliamsR@tv-basicstudies",
    description: "Overbought/oversold momentum",
    category: "Oscillators",
  },
  {
    name: "CCI",
    studyId: "CCI@tv-basicstudies",
    description: "Commodity Channel Index",
    category: "Oscillators",
  },
  {
    name: "Awesome Oscillator",
    studyId: "AwesomeOscillator@tv-basicstudies",
    description: "Market momentum via MAs",
    category: "Oscillators",
  },
  {
    name: "Momentum",
    studyId: "Momentum@tv-basicstudies",
    description: "Rate of price change",
    category: "Oscillators",
  },
  // Volume
  {
    name: "Volume",
    studyId: "Volume@tv-basicstudies",
    description: "Trading volume bars",
    category: "Volume",
  },
  {
    name: "VWAP",
    studyId: "VWAP@tv-basicstudies",
    description: "Volume-weighted average price",
    category: "Volume",
  },
  {
    name: "On Balance Volume",
    studyId: "OBV@tv-basicstudies",
    description: "Cumulative volume pressure",
    category: "Volume",
  },
  {
    name: "Money Flow Index",
    studyId: "MFI@tv-basicstudies",
    description: "Volume-weighted RSI",
    category: "Volume",
  },
  // Volatility
  {
    name: "Average True Range",
    studyId: "ATR@tv-basicstudies",
    description: "Measures market volatility",
    category: "Volatility",
  },
  {
    name: "Keltner Channels",
    studyId: "KeltnerChannels@tv-basicstudies",
    description: "ATR-based volatility channel",
    category: "Volatility",
  },
  {
    name: "Donchian Channel",
    studyId: "DonchianChannels@tv-basicstudies",
    description: "Highest high / lowest low channel",
    category: "Volatility",
  },
  // Custom
  {
    name: "ZigZag",
    studyId: "ZigZag@tv-basicstudies",
    description: "Filters insignificant price moves",
    category: "Custom",
  },
  {
    name: "Pivot Points",
    studyId: "PivotPointsStandard@tv-basicstudies",
    description: "Key support/resistance levels",
    category: "Custom",
  },
];

const CATEGORIES = ["Trend", "Oscillators", "Volume", "Volatility", "Custom"];

// ── Props ──────────────────────────────────────────────────────────────────────

interface IndicatorsPanelProps {
  open: boolean;
  onClose: () => void;
  activeStudies: string[];
  onToggleStudy: (studyId: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function IndicatorsPanel({
  open,
  onClose,
  activeStudies,
  onToggleStudy,
}: IndicatorsPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_INDICATORS;
    return ALL_INDICATORS.filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) ||
        ind.description.toLowerCase().includes(q) ||
        ind.category.toLowerCase().includes(q),
    );
  }, [search]);

  // Build a flat list with deterministic indices for data-ocid
  const flatWithIndex = useMemo(() => {
    return filtered.map((ind, i) => ({ ind, ocidIndex: i + 1 }));
  }, [filtered]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter((cat) =>
      filtered.some((ind) => ind.category === cat),
    );
  }, [filtered]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        data-ocid="indicators.dialog"
        className="p-0 gap-0 overflow-hidden w-[92vw] max-w-[480px]"
        style={{ maxHeight: "min(90vh, 640px)" }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-base font-bold text-foreground">
              Indicators
              {activeStudies.length > 0 && (
                <span className="ml-2 text-[11px] font-mono font-semibold text-primary bg-primary/12 border border-primary/25 rounded-full px-2 py-0.5">
                  {activeStudies.length} active
                </span>
              )}
            </DialogTitle>
            <button
              type="button"
              data-ocid="indicators.close_button"
              onClick={onClose}
              aria-label="Close indicators panel"
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="indicators.search_input"
              placeholder="Search indicators…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 font-mono text-xs bg-secondary border-border focus-visible:ring-primary"
            />
          </div>
        </DialogHeader>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: "500px" }}>
          <div className="px-2 py-2">
            {filtered.length === 0 ? (
              <div
                data-ocid="indicators.empty_state"
                className="py-10 text-center text-muted-foreground font-mono text-xs"
              >
                No indicators match &quot;{search}&quot;
              </div>
            ) : (
              visibleCategories.map((cat) => {
                const catIndicators = filtered.filter(
                  (ind) => ind.category === cat,
                );
                return (
                  <div key={cat} className="mb-2">
                    {/* Category header */}
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {cat}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] font-mono text-muted-foreground/60">
                        {catIndicators.length}
                      </span>
                    </div>

                    {/* Indicator rows */}
                    {catIndicators.map((ind) => {
                      const isActive = activeStudies.includes(ind.studyId);
                      const ocidIndex =
                        flatWithIndex.find((f) => f.ind.studyId === ind.studyId)
                          ?.ocidIndex ?? 1;

                      return (
                        <div
                          key={ind.studyId}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1 transition-colors cursor-default ${
                            isActive
                              ? "bg-primary/8 border border-primary/20"
                              : "hover:bg-muted/30 border border-transparent"
                          }`}
                        >
                          {/* Active dot */}
                          <div
                            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                              isActive
                                ? "bg-primary scale-100"
                                : "bg-muted-foreground/30 scale-75 group-hover:scale-100"
                            }`}
                          />

                          {/* Name + description */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold font-mono truncate transition-colors ${
                                isActive ? "text-primary" : "text-foreground"
                              }`}
                            >
                              {ind.name}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">
                              {ind.description}
                            </p>
                          </div>

                          {/* Toggle button */}
                          <Button
                            type="button"
                            data-ocid={`indicators.toggle.${ocidIndex}`}
                            size="sm"
                            variant={isActive ? "destructive" : "outline"}
                            onClick={() => onToggleStudy(ind.studyId)}
                            className={`h-6 px-2.5 text-[10px] font-mono font-semibold shrink-0 transition-all ${
                              isActive
                                ? "border-destructive/50 hover:bg-destructive"
                                : "border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Minus className="w-2.5 h-2.5 mr-1" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Check className="w-2.5 h-2.5 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {activeStudies.length > 0 && (
          <>
            <Separator />
            <div className="px-5 py-3 shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">
                {activeStudies.length} indicator
                {activeStudies.length !== 1 ? "s" : ""} active
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  for (const id of [...activeStudies]) {
                    onToggleStudy(id);
                  }
                }}
                className="h-6 px-2.5 text-[10px] font-mono text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
