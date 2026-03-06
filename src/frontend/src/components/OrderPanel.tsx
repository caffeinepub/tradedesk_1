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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useLivePrices } from "@/hooks/useLivePrices";
import {
  useBalance,
  useBuy,
  usePortfolioAssets,
  useSell,
  useTrades,
} from "@/hooks/useQueries";
import { formatChange, formatCurrency, formatTimestamp } from "@/utils/format";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  FlaskConical,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Asset } from "../backend.d";
import { TradeType } from "../backend.d";
import type { ActiveOrderLines } from "./ChartOrderLines";

const INDEX_SYMBOLS = new Set(["SPX", "NDX", "DJI", "FTSE", "N225", "DAX"]);

interface OrderPanelProps {
  symbol: string;
  asset: Asset | null;
  onOrderPlaced?: (lines: ActiveOrderLines) => void;
}

type Side = "buy" | "sell";
type OrderType = "market" | "limit";

interface SuccessInfo {
  side: Side;
  qty: number;
  total: number;
}

export function OrderPanel({ symbol, asset, onOrderPlaced }: OrderPanelProps) {
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tradesOpen, setTradesOpen] = useState(false);
  const [showSwitchToRealDialog, setShowSwitchToRealDialog] = useState(false);
  const [showSwitchToDemoDialog, setShowSwitchToDemoDialog] = useState(false);

  // SL/TP state
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slPrice, setSlPrice] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const slUserEdited = useRef(false);
  const tpUserEdited = useRef(false);

  // Trailing SL state
  const [slMode, setSlMode] = useState<"fixed" | "trailing">("fixed");
  const [trailDistance, setTrailDistance] = useState("1.5");
  const [trailType, setTrailType] = useState<"percent" | "points">("percent");
  const trailUserEdited = useRef(false);

  const { data: livePrices } = useLivePrices();
  const { data: balance } = useBalance();
  const { data: portfolio } = usePortfolioAssets();
  const { data: trades } = useTrades();
  const { login, identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const buy = useBuy();
  const sell = useSell();
  const isPending = buy.isPending || sell.isPending;
  const { accountMode, setAccountMode } = useAccountMode();
  const isRealAccount = accountMode === "real";
  const isDemoMode = accountMode === "demo";

  const { demoBalance, demoPortfolio, demoTrades, demoBuy, demoSell } =
    useDemoAccount();

  const confirmSwitchToReal = () => {
    setAccountMode("real");
    setShowSwitchToRealDialog(false);
  };

  const confirmSwitchToDemo = () => {
    setAccountMode("demo");
    setShowSwitchToDemoDialog(false);
  };

  const liveData = livePrices[symbol];
  const displayPrice =
    (liveData?.price || 0) > 0 ? liveData!.price : (asset?.price ?? 0);
  const displayChange = liveData?.change24h ?? asset?.change24h ?? 0;
  const isPos = displayChange >= 0;

  const effectivePrice =
    orderType === "limit" && limitPrice
      ? Number.parseFloat(limitPrice) || displayPrice
      : displayPrice;

  const qty = Number.parseFloat(quantity) || 0;
  const estimatedTotal = qty * effectivePrice;

  // Sync limit price when switching to limit or symbol changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: symbol is a prop used as a reset trigger
  useEffect(() => {
    if (orderType === "limit" && displayPrice > 0) {
      setLimitPrice(displayPrice.toFixed(displayPrice < 1 ? 6 : 2));
    }
  }, [orderType, symbol, displayPrice]);

  // Reset form on symbol change
  // biome-ignore lint/correctness/useExhaustiveDependencies: symbol is a prop used as a reset trigger
  useEffect(() => {
    setQuantity("");
    setSuccessInfo(null);
    setShowConfirm(false);
    slUserEdited.current = false;
    tpUserEdited.current = false;
    trailUserEdited.current = false;
    setSlEnabled(false);
    setTpEnabled(false);
    setSlMode("fixed");
    setTrailDistance("1.5");
    setTrailType("percent");
  }, [symbol]);

  // Auto-suggest SL/TP when price or side changes (only if user hasn't edited)
  useEffect(() => {
    if (displayPrice <= 0) return;
    if (!slUserEdited.current) {
      const suggested =
        side === "buy" ? displayPrice * 0.985 : displayPrice * 1.015;
      setSlPrice(suggested.toFixed(suggested < 1 ? 6 : 2));
    }
    if (!tpUserEdited.current) {
      const suggested =
        side === "buy" ? displayPrice * 1.03 : displayPrice * 0.97;
      setTpPrice(suggested.toFixed(suggested < 1 ? 6 : 2));
    }
  }, [displayPrice, side]);

  const isIndex = INDEX_SYMBOLS.has(symbol);

  // In demo mode, use demo balance/portfolio/trades; in real mode use backend data
  const effectiveBalance = isDemoMode ? demoBalance : (balance ?? 0);
  const effectivePortfolio = isDemoMode ? demoPortfolio : (portfolio ?? []);
  const effectiveTrades = isDemoMode ? demoTrades : (trades ?? []);

  // Holdings for this symbol
  const holding = effectivePortfolio.find((p) => p.symbol === symbol);
  const heldQty = holding?.quantity ?? 0;

  const availableBalance = effectiveBalance;

  const setPercentBuy = (pct: number) => {
    if (displayPrice <= 0) return;
    const amount = (availableBalance * pct) / 100;
    const q = amount / effectivePrice;
    setQuantity(q > 0 ? q.toFixed(6) : "");
  };

  const setPercentSell = (pct: number) => {
    const q = (heldQty * pct) / 100;
    setQuantity(q > 0 ? q.toFixed(6) : "");
  };

  // SL/TP computed values
  const slVal = Number.parseFloat(slPrice) || 0;
  const tpVal = Number.parseFloat(tpPrice) || 0;

  // Trailing SL effective price
  const trailDistNum = Number.parseFloat(trailDistance) || 1.5;
  const effectiveTrailSL =
    slEnabled && slMode === "trailing" && effectivePrice > 0
      ? trailType === "percent"
        ? side === "buy"
          ? effectivePrice * (1 - trailDistNum / 100)
          : effectivePrice * (1 + trailDistNum / 100)
        : side === "buy"
          ? effectivePrice - trailDistNum
          : effectivePrice + trailDistNum
      : 0;

  // Use effective SL for loss calculations
  const activeSLVal = slMode === "trailing" ? effectiveTrailSL : slVal;

  const slLoss =
    slEnabled && activeSLVal > 0 && qty > 0
      ? Math.abs(activeSLVal - effectivePrice) * qty
      : 0;
  const tpProfit =
    tpEnabled && tpVal > 0 && qty > 0
      ? Math.abs(tpVal - effectivePrice) * qty
      : 0;

  const rrRatio =
    slEnabled &&
    tpEnabled &&
    activeSLVal > 0 &&
    tpVal > 0 &&
    activeSLVal !== effectivePrice
      ? Math.abs(tpVal - effectivePrice) /
        Math.abs(activeSLVal - effectivePrice)
      : null;

  const handleSubmit = async () => {
    // In demo mode, no login needed - use local simulation
    if (isDemoMode) {
      if (qty <= 0) {
        toast.error("Enter a valid quantity");
        return;
      }
      let err: string | null = null;
      if (side === "buy") {
        err = demoBuy(symbol, qty, effectivePrice);
        if (!err) {
          toast.success(`[DEMO] Bought ${qty} ${symbol}`, {
            description: `Total: ${formatCurrency(estimatedTotal)}`,
          });
        }
      } else {
        err = demoSell(symbol, qty, effectivePrice);
        if (!err) {
          toast.success(`[DEMO] Sold ${qty} ${symbol}`, {
            description: `Total: ${formatCurrency(estimatedTotal)}`,
          });
        }
      }
      if (err) {
        toast.error("Demo trade failed", { description: err });
        return;
      }
      setSuccessInfo({ side, qty, total: estimatedTotal });
      setShowConfirm(false);

      // Fire order lines callback if SL or TP is active
      if (onOrderPlaced && (slEnabled || tpEnabled)) {
        const stopLossValue = slEnabled
          ? slMode === "trailing"
            ? effectiveTrailSL > 0
              ? effectiveTrailSL
              : null
            : slVal > 0
              ? slVal
              : null
          : null;
        onOrderPlaced({
          symbol,
          side,
          entryPrice: effectivePrice,
          stopLoss: stopLossValue,
          takeProfit: tpEnabled && tpVal > 0 ? tpVal : null,
          trailingSL:
            slMode === "trailing"
              ? { distance: trailDistNum, type: trailType }
              : null,
        });
      }

      setQuantity("");
      setTimeout(() => setSuccessInfo(null), 3000);
      return;
    }

    // Real mode: require login and use backend
    if (!isLoggedIn) {
      login();
      return;
    }
    if (qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    try {
      if (side === "buy") {
        await buy.mutateAsync({ symbol, quantity: qty });
        toast.success(`Bought ${qty} ${symbol}`, {
          description: `Total: ${formatCurrency(estimatedTotal)}`,
        });
      } else {
        await sell.mutateAsync({ symbol, quantity: qty });
        toast.success(`Sold ${qty} ${symbol}`, {
          description: `Total: ${formatCurrency(estimatedTotal)}`,
        });
      }
      setSuccessInfo({ side, qty, total: estimatedTotal });
      setShowConfirm(false);

      // Fire order lines callback if SL or TP is active
      if (onOrderPlaced && (slEnabled || tpEnabled)) {
        const stopLossValue = slEnabled
          ? slMode === "trailing"
            ? effectiveTrailSL > 0
              ? effectiveTrailSL
              : null
            : slVal > 0
              ? slVal
              : null
          : null;
        onOrderPlaced({
          symbol,
          side,
          entryPrice: effectivePrice,
          stopLoss: stopLossValue,
          takeProfit: tpEnabled && tpVal > 0 ? tpVal : null,
          trailingSL:
            slMode === "trailing"
              ? { distance: trailDistNum, type: trailType }
              : null,
        });
      }

      setQuantity("");
      setTimeout(() => setSuccessInfo(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Trade failed", { description: msg });
    }
  };

  // Recent trades for this symbol (demo or real)
  const recentTrades = effectiveTrades
    .filter((t) => t.symbol === symbol)
    .slice(0, 5);

  if (isIndex) {
    return (
      <div
        data-ocid="order.panel"
        className="w-80 shrink-0 border-l border-border bg-card flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-muted/30 border border-border flex items-center justify-center">
          <Eye className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-mono text-muted-foreground">
          Indices are view-only
        </p>
        <p className="text-xs text-muted-foreground/60">
          {symbol} cannot be traded directly
        </p>
      </div>
    );
  }

  return (
    <div
      data-ocid="order.panel"
      className="w-80 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden"
    >
      {/* ── Account mode header badge ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Order Panel
        </span>
        {!isRealAccount ? (
          <div
            data-ocid="order.header_demo_badge"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "oklch(0.18 0.10 300 / 0.80)",
              border: "1px solid oklch(0.42 0.18 300 / 0.60)",
              color: "oklch(0.80 0.20 300)",
            }}
          >
            <FlaskConical style={{ width: 9, height: 9, flexShrink: 0 }} />
            <span>Demo</span>
            <button
              type="button"
              data-ocid="order.header.switch_to_real.button"
              onClick={() => setShowSwitchToRealDialog(true)}
              className="flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                background: "oklch(0.30 0.14 145 / 0.85)",
                border: "1px solid oklch(0.50 0.18 145 / 0.60)",
                color: "oklch(0.80 0.20 145)",
              }}
            >
              <Zap style={{ width: 8, height: 8 }} />
              Go Real
            </button>
          </div>
        ) : (
          <div
            data-ocid="order.header_real_badge"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "oklch(0.14 0.06 145 / 0.80)",
              border: "1px solid oklch(0.38 0.14 145 / 0.60)",
              color: "oklch(0.75 0.18 145)",
            }}
          >
            <ShieldCheck style={{ width: 9, height: 9, flexShrink: 0 }} />
            <span>Real</span>
            <button
              type="button"
              data-ocid="order.header.switch_to_demo.button"
              onClick={() => setShowSwitchToDemoDialog(true)}
              className="flex items-center gap-1 ml-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{
                background: "oklch(0.22 0.10 300 / 0.85)",
                border: "1px solid oklch(0.40 0.16 300 / 0.60)",
                color: "oklch(0.78 0.18 300)",
              }}
            >
              <FlaskConical style={{ width: 8, height: 8 }} />
              Go Demo
            </button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* ── Demo mode banner ──────────────────────────────────────── */}
          {!isRealAccount && (
            <div
              data-ocid="order.demo_mode_banner"
              className="rounded-md border border-violet-800/50 bg-violet-950/30 px-3 py-2.5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <p className="text-[10px] font-mono text-violet-300 leading-snug">
                  <span className="font-bold text-violet-300">DEMO MODE</span> —
                  Trades use simulated funds
                </p>
              </div>
              <button
                type="button"
                data-ocid="order.switch_to_real.button"
                onClick={() => setShowSwitchToRealDialog(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded border border-violet-600/60 bg-violet-800/30 hover:bg-violet-700/40 transition-colors py-1.5 text-[10px] font-mono font-semibold text-violet-200 hover:text-white"
              >
                <Zap className="w-3 h-3" />
                Switch to Real Account
              </button>
            </div>
          )}

          {/* ── Price header ──────────────────────────────────────────── */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {symbol}
              </span>
              {liveData ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_145)] animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.25_0.06_70)] text-[oklch(0.80_0.14_70)] border border-[oklch(0.40_0.09_70)]">
                  SIM
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                {displayPrice > 0 ? formatCurrency(displayPrice) : "—"}
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
            </div>
          </div>

          {/* ── Balance ───────────────────────────────────────────────── */}
          {(isDemoMode || isLoggedIn) && (
            <div className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-3 py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {isDemoMode ? "Demo Balance" : "Available"}
              </span>
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  isDemoMode ? "text-[oklch(0.72_0.14_260)]" : "text-foreground"
                }`}
              >
                {formatCurrency(availableBalance)}
              </span>
            </div>
          )}

          {/* ── Main content: order form or confirm panel ─────────────── */}
          <AnimatePresence mode="wait">
            {showConfirm ? (
              /* ── Confirmation Panel ──────────────────────────────── */
              <motion.div
                key="confirm"
                data-ocid="order.confirm_panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Review heading */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2">
                    Review Order
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Summary rows */}
                <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2">
                  {/* Asset */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Asset
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {asset?.name ? (
                        <>
                          {asset.name}{" "}
                          <span className="text-muted-foreground">
                            ({symbol})
                          </span>
                        </>
                      ) : (
                        symbol
                      )}
                    </span>
                  </div>

                  {/* Side */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Side
                    </span>
                    <span
                      className={`text-xs font-mono font-bold tabular-nums ${
                        side === "buy" ? "price-positive" : "price-negative"
                      }`}
                    >
                      {side.toUpperCase()}
                    </span>
                  </div>

                  {/* Order type */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Order Type
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground capitalize">
                      {orderType}
                    </span>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Quantity
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {qty}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Price
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums flex items-center gap-1">
                      {formatCurrency(effectivePrice)}
                      {liveData && (
                        <span className="text-[9px] font-bold text-[oklch(0.72_0.18_145)]">
                          LIVE
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Limit price (if limit order) */}
                  {orderType === "limit" && limitPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                        Limit At
                      </span>
                      <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                        {formatCurrency(Number.parseFloat(limitPrice) || 0)}
                      </span>
                    </div>
                  )}

                  {/* Stop Loss */}
                  {slEnabled &&
                    (slMode === "trailing"
                      ? effectiveTrailSL > 0
                      : slVal > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                          {slMode === "trailing"
                            ? `Trail SL (${trailDistance}${trailType === "percent" ? "%" : "pts"})`
                            : "Stop Loss"}
                        </span>
                        <span
                          className="text-xs font-mono font-semibold tabular-nums"
                          style={
                            slMode === "trailing"
                              ? { color: "oklch(0.72 0.18 55)" }
                              : undefined
                          }
                        >
                          <span
                            className={
                              slMode === "trailing" ? "" : "text-red-400"
                            }
                          >
                            {slMode === "trailing"
                              ? formatCurrency(effectiveTrailSL)
                              : formatCurrency(slVal)}
                          </span>
                        </span>
                      </div>
                    )}

                  {/* Take Profit */}
                  {tpEnabled && tpVal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                        Take Profit
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(tpVal)}
                      </span>
                    </div>
                  )}

                  {/* Risk / Reward */}
                  {slEnabled && tpEnabled && rrRatio !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                        Risk / Reward
                      </span>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          rrRatio >= 2
                            ? "text-emerald-400"
                            : rrRatio >= 1
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        1 : {rrRatio.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Estimated Total */}
                  <div className="border-t border-border/60 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground">
                        Estimated Total
                      </span>
                      <span
                        className={`text-sm font-mono font-bold tabular-nums ${
                          side === "buy" ? "price-positive" : "price-negative"
                        }`}
                      >
                        {formatCurrency(estimatedTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Account Mode */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                      Account Mode
                    </span>
                    {isRealAccount ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          background: "oklch(0.14 0.06 145 / 0.80)",
                          border: "1px solid oklch(0.38 0.14 145 / 0.60)",
                          color: "oklch(0.75 0.18 145)",
                        }}
                      >
                        <ShieldCheck style={{ width: 8, height: 8 }} />
                        REAL
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider"
                        style={{
                          background: "oklch(0.18 0.10 300 / 0.80)",
                          border: "1px solid oklch(0.42 0.18 300 / 0.60)",
                          color: "oklch(0.80 0.20 300)",
                        }}
                      >
                        <FlaskConical style={{ width: 8, height: 8 }} />
                        DEMO
                      </span>
                    )}
                  </div>
                </div>

                {/* Live account warning */}
                {isRealAccount && isLoggedIn && (
                  <div
                    data-ocid="order.confirm_live_warning"
                    className="flex items-start gap-2 rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-mono text-amber-300/90 leading-snug">
                      <span className="font-bold text-amber-400">
                        LIVE ACCOUNT
                      </span>{" "}
                      — Real funds will be moved when you confirm.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    data-ocid="order.confirm_edit.button"
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={isPending}
                    className="flex-1 border-border font-mono text-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit Order
                  </Button>
                  <Button
                    data-ocid="order.confirm_submit.button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className={`flex-1 font-mono font-bold text-xs tracking-wide ${
                      side === "buy"
                        ? "bg-profit hover:bg-profit/90 text-background"
                        : "bg-sell hover:bg-sell/90 text-background"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        Processing…
                      </>
                    ) : (
                      "Confirm & Submit"
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* ── Order Form ──────────────────────────────────────── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* ── Buy / Sell tabs ────────────────────────────────── */}
                <div className="flex rounded-md overflow-hidden border border-border">
                  <button
                    type="button"
                    data-ocid="order.buy_tab"
                    onClick={() => setSide("buy")}
                    className={`flex-1 py-2.5 text-sm font-bold font-mono transition-colors ${
                      side === "buy"
                        ? "bg-profit text-background"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    data-ocid="order.sell_tab"
                    onClick={() => setSide("sell")}
                    className={`flex-1 py-2.5 text-sm font-bold font-mono transition-colors ${
                      side === "sell"
                        ? "bg-sell text-background"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* ── Order type ──────────────────────────────────────── */}
                <div className="flex rounded-md overflow-hidden border border-border text-xs font-mono">
                  <button
                    type="button"
                    data-ocid="order.market_toggle"
                    onClick={() => setOrderType("market")}
                    className={`flex-1 py-1.5 font-semibold transition-colors ${
                      orderType === "market"
                        ? "bg-primary/20 text-primary border-r border-primary/30"
                        : "bg-secondary/30 text-muted-foreground hover:text-foreground border-r border-border"
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    data-ocid="order.limit_toggle"
                    onClick={() => setOrderType("limit")}
                    className={`flex-1 py-1.5 font-semibold transition-colors ${
                      orderType === "limit"
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {/* ── Limit price input ───────────────────────────────── */}
                <AnimatePresence>
                  {orderType === "limit" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-1"
                    >
                      <label
                        htmlFor="order-limit-price"
                        className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                      >
                        Limit Price
                      </label>
                      <Input
                        id="order-limit-price"
                        data-ocid="order.limit_price.input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={displayPrice.toFixed(2)}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="font-mono text-sm bg-secondary border-border text-foreground focus-visible:ring-primary h-9"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Quantity ────────────────────────────────────────── */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="order-quantity"
                    className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
                  >
                    Quantity
                  </label>
                  <Input
                    id="order-quantity"
                    data-ocid="order.quantity.input"
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="font-mono text-sm bg-secondary border-border text-foreground focus-visible:ring-primary h-9"
                  />
                  {qty > 0 && (
                    <p className="text-[11px] font-mono text-muted-foreground tabular-nums">
                      ≈ {formatCurrency(estimatedTotal)}
                    </p>
                  )}
                </div>

                {/* ── Quick percent buttons ───────────────────────────── */}
                <div className="grid grid-cols-4 gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        side === "buy"
                          ? setPercentBuy(pct)
                          : setPercentSell(pct)
                      }
                      className="py-1 text-[10px] font-mono font-semibold rounded border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* ── Stop Loss ───────────────────────────────────────── */}
                <div
                  className={`rounded-md border p-3 space-y-2 transition-colors ${
                    slEnabled
                      ? slMode === "trailing"
                        ? "border-[oklch(0.40_0.14_55)] bg-[oklch(0.18_0.07_55)/20]"
                        : "border-red-900/60 bg-red-950/20"
                      : "border-border bg-muted/10"
                  }`}
                  style={
                    slEnabled && slMode === "trailing"
                      ? { backgroundColor: "oklch(0.12 0.04 55 / 0.25)" }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="sl-switch"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`text-xs font-mono font-semibold uppercase tracking-wide ${
                          slEnabled
                            ? slMode === "trailing"
                              ? "text-[oklch(0.72_0.18_55)]"
                              : "text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        Stop Loss
                      </span>
                    </Label>
                    <Switch
                      id="sl-switch"
                      data-ocid="order.sl.toggle"
                      checked={slEnabled}
                      onCheckedChange={setSlEnabled}
                      className={
                        slEnabled && slMode === "trailing"
                          ? "data-[state=checked]:bg-[oklch(0.72_0.18_55)]"
                          : "data-[state=checked]:bg-red-500"
                      }
                    />
                  </div>

                  <AnimatePresence>
                    {slEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden space-y-2"
                      >
                        {/* Fixed / Trailing mode tabs */}
                        <div className="flex rounded overflow-hidden border border-border text-[10px] font-mono">
                          <button
                            type="button"
                            data-ocid="order.sl.fixed_tab"
                            onClick={() => setSlMode("fixed")}
                            className={`flex-1 py-1 font-semibold transition-colors ${
                              slMode === "fixed"
                                ? "bg-red-950/60 text-red-400 border-r border-red-900/40"
                                : "bg-secondary/30 text-muted-foreground hover:text-foreground border-r border-border"
                            }`}
                          >
                            Fixed
                          </button>
                          <button
                            type="button"
                            data-ocid="order.sl.trailing_tab"
                            onClick={() => setSlMode("trailing")}
                            className={`flex-1 py-1 font-semibold transition-colors ${
                              slMode === "trailing"
                                ? "bg-[oklch(0.18_0.07_55)/60] text-[oklch(0.72_0.18_55)]"
                                : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                            }`}
                            style={
                              slMode === "trailing"
                                ? {
                                    backgroundColor:
                                      "oklch(0.18 0.07 55 / 0.6)",
                                  }
                                : undefined
                            }
                          >
                            Trailing
                          </button>
                        </div>

                        {/* Fixed SL input */}
                        {slMode === "fixed" && (
                          <div className="space-y-1.5">
                            <Input
                              data-ocid="order.sl.input"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Stop price"
                              value={slPrice}
                              onChange={(e) => {
                                slUserEdited.current = true;
                                setSlPrice(e.target.value);
                              }}
                              className="font-mono text-sm bg-secondary border-red-900/50 text-foreground focus-visible:ring-red-500 h-8"
                            />
                            {slLoss > 0 && (
                              <p className="text-[11px] font-mono text-red-400 tabular-nums flex items-center gap-1">
                                <span className="opacity-60">Max loss:</span>
                                <span className="font-semibold">
                                  −{formatCurrency(slLoss)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Trailing SL input */}
                        {slMode === "trailing" && (
                          <div className="space-y-1.5">
                            <div className="flex gap-1.5">
                              <Input
                                data-ocid="order.sl.trail_distance.input"
                                type="number"
                                min="0.01"
                                step="0.1"
                                placeholder="1.5"
                                value={trailDistance}
                                onChange={(e) => {
                                  trailUserEdited.current = true;
                                  setTrailDistance(e.target.value);
                                }}
                                className="font-mono text-sm bg-secondary h-8 text-foreground focus-visible:ring-[oklch(0.72_0.18_55)]"
                                style={{
                                  borderColor: "oklch(0.40 0.14 55 / 0.6)",
                                }}
                              />
                              {/* % / pts toggle */}
                              <div
                                className="flex rounded overflow-hidden border text-[10px] font-mono shrink-0"
                                style={{
                                  borderColor: "oklch(0.40 0.14 55 / 0.5)",
                                }}
                              >
                                <button
                                  type="button"
                                  data-ocid="order.sl.trail_type.select"
                                  onClick={() => setTrailType("percent")}
                                  className={`px-2 h-8 font-semibold transition-colors border-r ${
                                    trailType === "percent"
                                      ? "text-[oklch(0.72_0.18_55)]"
                                      : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                                  }`}
                                  style={
                                    trailType === "percent"
                                      ? {
                                          backgroundColor:
                                            "oklch(0.22 0.08 55 / 0.7)",
                                          borderColor:
                                            "oklch(0.40 0.14 55 / 0.5)",
                                        }
                                      : {
                                          borderColor:
                                            "oklch(0.40 0.14 55 / 0.3)",
                                        }
                                  }
                                >
                                  %
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTrailType("points")}
                                  className={`px-2 h-8 font-semibold transition-colors ${
                                    trailType === "points"
                                      ? "text-[oklch(0.72_0.18_55)]"
                                      : "bg-secondary/30 text-muted-foreground hover:text-foreground"
                                  }`}
                                  style={
                                    trailType === "points"
                                      ? {
                                          backgroundColor:
                                            "oklch(0.22 0.08 55 / 0.7)",
                                        }
                                      : undefined
                                  }
                                >
                                  pts
                                </button>
                              </div>
                            </div>
                            {effectiveTrailSL > 0 && (
                              <p
                                className="text-[11px] font-mono tabular-nums"
                                style={{ color: "oklch(0.72 0.18 55 / 0.8)" }}
                              >
                                <span className="opacity-70">
                                  Effective SL:
                                </span>{" "}
                                <span className="font-semibold">
                                  {formatCurrency(effectiveTrailSL)}
                                </span>
                              </p>
                            )}
                            {slLoss > 0 && (
                              <p
                                className="text-[11px] font-mono tabular-nums flex items-center gap-1"
                                style={{ color: "oklch(0.72 0.18 55)" }}
                              >
                                <span className="opacity-60">Max loss:</span>
                                <span className="font-semibold">
                                  −{formatCurrency(slLoss)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Take Profit ─────────────────────────────────────── */}
                <div
                  className={`rounded-md border p-3 space-y-2 transition-colors ${
                    tpEnabled
                      ? "border-emerald-900/60 bg-emerald-950/20"
                      : "border-border bg-muted/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="tp-switch"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`text-xs font-mono font-semibold uppercase tracking-wide ${
                          tpEnabled
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        Take Profit
                      </span>
                    </Label>
                    <Switch
                      id="tp-switch"
                      data-ocid="order.tp.toggle"
                      checked={tpEnabled}
                      onCheckedChange={setTpEnabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <AnimatePresence>
                    {tpEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden space-y-1.5"
                      >
                        <Input
                          data-ocid="order.tp.input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Target price"
                          value={tpPrice}
                          onChange={(e) => {
                            tpUserEdited.current = true;
                            setTpPrice(e.target.value);
                          }}
                          className="font-mono text-sm bg-secondary border-emerald-900/50 text-foreground focus-visible:ring-emerald-500 h-8"
                        />
                        {tpProfit > 0 && (
                          <p className="text-[11px] font-mono text-emerald-400 tabular-nums flex items-center gap-1">
                            <span className="opacity-60">Target profit:</span>
                            <span className="font-semibold">
                              +{formatCurrency(tpProfit)}
                            </span>
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── R/R Ratio ───────────────────────────────────────── */}
                <AnimatePresence>
                  {slEnabled && tpEnabled && rrRatio !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Risk / Reward
                        </span>
                        <span
                          className={`font-mono text-xs font-bold tabular-nums ${
                            rrRatio >= 2
                              ? "text-emerald-400"
                              : rrRatio >= 1
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          1 : {rrRatio.toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Order summary ───────────────────────────────────── */}
                <div className="rounded-md bg-muted/30 border border-border p-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price</span>
                    <span className="tabular-nums">
                      {formatCurrency(effectivePrice)}
                      {liveData && (
                        <span className="ml-1 text-[oklch(0.72_0.18_145)] text-[9px]">
                          LIVE
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantity</span>
                    <span className="tabular-nums">{qty > 0 ? qty : "—"}</span>
                  </div>
                  {orderType === "limit" && limitPrice && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Limit at</span>
                      <span className="tabular-nums">
                        {formatCurrency(Number.parseFloat(limitPrice) || 0)}
                      </span>
                    </div>
                  )}
                  {slEnabled &&
                    (slMode === "trailing"
                      ? effectiveTrailSL > 0
                      : slVal > 0) && (
                      <div
                        className="flex justify-between"
                        style={
                          slMode === "trailing"
                            ? { color: "oklch(0.72 0.18 55 / 0.8)" }
                            : undefined
                        }
                      >
                        <span
                          className={
                            slMode === "trailing" ? "" : "text-red-400/80"
                          }
                        >
                          {slMode === "trailing"
                            ? `Trail SL (${trailDistance}${trailType === "percent" ? "%" : "pts"})`
                            : "Stop Loss"}
                        </span>
                        <span className="tabular-nums">
                          {slMode === "trailing"
                            ? formatCurrency(effectiveTrailSL)
                            : formatCurrency(slVal)}
                        </span>
                      </div>
                    )}
                  {tpEnabled && tpVal > 0 && (
                    <div className="flex justify-between text-emerald-400/80">
                      <span>Take Profit</span>
                      <span className="tabular-nums">
                        {formatCurrency(tpVal)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-1.5 flex justify-between font-semibold text-foreground">
                    <span>Est. Total</span>
                    <span
                      className={`tabular-nums ${
                        side === "buy" ? "price-positive" : "price-negative"
                      }`}
                    >
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>

                {/* ── Live account warning ────────────────────────────── */}
                {isRealAccount && isLoggedIn && (
                  <div
                    data-ocid="order.live_account_warning"
                    className="flex items-start gap-2 rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-mono text-amber-300/90 leading-snug">
                      <span className="font-bold text-amber-400">
                        LIVE ACCOUNT
                      </span>{" "}
                      — Real funds will be used for this order.
                    </p>
                  </div>
                )}

                {/* ── Submit button ───────────────────────────────────── */}
                <Button
                  data-ocid="order.submit_button"
                  onClick={() => {
                    if (!isDemoMode && !isLoggedIn) {
                      login();
                      return;
                    }
                    if (qty <= 0) {
                      toast.error("Enter a valid quantity");
                      return;
                    }
                    if (displayPrice <= 0) {
                      toast.error(
                        "Price not available yet, please wait a moment",
                      );
                      return;
                    }
                    setShowConfirm(true);
                  }}
                  disabled={isPending}
                  className={`w-full font-mono font-bold tracking-wide text-sm transition-colors ${
                    side === "buy"
                      ? "bg-profit hover:bg-profit/90 text-background"
                      : "bg-sell hover:bg-sell/90 text-background"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : !isDemoMode && !isLoggedIn ? (
                    "Sign In to Trade"
                  ) : (
                    `${side.toUpperCase()} ${symbol}`
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Success state ─────────────────────────────────────────── */}
          <AnimatePresence>
            {successInfo && (
              <motion.div
                data-ocid="order.success_state"
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="rounded-md border border-[oklch(0.36_0.12_145)] bg-[oklch(0.15_0.05_145)] p-4 text-center space-y-2"
              >
                <CheckCircle2 className="w-7 h-7 mx-auto text-[oklch(0.72_0.18_145)]" />
                <p className="font-mono font-bold text-[oklch(0.72_0.18_145)] text-sm">
                  Order Placed
                </p>
                <div className="space-y-0.5 text-xs font-mono text-muted-foreground">
                  <p>
                    <span
                      className={
                        successInfo.side === "buy" ? "text-profit" : "text-sell"
                      }
                    >
                      {successInfo.side.toUpperCase()}
                    </span>{" "}
                    {successInfo.qty} {symbol}
                  </p>
                  <p className="tabular-nums">
                    Total: {formatCurrency(successInfo.total)}
                  </p>
                  {slEnabled &&
                    (slMode === "trailing"
                      ? effectiveTrailSL > 0
                      : slVal > 0) && (
                      <p
                        style={
                          slMode === "trailing"
                            ? { color: "oklch(0.72 0.18 55)" }
                            : undefined
                        }
                        className={slMode === "trailing" ? "" : "text-red-400"}
                      >
                        {slMode === "trailing"
                          ? `Trail SL: ${trailDistance}${trailType === "percent" ? "%" : "pts"} (${formatCurrency(effectiveTrailSL)})`
                          : `SL: ${formatCurrency(slVal)}`}
                      </p>
                    )}
                  {tpEnabled && tpVal > 0 && (
                    <p className="text-emerald-400">
                      TP: {formatCurrency(tpVal)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Recent trades ────────────────────────────────────────────── */}
        {(isDemoMode || isLoggedIn) && (
          <div className="border-t border-border">
            <button
              type="button"
              data-ocid="order.recent_trades.toggle"
              onClick={() => setTradesOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Recent Orders</span>
              {tradesOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <AnimatePresence>
              {tradesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  {recentTrades.length === 0 ? (
                    <div
                      data-ocid="order.recent_trades.empty_state"
                      className="px-4 pb-4 text-xs font-mono text-muted-foreground/60 text-center"
                    >
                      No orders for {symbol} yet
                    </div>
                  ) : (
                    <div className="px-3 pb-3 space-y-1.5">
                      {recentTrades.map((trade, i) => {
                        // Handle both demo trades (string) and real trades (TradeType enum)
                        const isBuy = isDemoMode
                          ? (trade as { tradeType: string }).tradeType === "buy"
                          : trade.tradeType === TradeType.buy;
                        return (
                          <div
                            key={`${trade.timestamp}-${i}`}
                            data-ocid={`order.recent_trades.item.${i + 1}`}
                            className="flex items-center justify-between rounded bg-secondary/40 border border-border px-2.5 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 h-auto ${
                                  isBuy
                                    ? "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]"
                                    : "bg-[oklch(0.22_0.08_15)] text-[oklch(0.72_0.18_15)] border-[oklch(0.36_0.12_15)]"
                                }`}
                                variant="outline"
                              >
                                {isBuy ? "BUY" : "SELL"}
                              </Badge>
                              <span className="font-mono text-xs text-foreground tabular-nums">
                                {trade.quantity}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-xs tabular-nums text-foreground">
                                {formatCurrency(trade.pricePerUnit)}
                              </p>
                              <p className="font-mono text-[9px] text-muted-foreground">
                                {isDemoMode
                                  ? new Intl.DateTimeFormat("en-US", {
                                      month: "short",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    }).format(
                                      new Date(
                                        typeof trade.timestamp === "bigint"
                                          ? Number(trade.timestamp / 1_000_000n)
                                          : (trade.timestamp as number),
                                      ),
                                    )
                                  : formatTimestamp(trade.timestamp as bigint)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* ── Switch to Demo confirmation dialog ───────────────────────── */}
      <AlertDialog
        open={showSwitchToDemoDialog}
        onOpenChange={setShowSwitchToDemoDialog}
      >
        <AlertDialogContent data-ocid="order.switch_to_demo.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">
              Switch to Demo Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              You will be switched to the Demo account. All trades will use
              simulated funds and no real money will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="order.switch_to_demo.cancel_button"
              className="font-mono text-xs"
            >
              Stay on Real
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="order.switch_to_demo.confirm_button"
              onClick={confirmSwitchToDemo}
              className="font-mono text-xs"
              style={{
                background: "oklch(0.40 0.18 300 / 0.90)",
                color: "white",
              }}
            >
              Switch to Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Switch to Real confirmation dialog ───────────────────────── */}
      <AlertDialog
        open={showSwitchToRealDialog}
        onOpenChange={setShowSwitchToRealDialog}
      >
        <AlertDialogContent data-ocid="order.switch_to_real.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">
              Switch to Real Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                You are about to switch from Demo to your Real account. Please
                be aware:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs font-mono">
                <li>All orders will use real funds from your balance</li>
                <li>Trades cannot be reversed or refunded</li>
                <li>You are fully responsible for any losses incurred</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="order.switch_to_real.cancel_button"
              className="font-mono text-xs"
            >
              Stay in Demo
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="order.switch_to_real.confirm_button"
              onClick={confirmSwitchToReal}
              className="font-mono text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Yes, Switch to Real
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
