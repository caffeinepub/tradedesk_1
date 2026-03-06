import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useSell, useTrades } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { TradeType } from "../backend.d";

/** Relative time helper – no external dependency */
function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function FloatingOrderBook() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell">(() => {
    try {
      const stored = localStorage.getItem("vertex_orders_active_tab");
      if (stored === "buy" || stored === "sell") return stored;
      return "all";
    } catch {
      return "all";
    }
  });
  const [sortMode, setSortMode] = useState<"pnl" | "time">(() => {
    try {
      const stored = localStorage.getItem("vertex_orders_sort_mode");
      return stored === "time" ? "time" : "pnl";
    } catch {
      return "pnl";
    }
  });
  // Index (in the `filtered` array) currently showing close confirmation
  const [confirmingIdx, setConfirmingIdx] = useState<number | null>(null);

  const { accountMode } = useAccountMode();
  const isDemoMode = accountMode === "demo";

  const { demoTrades, demoSell } = useDemoAccount();
  const { data: realTradesRaw } = useTrades();
  const { data: livePrices } = useLivePrices();

  const sellMutation = useSell();

  // Normalise both trade shapes into a common structure
  type NormalTrade = {
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    pricePerUnit: number;
    total: number;
    timestampMs: number;
  };

  const trades: NormalTrade[] = isDemoMode
    ? demoTrades.map((t) => ({
        symbol: t.symbol,
        side: t.tradeType,
        quantity: t.quantity,
        pricePerUnit: t.pricePerUnit,
        total: t.total,
        timestampMs: t.timestamp,
      }))
    : (realTradesRaw ?? []).map((t) => ({
        symbol: t.symbol,
        side: t.tradeType === TradeType.buy ? "buy" : "sell",
        quantity: t.quantity,
        pricePerUnit: t.pricePerUnit,
        total: t.total,
        // real trades have bigint nanosecond timestamps
        timestampMs: Number((t.timestamp as bigint) / 1_000_000n),
      }));

  // Sort by absolute unrealised P&L or by time depending on sortMode
  const sorted = [...trades]
    .sort((a, b) => {
      if (sortMode === "time") {
        return b.timestampMs - a.timestampMs;
      }
      // P&L sort: biggest absolute P&L first, rows without live price fall to bottom
      const lpA = livePrices[a.symbol]?.price;
      const lpB = livePrices[b.symbol]?.price;
      const pnlA =
        a.side === "buy" && lpA !== undefined
          ? Math.abs((lpA - a.pricePerUnit) * a.quantity)
          : Number.NEGATIVE_INFINITY;
      const pnlB =
        b.side === "buy" && lpB !== undefined
          ? Math.abs((lpB - b.pricePerUnit) * b.quantity)
          : Number.NEGATIVE_INFINITY;
      if (pnlA !== pnlB) return pnlB - pnlA;
      return b.timestampMs - a.timestampMs;
    })
    .slice(0, 10);

  const filtered =
    activeTab === "all" ? sorted : sorted.filter((t) => t.side === activeTab);

  const totalCount = sorted.length;
  const buyCount = sorted.filter((t) => t.side === "buy").length;
  const sellCount = sorted.filter((t) => t.side === "sell").length;

  // Total unrealised P&L across all open buy positions with a known live price
  const totalUnrealisedPnl = sorted
    .filter(
      (t) => t.side === "buy" && livePrices[t.symbol]?.price !== undefined,
    )
    .reduce((sum, t) => {
      const lp = livePrices[t.symbol]!.price;
      return sum + (lp - t.pricePerUnit) * t.quantity;
    }, 0);
  const hasPnlData = sorted.some(
    (t) => t.side === "buy" && livePrices[t.symbol]?.price !== undefined,
  );

  /** Handle confirming a close-position action */
  async function handleConfirmClose(trade: NormalTrade, displayIdx: number) {
    const livePrice = livePrices[trade.symbol]?.price;
    if (!livePrice) {
      toast.error("Live price unavailable — cannot close position");
      return;
    }

    const proceeds = trade.quantity * livePrice;

    try {
      if (isDemoMode) {
        const err = demoSell(trade.symbol, trade.quantity, livePrice);
        if (err) {
          toast.error(`Close failed: ${err}`);
          return;
        }
      } else {
        await sellMutation.mutateAsync({
          symbol: trade.symbol,
          quantity: trade.quantity,
        });
      }

      toast.success(
        `Position closed — ${trade.symbol} sold for ${formatCurrency(proceeds)}`,
      );
      // collapse the row if it was confirming this one
      setConfirmingIdx((prev) => (prev === displayIdx ? null : prev));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Close failed: ${msg}`);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="w-[320px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
            data-ocid="floating_orders.panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-foreground tracking-wide">
                  Open Orders
                </span>
                {totalCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs px-1.5 py-0"
                  >
                    {totalCount}
                  </Badge>
                )}
                {isDemoMode && (
                  <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] font-mono px-1.5 py-0">
                    DEMO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSortMode((m) => {
                      const next = m === "pnl" ? "time" : "pnl";
                      try {
                        localStorage.setItem("vertex_orders_sort_mode", next);
                      } catch {}
                      return next;
                    })
                  }
                  data-ocid="floating_orders.sort.toggle"
                  title={
                    sortMode === "pnl"
                      ? "Sorted by P&L — click to sort by time"
                      : "Sorted by time — click to sort by P&L"
                  }
                  className="h-6 px-1.5 text-muted-foreground hover:text-foreground gap-1 text-[10px] font-mono"
                >
                  {sortMode === "pnl" ? (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      <span>P&amp;L</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>Time</span>
                    </>
                  )}
                  <ArrowDownUp className="h-2.5 w-2.5 opacity-60" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setOpen(false)}
                  data-ocid="floating_orders.panel.close_button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Tab filters */}
            <div className="flex border-b border-border">
              {(["all", "buy", "sell"] as const).map((tab) => {
                const count =
                  tab === "all"
                    ? totalCount
                    : tab === "buy"
                      ? buyCount
                      : sellCount;
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      try {
                        localStorage.setItem("vertex_orders_active_tab", tab);
                      } catch {}
                      setConfirmingIdx(null);
                    }}
                    data-ocid={`floating_orders.${tab}.tab`}
                    className={`flex-1 py-1.5 text-xs font-mono font-medium transition-colors ${
                      isActive
                        ? tab === "buy"
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5"
                          : tab === "sell"
                            ? "text-red-400 border-b-2 border-red-400 bg-red-400/5"
                            : "text-foreground border-b-2 border-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {count > 0 && (
                      <span className="ml-1 opacity-70">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Order rows */}
            <ScrollArea className="h-[280px]">
              {filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"
                  data-ocid="floating_orders.empty_state"
                >
                  <span className="text-2xl mb-2">📋</span>
                  <p className="text-xs font-mono">No orders yet</p>
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((trade, idx) => {
                    const livePrice = livePrices[trade.symbol]?.price;
                    const isConfirming = confirmingIdx === idx;
                    const canClose =
                      trade.side === "buy" && livePrice !== undefined;
                    const proceeds =
                      livePrice !== undefined
                        ? trade.quantity * livePrice
                        : null;

                    // Unrealised P&L — only for buy rows with a live price
                    const pnl =
                      trade.side === "buy" && livePrice !== undefined
                        ? (livePrice - trade.pricePerUnit) * trade.quantity
                        : null;
                    const pnlPct =
                      trade.side === "buy" && livePrice !== undefined
                        ? ((livePrice - trade.pricePerUnit) /
                            trade.pricePerUnit) *
                          100
                        : null;

                    return (
                      <motion.div
                        key={`${trade.symbol}-${trade.timestampMs}-${idx}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        layout
                        className={`border-b border-border/40 last:border-0 transition-colors ${
                          isConfirming
                            ? "bg-red-500/5 border-l-2 border-l-red-500/60"
                            : pnl !== null && pnl > 0
                              ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.07]"
                              : pnl !== null && pnl < 0
                                ? "bg-red-500/[0.04] hover:bg-red-500/[0.07]"
                                : "hover:bg-muted/30"
                        }`}
                        data-ocid={`floating_orders.item.${idx + 1}`}
                      >
                        {/* Main row content */}
                        <div className="flex items-center gap-2 px-3 py-2">
                          {/* Side indicator */}
                          <div
                            className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                              trade.side === "buy"
                                ? "bg-emerald-400"
                                : "bg-red-400"
                            }`}
                          />

                          {/* Symbol + side badge */}
                          <div className="flex flex-col gap-0.5 flex-shrink-0 w-14">
                            <span className="font-mono text-xs font-bold text-foreground leading-tight">
                              {trade.symbol}
                            </span>
                            <span
                              className={`font-mono text-[10px] font-semibold leading-tight ${
                                trade.side === "buy"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {trade.side.toUpperCase()}
                            </span>
                          </div>

                          {/* Qty + price */}
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="font-mono text-[11px] text-foreground leading-tight">
                              {trade.quantity % 1 === 0
                                ? trade.quantity.toFixed(0)
                                : trade.quantity.toFixed(4)}{" "}
                              <span className="text-muted-foreground">
                                units
                              </span>
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground leading-tight truncate">
                              {formatCurrency(trade.pricePerUnit)}
                            </span>
                          </div>

                          {/* Total + time + P&L + close button */}
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <span
                              className={`font-mono text-[11px] font-semibold leading-tight ${
                                trade.side === "buy"
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatCurrency(trade.total)}
                            </span>
                            <span className="font-mono text-[9px] text-muted-foreground leading-tight">
                              {relativeTime(trade.timestampMs)}
                            </span>
                            {/* Unrealised P&L — buy rows only */}
                            {pnl !== null && pnlPct !== null && (
                              <div
                                data-ocid={`floating_orders.pnl.${idx + 1}`}
                                className="flex flex-col items-end leading-tight"
                              >
                                <span
                                  className={`font-mono text-[10px] font-semibold ${
                                    pnl > 0
                                      ? "text-emerald-400"
                                      : pnl < 0
                                        ? "text-red-400"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {pnl > 0
                                    ? `▲ +${formatCurrency(pnl)}`
                                    : pnl < 0
                                      ? `▼ ${formatCurrency(pnl)}`
                                      : formatCurrency(pnl)}
                                </span>
                                <span
                                  className={`font-mono text-[10px] ${
                                    pnlPct > 0
                                      ? "text-emerald-400"
                                      : pnlPct < 0
                                        ? "text-red-400"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {pnlPct > 0
                                    ? `+${pnlPct.toFixed(2)}%`
                                    : `${pnlPct.toFixed(2)}%`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Close Position button — only for buy rows with live price */}
                          {canClose && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setConfirmingIdx(isConfirming ? null : idx)
                              }
                              data-ocid={`floating_orders.close_button.${idx + 1}`}
                              className={`h-6 px-1.5 py-0 text-[10px] font-mono font-semibold flex-shrink-0 transition-all ${
                                isConfirming
                                  ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/15"
                                  : "border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10"
                              }`}
                            >
                              {isConfirming ? "▲" : "Close"}
                            </Button>
                          )}
                        </div>

                        {/* Inline confirmation panel */}
                        <AnimatePresence>
                          {isConfirming && (
                            <motion.div
                              key="confirm"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="mx-3 mb-2.5 rounded-lg border border-red-500/25 bg-red-500/5 p-2.5 space-y-2">
                                {/* Warning header */}
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                                  <span className="font-mono text-[10px] font-semibold text-red-400 uppercase tracking-wide">
                                    Close Position
                                  </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                      Asset
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold text-foreground">
                                      {trade.symbol}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                      Qty to sell
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold text-foreground">
                                      {trade.quantity % 1 === 0
                                        ? trade.quantity.toFixed(0)
                                        : trade.quantity.toFixed(4)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                      Live price
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold text-foreground">
                                      {livePrice !== undefined
                                        ? formatCurrency(livePrice)
                                        : "—"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-0.5 border-t border-red-500/20">
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                      Est. proceeds
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-emerald-400">
                                      {proceeds !== null
                                        ? formatCurrency(proceeds)
                                        : "—"}
                                    </span>
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-1.5 pt-0.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setConfirmingIdx(null)}
                                    data-ocid={`floating_orders.cancel_close_button.${idx + 1}`}
                                    className="flex-1 h-7 text-[10px] font-mono font-semibold border-border text-muted-foreground hover:text-foreground"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleConfirmClose(trade, idx)
                                    }
                                    disabled={sellMutation.isPending}
                                    data-ocid={`floating_orders.confirm_close_button.${idx + 1}`}
                                    className="flex-1 h-7 text-[10px] font-mono font-bold bg-red-500 hover:bg-red-600 text-white border-0 disabled:opacity-50"
                                  >
                                    {sellMutation.isPending
                                      ? "Closing…"
                                      : "Confirm Close"}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer summary */}
            {sorted.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-emerald-400">
                    ▲ {buyCount} BUY
                  </span>
                  <span className="font-mono text-[10px] text-red-400">
                    ▼ {sellCount} SELL
                  </span>
                  {hasPnlData && (
                    <span
                      data-ocid="floating_orders.total_pnl"
                      className={`font-mono text-[10px] font-semibold ${
                        totalUnrealisedPnl > 0
                          ? "text-emerald-400"
                          : totalUnrealisedPnl < 0
                            ? "text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      P&amp;L:{" "}
                      {totalUnrealisedPnl > 0
                        ? `+${formatCurrency(totalUnrealisedPnl)}`
                        : formatCurrency(totalUnrealisedPnl)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {totalCount} total
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed toggle pill */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((v) => !v)}
        data-ocid="floating_orders.toggle"
        className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg font-mono text-xs font-semibold transition-colors cursor-pointer select-none ${
          open
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:bg-muted"
        }`}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
        <span>Orders</span>
        {!open && totalCount > 0 && (
          <span
            className={`inline-flex items-center justify-center rounded-full text-[10px] font-bold w-4 h-4 leading-none ${
              isDemoMode
                ? "bg-violet-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
        {isDemoMode && !open && (
          <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[9px] font-mono px-1 py-0 h-4">
            DEMO
          </Badge>
        )}
      </motion.button>
    </div>
  );
}
