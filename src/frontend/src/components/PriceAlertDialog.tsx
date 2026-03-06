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
import { Textarea } from "@/components/ui/textarea";
import type { AlertDirection } from "@/context/PriceAlertsContext";
import { usePriceAlertsContext } from "@/context/PriceAlertsContext";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useAllAssets } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { Bell, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PriceAlertDialogProps {
  open: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  defaultPrice?: number;
  defaultAssetName?: string;
}

export function PriceAlertDialog({
  open,
  onClose,
  defaultSymbol = "",
  defaultPrice,
  defaultAssetName = "",
}: PriceAlertDialogProps) {
  const { addAlert } = usePriceAlertsContext();
  const { data: livePrices } = useLivePrices();
  const { data: assets } = useAllAssets();

  const [symbol, setSymbol] = useState(defaultSymbol.toUpperCase());
  const [assetName, setAssetName] = useState(defaultAssetName);
  const [targetPrice, setTargetPrice] = useState(
    defaultPrice ? String(defaultPrice.toFixed(2)) : "",
  );
  const [direction, setDirection] = useState<AlertDirection>("above");
  const [note, setNote] = useState("");

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      const sym = defaultSymbol.toUpperCase();
      setSymbol(sym);
      setAssetName(defaultAssetName);
      const price = defaultPrice ?? livePrices[sym]?.price;
      setTargetPrice(price ? String(price.toFixed(2)) : "");
      setDirection("above");
      setNote("");
    }
  }, [open, defaultSymbol, defaultAssetName, defaultPrice, livePrices]);

  // Resolve current price from live prices or assets
  const resolveCurrentPrice = () => {
    const sym = symbol.toUpperCase();
    return (
      livePrices[sym]?.price ??
      assets?.find((a) => a.symbol === sym)?.price ??
      null
    );
  };

  const currentPrice = resolveCurrentPrice();

  // Auto-select direction when target price changes relative to current price
  const handleTargetChange = (val: string) => {
    setTargetPrice(val);
    const numVal = Number.parseFloat(val);
    if (!Number.isNaN(numVal) && currentPrice !== null) {
      setDirection(numVal >= currentPrice ? "above" : "below");
    }
  };

  // Resolve asset name if not provided
  const handleSymbolChange = (val: string) => {
    const sym = val.toUpperCase();
    setSymbol(sym);
    if (!defaultAssetName) {
      const found = assets?.find((a) => a.symbol === sym);
      if (found) setAssetName(found.name);
    }
  };

  const handleSubmit = () => {
    const sym = symbol.trim().toUpperCase();
    const price = Number.parseFloat(targetPrice);

    if (!sym) {
      toast.error("Please enter an asset symbol");
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }

    const resolvedName =
      assetName || assets?.find((a) => a.symbol === sym)?.name || sym;

    addAlert({
      symbol: sym,
      assetName: resolvedName,
      targetPrice: price,
      direction,
      note: note.trim() || undefined,
    });

    toast.success(`Alert set for ${sym} at ${formatCurrency(price)}`);
    onClose();
  };

  const targetNum = Number.parseFloat(targetPrice);
  const hasValidTarget = !Number.isNaN(targetNum) && targetNum > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-card border-border"
        data-ocid="alerts.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <div className="w-7 h-7 rounded bg-[oklch(0.22_0.07_55)] border border-[oklch(0.40_0.12_55)] flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-[oklch(0.82_0.18_55)]" />
            </div>
            Set Price Alert
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Get notified when an asset reaches your target price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Symbol */}
          {defaultSymbol ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Asset
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {symbol}
                  </span>
                  {assetName && (
                    <span className="text-xs text-muted-foreground">
                      — {assetName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label
                htmlFor="alert-symbol"
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block"
              >
                Symbol
              </Label>
              <Input
                id="alert-symbol"
                data-ocid="alerts.symbol.input"
                placeholder="BTC, ETH, AAPL..."
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="font-mono uppercase bg-secondary border-border focus-visible:ring-primary"
              />
            </div>
          )}

          {/* Target Price */}
          <div>
            <Label
              htmlFor="alert-target"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block"
            >
              Target Price (USD)
            </Label>
            <Input
              id="alert-target"
              data-ocid="alerts.target_price.input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={targetPrice}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="font-mono bg-secondary border-border focus-visible:ring-primary"
            />
            {currentPrice !== null && (
              <p className="text-[10px] text-muted-foreground font-mono mt-1.5">
                Current:{" "}
                <span className="text-foreground font-semibold">
                  {formatCurrency(currentPrice)}
                </span>
              </p>
            )}
          </div>

          {/* Direction */}
          <div>
            <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
              Alert Direction
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-ocid="alerts.direction_above.toggle"
                onClick={() => setDirection("above")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-sm font-mono font-semibold transition-all duration-150 ${
                  direction === "above"
                    ? "bg-[oklch(0.18_0.08_145)] border-[oklch(0.40_0.14_145)] text-[oklch(0.80_0.18_145)]"
                    : "bg-secondary border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Above
              </button>
              <button
                type="button"
                data-ocid="alerts.direction_below.toggle"
                onClick={() => setDirection("below")}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border text-sm font-mono font-semibold transition-all duration-150 ${
                  direction === "below"
                    ? "bg-[oklch(0.18_0.08_25)] border-[oklch(0.40_0.14_25)] text-[oklch(0.78_0.18_25)]"
                    : "bg-secondary border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Below
              </button>
            </div>
          </div>

          {/* Preview */}
          {hasValidTarget && symbol && (
            <div className="px-3 py-2 rounded-md bg-[oklch(0.16_0.05_55_/_0.4)] border border-[oklch(0.36_0.10_55_/_0.5)]">
              <p className="text-xs font-mono text-[oklch(0.82_0.14_55)]">
                🔔 Alert when <span className="font-bold">{symbol}</span> price
                goes{" "}
                <span
                  className={
                    direction === "above"
                      ? "text-[oklch(0.80_0.18_145)]"
                      : "text-[oklch(0.78_0.18_25)]"
                  }
                >
                  {direction === "above" ? "↑ above" : "↓ below"}
                </span>{" "}
                <span className="font-bold">{formatCurrency(targetNum)}</span>
              </p>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <Label
              htmlFor="alert-note"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block"
            >
              Note (optional)
            </Label>
            <Textarea
              id="alert-note"
              data-ocid="alerts.note.textarea"
              placeholder="E.g. Buy signal, take profit level..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="font-mono text-sm bg-secondary border-border focus-visible:ring-primary resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="alerts.cancel_button"
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            data-ocid="alerts.submit_button"
            disabled={!symbol || !hasValidTarget}
            className="bg-[oklch(0.22_0.07_55)] hover:bg-[oklch(0.26_0.09_55)] text-[oklch(0.90_0.16_55)] border border-[oklch(0.42_0.12_55)] font-mono font-semibold"
          >
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            Set Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
