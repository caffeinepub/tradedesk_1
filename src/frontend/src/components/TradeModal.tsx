import { TradingViewChart } from "@/components/TradingViewChart";
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
import { useLivePrices } from "@/hooks/useLivePrices";
import { useBuy, useSell } from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
  const buy = useBuy();
  const sell = useSell();
  const { data: livePrices } = useLivePrices();

  const isPending = buy.isPending || sell.isPending;
  const qty = Number.parseFloat(quantity) || 0;

  // Overlay live price if available, otherwise fall back to backend price
  const liveData = asset ? livePrices[asset.symbol] : null;
  const displayPrice = liveData?.price ?? asset?.price ?? 0;
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
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Trade failed", { description: msg });
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setQuantity("");
      onClose();
    }
  };

  return (
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
            {/* Chart toggle button */}
            {asset && (
              <Button
                data-ocid="trade.chart_toggle"
                variant="ghost"
                size="sm"
                onClick={() => setShowChart((v) => !v)}
                className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
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
        </DialogHeader>

        {/* TradingView Chart */}
        {showChart && asset && (
          <div className="mt-1 mb-1" data-ocid="trade.chart_panel">
            <TradingViewChart symbol={asset.symbol} height={300} />
          </div>
        )}

        {/* Buy/Sell Toggle */}
        <div className="flex rounded-md overflow-hidden border border-border mt-2">
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
            onClick={handleSubmit}
            disabled={isPending || qty <= 0}
            className={`flex-1 font-mono font-semibold ${
              side === "buy"
                ? "bg-profit hover:bg-profit/90 text-background"
                : "bg-sell hover:bg-sell/90 text-background"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `${side.toUpperCase()} ${asset?.symbol || ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
