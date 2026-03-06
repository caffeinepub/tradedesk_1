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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useBalance, useBuy, useSell } from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Edit3,
  FlaskConical,
  Loader2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Asset } from "../backend.d";

interface TradeModalProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  defaultSide?: "buy" | "sell";
}

export function TradeModal({
  asset,
  open,
  onClose,
  defaultSide = "buy",
}: TradeModalProps) {
  const [side, setSide] = useState<"buy" | "sell">(defaultSide);
  const [quantity, setQuantity] = useState("");
  const [showChart, setShowChart] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSwitchToRealDialog, setShowSwitchToRealDialog] = useState(false);
  const [showSwitchToDemoDialog, setShowSwitchToDemoDialog] = useState(false);
  const buy = useBuy();
  const sell = useSell();
  const { data: livePrices } = useLivePrices();
  const { data: balance } = useBalance();
  const { accountMode, setAccountMode } = useAccountMode();
  const { login, identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const isRealAccount = accountMode === "real";
  const isDemoMode = accountMode === "demo";
  const { demoBalance, demoBuy, demoSell } = useDemoAccount();

  const confirmSwitchToReal = () => {
    setAccountMode("real");
    setShowSwitchToRealDialog(false);
  };

  const confirmSwitchToDemo = () => {
    setAccountMode("demo");
    setShowSwitchToDemoDialog(false);
  };

  const isPending = buy.isPending || sell.isPending;
  const qty = Number.parseFloat(quantity) || 0;

  // Overlay live price if available, otherwise fall back to backend/static price
  const liveData = asset ? livePrices[asset.symbol] : null;
  const displayPrice =
    (liveData?.price || 0) > 0 ? liveData!.price : (asset?.price ?? 0);
  const displayChange = liveData?.change24h ?? asset?.change24h ?? 0;

  const estimatedTotal = qty * displayPrice;

  const handleSideChange = (newSide: "buy" | "sell") => {
    setSide(newSide);
  };

  const handleSubmit = async () => {
    if (!asset || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    // Demo mode: local simulation, no login needed
    if (isDemoMode) {
      let err: string | null = null;
      if (side === "buy") {
        err = demoBuy(asset.symbol, qty, displayPrice);
        if (!err) {
          toast.success(`[DEMO] Bought ${qty} ${asset.symbol}`, {
            description: `Total: ${formatCurrency(estimatedTotal)}`,
          });
        }
      } else {
        err = demoSell(asset.symbol, qty, displayPrice);
        if (!err) {
          toast.success(`[DEMO] Sold ${qty} ${asset.symbol}`, {
            description: `Total: ${formatCurrency(estimatedTotal)}`,
          });
        }
      }
      if (err) {
        toast.error("Demo trade failed", { description: err });
        return;
      }
      setQuantity("");
      setShowConfirm(false);
      onClose();
      return;
    }

    // Real mode: require login
    if (!isLoggedIn) {
      login();
      return;
    }
    try {
      if (side === "buy") {
        await buy.mutateAsync({ symbol: asset.symbol, quantity: qty });
        toast.success(`Bought ${qty} ${asset.symbol}`, {
          description: `Total: ${formatCurrency(estimatedTotal)}`,
        });
      } else {
        await sell.mutateAsync({ symbol: asset.symbol, quantity: qty });
        toast.success(`Sold ${qty} ${asset.symbol}`, {
          description: `Total: ${formatCurrency(estimatedTotal)}`,
        });
      }
      setQuantity("");
      setShowConfirm(false);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Trade failed", { description: msg });
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setQuantity("");
      setShowConfirm(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={`bg-card border-border transition-all duration-300 ${showChart ? "max-w-2xl" : "max-w-md"}`}
          data-ocid="trade.modal"
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="font-display text-lg flex items-center gap-2">
                  {asset?.name}
                  <span className="text-muted-foreground font-mono text-sm font-normal">
                    {asset?.symbol}
                  </span>
                  {liveData && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.18_145)] animate-pulse" />
                      LIVE
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 pt-1">
                  <span className="font-mono text-foreground text-base font-semibold">
                    {asset ? formatCurrency(displayPrice) : "—"}
                  </span>
                  {asset && (
                    <span
                      className={`text-sm font-mono flex items-center gap-1 ${
                        displayChange >= 0 ? "price-positive" : "price-negative"
                      }`}
                    >
                      {displayChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatChange(displayChange)}
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Account mode badge */}
                {!isRealAccount ? (
                  <div
                    data-ocid="trade.header_demo_badge"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-widest"
                    style={{
                      background: "oklch(0.18 0.10 300 / 0.80)",
                      border: "1px solid oklch(0.42 0.18 300 / 0.60)",
                      color: "oklch(0.80 0.20 300)",
                    }}
                  >
                    <FlaskConical
                      style={{ width: 8, height: 8, flexShrink: 0 }}
                    />
                    <span>Demo</span>
                    <button
                      type="button"
                      data-ocid="trade.header.switch_to_real.button"
                      onClick={() => setShowSwitchToRealDialog(true)}
                      className="flex items-center gap-0.5 ml-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
                      style={{
                        background: "oklch(0.30 0.14 145 / 0.85)",
                        border: "1px solid oklch(0.50 0.18 145 / 0.60)",
                        color: "oklch(0.80 0.20 145)",
                      }}
                    >
                      <Zap style={{ width: 7, height: 7 }} />
                      Go Real
                    </button>
                  </div>
                ) : (
                  <div
                    data-ocid="trade.header_real_badge"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[9px] font-bold uppercase tracking-widest"
                    style={{
                      background: "oklch(0.14 0.06 145 / 0.80)",
                      border: "1px solid oklch(0.38 0.14 145 / 0.60)",
                      color: "oklch(0.75 0.18 145)",
                    }}
                  >
                    <ShieldCheck
                      style={{ width: 8, height: 8, flexShrink: 0 }}
                    />
                    <span>Real</span>
                    <button
                      type="button"
                      data-ocid="trade.header.switch_to_demo.button"
                      onClick={() => setShowSwitchToDemoDialog(true)}
                      className="flex items-center gap-0.5 ml-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-90 active:scale-95"
                      style={{
                        background: "oklch(0.22 0.10 300 / 0.85)",
                        border: "1px solid oklch(0.40 0.16 300 / 0.60)",
                        color: "oklch(0.78 0.18 300)",
                      }}
                    >
                      <FlaskConical style={{ width: 7, height: 7 }} />
                      Go Demo
                    </button>
                  </div>
                )}

                {/* Chart toggle button */}
                {asset && (
                  <Button
                    data-ocid="trade.chart_toggle"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChart((v) => !v)}
                    className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title={showChart ? "Hide chart" : "Show chart"}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Chart
                    {showChart ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* TradingView Chart */}
          {showChart && asset && (
            <div className="mt-1 mb-1" data-ocid="trade.chart_panel">
              <TradingViewChart symbol={asset.symbol} height={300} />
            </div>
          )}

          <AnimatePresence mode="wait">
            {showConfirm ? (
              /* ── Confirmation Panel ──────────────────────────────── */
              <motion.div
                key="confirm"
                data-ocid="trade.confirm_panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Review Order heading */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2">
                    Review Order
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Summary table */}
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2.5">
                  {/* Asset */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      Asset
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {asset?.name}{" "}
                      <span className="text-muted-foreground">
                        ({asset?.symbol})
                      </span>
                    </span>
                  </div>

                  {/* Side */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
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

                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      Quantity
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                      {qty}
                    </span>
                  </div>

                  {/* Price per unit */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      Price / Unit
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground tabular-nums flex items-center gap-1">
                      {formatCurrency(displayPrice)}
                      {liveData && (
                        <span className="text-[9px] font-bold text-[oklch(0.72_0.18_145)]">
                          LIVE
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/60 pt-2">
                    {/* Estimated Total */}
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
                    <span className="text-xs font-mono text-muted-foreground">
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

                {/* Live account warning (repeated in confirm step) */}
                {isRealAccount && (
                  <div
                    data-ocid="trade.confirm_live_warning"
                    className="flex items-start gap-2 rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-mono text-amber-300/90 leading-snug">
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
                    data-ocid="trade.confirm_edit.button"
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    disabled={isPending}
                    className="flex-1 border-border font-mono text-sm flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Order
                  </Button>
                  <Button
                    data-ocid="trade.confirm_submit.button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className={`flex-1 font-mono font-semibold text-sm ${
                      side === "buy"
                        ? "bg-profit hover:bg-profit/90 text-background"
                        : "bg-sell hover:bg-sell/90 text-background"
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
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
                {/* Demo balance display */}
                {isDemoMode && (
                  <div className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-3 py-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      Demo Balance
                    </span>
                    <span className="font-mono text-sm font-semibold text-[oklch(0.72_0.14_260)] tabular-nums">
                      {formatCurrency(demoBalance)}
                    </span>
                  </div>
                )}

                {/* Real account balance */}
                {isRealAccount && isLoggedIn && (
                  <div className="flex items-center justify-between rounded-md bg-muted/30 border border-border px-3 py-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      Available
                    </span>
                    <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(balance ?? 0)}
                    </span>
                  </div>
                )}

                {/* Live account warning */}
                {isRealAccount && (
                  <div
                    data-ocid="trade.live_account_warning"
                    className="flex items-start gap-2 rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-mono text-amber-300/90 leading-snug">
                      <span className="font-bold text-amber-400">
                        LIVE ACCOUNT
                      </span>{" "}
                      — This order will use real funds. Double-check your
                      quantity before confirming.
                    </p>
                  </div>
                )}

                {/* Buy/Sell Toggle */}
                <div className="flex rounded-md overflow-hidden border border-border">
                  <button
                    type="button"
                    data-ocid="trade.buy_tab"
                    onClick={() => handleSideChange("buy")}
                    className={`flex-1 py-2.5 text-sm font-semibold font-mono transition-colors ${
                      side === "buy"
                        ? "bg-profit text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    data-ocid="trade.sell_tab"
                    onClick={() => handleSideChange("sell")}
                    className={`flex-1 py-2.5 text-sm font-semibold font-mono transition-colors ${
                      side === "sell"
                        ? "bg-sell text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="trade-quantity"
                    className="text-xs text-muted-foreground uppercase tracking-wider"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="trade-quantity"
                    data-ocid="trade.input"
                    type="number"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="font-mono bg-secondary border-border text-foreground focus-visible:ring-primary"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Estimated Total */}
                <div className="rounded-md bg-muted/50 border border-border p-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Price per unit</span>
                    <span className="font-mono">
                      {asset ? formatCurrency(displayPrice) : "—"}
                      {liveData && (
                        <span className="ml-1.5 text-[10px] text-[oklch(0.72_0.18_145)]">
                          live
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Estimated Total</span>
                    <span
                      className={`font-mono ${side === "buy" ? "price-positive" : "price-negative"}`}
                    >
                      {formatCurrency(estimatedTotal)}
                    </span>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    data-ocid="trade.cancel_button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isPending}
                    className="border-border"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="trade.submit_button"
                    onClick={() => {
                      if (!isDemoMode && !isLoggedIn) {
                        login();
                        return;
                      }
                      if (qty <= 0) {
                        toast.error("Enter a valid quantity");
                        return;
                      }
                      if (!asset || displayPrice <= 0) {
                        toast.error(
                          "Asset price unavailable. Please try again.",
                        );
                        return;
                      }
                      setShowConfirm(true);
                    }}
                    disabled={isPending}
                    className={`flex-1 font-mono font-semibold ${
                      side === "buy"
                        ? "bg-profit hover:bg-profit/90 text-background"
                        : "bg-sell hover:bg-sell/90 text-background"
                    }`}
                  >
                    {!isDemoMode && !isLoggedIn
                      ? "Sign In to Trade"
                      : `${side.toUpperCase()} ${asset?.symbol || ""}`}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Switch to Real confirmation */}
      <AlertDialog
        open={showSwitchToRealDialog}
        onOpenChange={setShowSwitchToRealDialog}
      >
        <AlertDialogContent
          data-ocid="trade.switch_to_real.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Real Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                You are about to switch to a Real account. Please be aware:
              </span>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>All trades will use real funds</li>
                <li>Losses are permanent and cannot be reversed</li>
                <li>Ensure you understand the risks before trading</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="trade.switch_to_real.cancel_button">
              Stay in Demo
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="trade.switch_to_real.confirm_button"
              onClick={confirmSwitchToReal}
              className="bg-profit hover:bg-profit/90 text-background"
            >
              Yes, Switch to Real
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch to Demo confirmation */}
      <AlertDialog
        open={showSwitchToDemoDialog}
        onOpenChange={setShowSwitchToDemoDialog}
      >
        <AlertDialogContent
          data-ocid="trade.switch_to_demo.dialog"
          className="bg-card border-border"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Demo Account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be switched to Demo mode. All trades will use simulated
              funds with no real money at risk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="trade.switch_to_demo.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="trade.switch_to_demo.confirm_button"
              onClick={confirmSwitchToDemo}
              style={{ background: "oklch(0.40 0.18 300)", color: "white" }}
            >
              Switch to Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
