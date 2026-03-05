import { TradeModal } from "@/components/TradeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useLivePrices } from "@/hooks/useLivePrices";
import {
  useAddToWatchlist,
  useAllAssets,
  useRemoveFromWatchlist,
  useWatchlist,
} from "@/hooks/useQueries";
import { formatChange, formatCurrency } from "@/utils/format";
import {
  ArrowDownRight,
  ArrowUpRight,
  Radio,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Asset } from "../backend.d";
import { Category } from "../backend.d";

type CategoryFilter = "all" | Category;

const CATEGORY_TABS: { label: string; value: CategoryFilter }[] = [
  { label: "All", value: "all" },
  { label: "Crypto", value: Category.crypto },
  { label: "Metals", value: Category.metal },
  { label: "Indices", value: Category.index },
  { label: "Stocks", value: Category.stock },
];

function getCategoryBadge(category: Category) {
  switch (category) {
    case Category.crypto:
      return {
        label: "Crypto",
        className:
          "bg-[oklch(0.25_0.05_220)] text-[oklch(0.78_0.16_220)] border-[oklch(0.38_0.08_220)] border",
      };
    case Category.metal:
      return {
        label: "Metal",
        className:
          "bg-[oklch(0.25_0.05_70)] text-[oklch(0.80_0.14_70)] border-[oklch(0.40_0.09_70)] border",
      };
    case Category.index:
      return {
        label: "Index",
        className:
          "bg-[oklch(0.22_0.05_300)] text-[oklch(0.75_0.14_300)] border-[oklch(0.36_0.08_300)] border",
      };
    case Category.stock:
      return {
        label: "Stock",
        className:
          "bg-[oklch(0.22_0.06_165)] text-[oklch(0.72_0.15_165)] border-[oklch(0.36_0.09_165)] border",
      };
  }
}

function getCategoryIcon(category: Category) {
  switch (category) {
    case Category.crypto:
      return "bg-[oklch(0.25_0.05_220)] border-[oklch(0.38_0.08_220)] text-[oklch(0.78_0.16_220)]";
    case Category.metal:
      return "bg-[oklch(0.25_0.05_70)] border-[oklch(0.40_0.09_70)] text-[oklch(0.80_0.14_70)]";
    case Category.index:
      return "bg-[oklch(0.22_0.05_300)] border-[oklch(0.36_0.08_300)] text-[oklch(0.75_0.14_300)]";
    case Category.stock:
      return "bg-[oklch(0.22_0.06_165)] border-[oklch(0.36_0.09_165)] text-[oklch(0.72_0.15_165)]";
  }
}

