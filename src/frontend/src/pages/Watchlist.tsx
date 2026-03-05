import { TradeModal } from "@/components/TradeModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useLivePrices } from "@/hooks/useLivePrices";
import {
  useAllAssets,
  useRemoveFromWatchlist,
  useWatchlist,
} from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import {
  ArrowDownRight,
  ArrowUpRight,
  Radio,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Asset } from "../backend.d";

export function Watchlist() {
  const { data: watchlist, isLoading: watchlistLoading } = useWatchlist();
  const { data: allAssets, isLoading: assetsLoading } = useAllAssets();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { identity } = useInternetIdentity();

  const [tradeAsset, setTradeAsset] = useState<Asset | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const isLoading = watchlistLoading || assetsLoading;
  const { data: livePrices, isLive } = useLivePrices();

  const watchlistAssets = watchlist
    ?.map((sym) => allAssets?.find((a) => a.symbol === sym))
    .filter(Boolean) as Asset[] | undefined;

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist.mutateAsync(symbol);
      toast.success(`Removed ${symbol} from watchlist`);
    } catch {
      toast.error("Failed to remove from watchlist");
    }
  };

  const openTrade = (asset: Asset) => {
    if (!identity) {
      toast.error("Please sign in to trade");
      return;
    }
    setTradeAsset(asset);
    setTradeOpen(true);
  };

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-5"
      data-ocid="watchlist.page"
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
              Watchlist
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
              Track your favorite assets
              {isLive && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                  <Radio className="w-2 h-2 animate-pulse" />
                  LIVE
                </span>
              )}
            </p>
          </div>
          {!isLoading && watchlistAssets && watchlistAssets.length > 0 && (
            <div className="text-xs text-muted-foreground font-mono bg-muted/40 border border-border px-3 py-1.5 rounded-md">
              {watchlistAssets.length} watching
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          data-ocid="watchlist.loading_state"
        >
          {["sk1", "sk2", "sk3", "sk4"].map((k) => (
            <Skeleton key={k} className="h-28 bg-muted/50 rounded-lg" />
          ))}
        </div>
      ) : !watchlistAssets || watchlistAssets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 space-y-4"
          data-ocid="watchlist.empty_state"
        >
          <div className="w-16 h-16 rounded-full bg-muted/40 border border-border flex items-center justify-center">
            <Star className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Your watchlist is empty
          </p>
          <p className="text-muted-foreground/60 text-xs text-center max-w-48">
            Go to <span className="text-primary">Markets</span> and star assets
            you want to track
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {watchlistAssets.map((asset, i) => {
              const liveData = livePrices[asset.symbol];
              const displayPrice = liveData?.price ?? asset.price;
              const displayChange = liveData?.change24h ?? asset.change24h;
              const isPos = displayChange >= 0;
              return (
                <motion.div
                  key={asset.symbol}
                  data-ocid={`watchlist.item.${i + 1}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="glow-card rounded-lg border border-border bg-card p-4 space-y-3 relative overflow-hidden"
                >
                  {/* Background accent */}
                  <div
                    className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 ${
                      isPos ? "bg-profit" : "bg-loss"
                    }`}
                  />

                  {/* Top row */}
                  <div className="flex items-start justify-between relative">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary shrink-0">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-foreground flex items-center gap-1.5">
                          {asset.symbol}
                          {liveData && (
                            <span className="text-[8px] font-mono text-[oklch(0.72_0.18_145)] leading-none animate-pulse">
                              ●
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-28">
                          {asset.name}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${
                        isPos ? "price-positive" : "price-negative"
                      }`}
                    >
                      {isPos ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatChange(displayChange)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="relative">
                    <div className="font-mono text-xl font-bold text-foreground">
                      {formatCurrency(displayPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      Current price
                      {liveData && (
                        <span className="text-[oklch(0.72_0.18_145)]">
                          · live
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 relative">
                    <Button
                      data-ocid={`watchlist.trade_button.${i + 1}`}
                      size="sm"
                      onClick={() => openTrade(asset)}
                      className="flex-1 h-7 text-xs font-mono font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                      variant="outline"
                    >
                      Trade
                    </Button>
                    <Button
                      data-ocid={`watchlist.remove_button.${i + 1}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(asset.symbol)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <TradeModal
        asset={tradeAsset}
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
      />
    </div>
  );
}
