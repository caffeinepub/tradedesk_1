import { TradeModal } from "@/components/TradeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useAllAssets, usePortfolioAssets } from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import { Briefcase, Radio, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Asset } from "../backend.d";

export function Portfolio() {
  const { data: portfolio, isLoading } = usePortfolioAssets();
  const { data: allAssets } = useAllAssets();
  const { data: livePrices, isLive } = useLivePrices();
  const [tradeAsset, setTradeAsset] = useState<Asset | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const openSell = (symbol: string) => {
    const asset = allAssets?.find((a) => a.symbol === symbol);
    if (asset) {
      setTradeAsset(asset);
      setTradeOpen(true);
    }
  };

  const totalValue = portfolio?.reduce((sum, a) => sum + a.totalValue, 0) ?? 0;

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-5"
      data-ocid="portfolio.page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Portfolio
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
              Your current positions
              {isLive && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                  <Radio className="w-2 h-2 animate-pulse" />
                  LIVE
                </span>
              )}
            </p>
          </div>
          {!isLoading && portfolio && portfolio.length > 0 && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-0.5">
                Total Value
              </div>
              <div className="font-mono text-xl font-bold text-primary">
                {formatCurrency(totalValue)}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="glow-card rounded-lg border border-border overflow-hidden"
        data-ocid="portfolio.table"
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
          {["Asset", "Quantity", "Current Price", "Total Value", "Action"].map(
            (h) => (
              <div
                key={h}
                className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
              >
                {h}
              </div>
            ),
          )}
        </div>

        {isLoading ? (
          <div
            className="divide-y divide-border"
            data-ocid="portfolio.loading_state"
          >
            {["sk1", "sk2", "sk3", "sk4"].map((k) => (
              <div
                key={k}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3"
              >
                {["a", "b", "c", "d", "e"].map((j) => (
                  <Skeleton key={j} className="h-5 w-full bg-muted/50" />
                ))}
              </div>
            ))}
          </div>
        ) : !portfolio || portfolio.length === 0 ? (
          <div
            className="text-center py-16 space-y-3"
            data-ocid="portfolio.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted/40 border border-border flex items-center justify-center mx-auto">
              <Briefcase className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              No open positions
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Head to <span className="text-primary">Markets</span> to start
              trading
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {portfolio.map((asset, i) => {
              const assetData = allAssets?.find(
                (a) => a.symbol === asset.symbol,
              );
              const liveData = livePrices[asset.symbol];
              const displayPrice = liveData?.price ?? asset.currentPrice;
              const change = liveData?.change24h ?? assetData?.change24h ?? 0;
              const liveTotal = displayPrice * asset.quantity;
              const isPos = change >= 0;

              return (
                <motion.div
                  key={asset.symbol}
                  data-ocid={`portfolio.item.${i + 1}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-accent/30 transition-colors"
                >
                  {/* Asset */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-mono font-bold text-primary shrink-0">
                      {asset.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold flex items-center gap-1">
                        {asset.symbol}
                        {liveData && (
                          <span className="text-[8px] font-mono text-[oklch(0.72_0.18_145)] leading-none">
                            ●
                          </span>
                        )}
                      </div>
                      {(assetData || liveData) && (
                        <div
                          className={`text-[11px] font-mono flex items-center gap-0.5 ${isPos ? "price-positive" : "price-negative"}`}
                        >
                          {isPos ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          {formatChange(change)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <span className="font-mono text-sm text-foreground">
                    {asset.quantity.toFixed(4)}
                  </span>

                  {/* Current Price */}
                  <span className="font-mono text-sm text-foreground">
                    {formatCurrency(displayPrice)}
                  </span>

                  {/* Total Value */}
                  <span className="font-mono text-sm font-semibold text-primary">
                    {formatCurrency(liveData ? liveTotal : asset.totalValue)}
                  </span>

                  {/* Action */}
                  <Button
                    data-ocid={`portfolio.sell_button.${i + 1}`}
                    size="sm"
                    onClick={() => openSell(asset.symbol)}
                    className="h-7 px-3 text-xs font-mono font-semibold bg-sell/20 hover:bg-sell/30 text-loss border border-loss/30 hover:border-loss/50"
                    variant="outline"
                  >
                    Sell
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <TradeModal
        asset={tradeAsset}
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        defaultSide="sell"
      />
    </div>
  );
}