export function Markets() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [tradeAsset, setTradeAsset] = useState<Asset | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const { data: assets, isLoading } = useAllAssets();
  const { data: watchlist } = useWatchlist();
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();
  const { identity } = useInternetIdentity();
  const { data: livePrices, isLive } = useLivePrices();

  const filtered =
    assets?.filter((a) => {
      const matchesSearch =
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || a.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }) ?? [];

  const isWatched = (symbol: string) => watchlist?.includes(symbol) ?? false;

  const handleWatchlistToggle = async (asset: Asset) => {
    if (!identity) {
      toast.error("Please sign in to manage your watchlist");
      return;
    }
    try {
      if (isWatched(asset.symbol)) {
        await removeFromWatchlist.mutateAsync(asset.symbol);
        toast.success(`Removed ${asset.symbol} from watchlist`);
      } else {
        await addToWatchlist.mutateAsync(asset.symbol);
        toast.success(`Added ${asset.symbol} to watchlist`);
      }
    } catch {
      toast.error("Failed to update watchlist");
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
    <TooltipProvider>
      <div
        className="flex-1 overflow-auto p-6 space-y-5"
        data-ocid="markets.page"
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
                Markets
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
                {isLive ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      LIVE
                    </span>
                    <span>
                      Live prices via TradingView · refreshes every 30s
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.25_0.06_70)] text-[oklch(0.80_0.14_70)] border border-[oklch(0.40_0.09_70)]">
                      SIM
                    </span>
                    <span>Simulated prices · refreshes every 10s</span>
                  </>
                )}
              </p>
            </div>
            {assets && (
              <div className="text-xs text-muted-foreground font-mono bg-muted/40 border border-border px-3 py-1.5 rounded-md">
                {filtered.length} assets
              </div>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="markets.search_input"
            placeholder="Search assets by symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border font-mono placeholder:text-muted-foreground/50 focus-visible:ring-primary"
          />
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.09 }}
          className="flex items-center gap-1.5 flex-wrap"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = categoryFilter === tab.value;
            const count =
              tab.value === "all"
                ? (assets?.length ?? 0)
                : (assets?.filter((a) => a.category === tab.value).length ?? 0);
            return (
              <button
                key={tab.value}
                type="button"
                data-ocid="markets.category_tab"
                onClick={() => setCategoryFilter(tab.value)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all duration-150
                  ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground"
                  }
                `}
              >
                {tab.label}
                {assets && (
                  <span
                    className={`text-[10px] px-1 py-0.5 rounded ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground/70"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glow-card rounded-lg border border-border overflow-hidden"
          data-ocid="markets.table"
        >
          {/* Table Header */}
          <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
            {[
              "Symbol",
              "Name",
              "Category",
              "Price",
              "24h Change",
              "Actions",
            ].map((h) => (
              <div
                key={h}
                className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {isLoading ? (
            <div
              className="divide-y divide-border"
              data-ocid="markets.loading_state"
            >
              {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
                <div
                  key={k}
                  className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3"
                >
                  <Skeleton className="h-5 w-14 bg-muted/50" />
                  <Skeleton className="h-5 w-32 bg-muted/50" />
                  <Skeleton className="h-5 w-16 bg-muted/50" />
                  <Skeleton className="h-5 w-20 bg-muted/50" />
                  <Skeleton className="h-5 w-16 bg-muted/50" />
                  <Skeleton className="h-7 w-20 bg-muted/50" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground font-mono text-sm"
              data-ocid="markets.empty_state"
            >
              {search
                ? `No assets found matching "${search}"`
                : `No ${categoryFilter === "all" ? "" : categoryFilter} assets available`}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((asset, i) => {
                const liveData = livePrices[asset.symbol];
                const displayPrice = liveData?.price ?? asset.price;
                const displayChange = liveData?.change24h ?? asset.change24h;
                const isPos = displayChange >= 0;
                const isIndex = asset.category === Category.index;
                const badge = getCategoryBadge(asset.category);
                const iconClass = getCategoryIcon(asset.category);
                return (
                  <motion.div
                    key={asset.symbol}
                    data-ocid={`markets.row.item.${i + 1}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.25 }}
                    className="grid grid-cols-[1.2fr_2fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-accent/30 transition-colors group"
                  >
                    {/* Symbol */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${iconClass}`}
                      >
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {asset.symbol}
                        </span>
                        {liveData && (
                          <span className="text-[9px] font-mono text-[oklch(0.72_0.18_145)] leading-none">
                            live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <span className="text-sm text-muted-foreground truncate">
                      {asset.name}
                    </span>

                    {/* Category Badge */}
                    <div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Price */}
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(displayPrice)}
                    </span>

                    {/* 24h Change */}
                    <div
                      className={`flex items-center gap-1 font-mono text-sm font-semibold ${
                        isPos ? "price-positive" : "price-negative"
                      }`}
                    >
                      {isPos ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {formatChange(displayChange)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        data-ocid={`markets.watchlist_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          isWatched(asset.symbol)
                            ? "text-chart-4 hover:text-muted-foreground"
                            : "text-muted-foreground hover:text-chart-4"
                        }`}
                        onClick={() => handleWatchlistToggle(asset)}
                        title={
                          isWatched(asset.symbol)
                            ? "Remove from watchlist"
                            : "Add to watchlist"
                        }
                      >
                        {isWatched(asset.symbol) ? (
                          <Star className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      {isIndex ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button
                                data-ocid={`markets.trade_button.${i + 1}`}
                                size="sm"
                                disabled
                                className="h-7 px-3 text-xs font-mono font-semibold opacity-35 cursor-not-allowed"
                                variant="outline"
                              >
                                Index
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="text-xs font-mono"
                          >
                            Indices are view-only and cannot be traded
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          data-ocid={`markets.trade_button.${i + 1}`}
                          size="sm"
                          onClick={() => openTrade(asset)}
                          className="h-7 px-3 text-xs font-mono font-semibold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50"
                          variant="outline"
                        >
                          Trade
                        </Button>
                      )}
                    </div>
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
        />
      </div>
    </TooltipProvider>
  );
}
