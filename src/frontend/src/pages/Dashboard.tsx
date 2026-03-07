import { TradeModal } from "@/components/TradeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAlpacaAccount } from "@/hooks/useAlpacaAccount";
import { useLivePrices } from "@/hooks/useLivePrices";
import {
  useAllAssets,
  useBalance,
  usePortfolioAssets,
  useTrades,
  useWatchlist,
} from "@/hooks/useQueries";
import { formatChange, formatCurrency, formatTimestamp } from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  Radio,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useState } from "react";
import type { Asset } from "../backend.d";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function Dashboard() {
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioAssets();
  const { data: trades, isLoading: tradesLoading } = useTrades();
  const { data: watchlist } = useWatchlist();
  const { data: allAssets } = useAllAssets();
  const { data: livePrices, isLive } = useLivePrices();
  const { accountMode } = useAccountMode();
  const isRealAccount = accountMode === "real";
  const {
    data: alpacaAccount,
    isLoading: alpacaLoading,
    isError: alpacaError,
  } = useAlpacaAccount();

  const [tradeAsset, setTradeAsset] = useState<Asset | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  const totalPortfolioValue =
    portfolio?.reduce((sum, a) => sum + a.totalValue, 0) ?? 0;
  const holdingsCount = portfolio?.length ?? 0;
  const recentTrades = trades?.slice(-5).reverse() ?? [];

  const watchlistAssets = watchlist
    ?.map((sym) => allAssets?.find((a) => a.symbol === sym))
    .filter(Boolean) as Asset[] | undefined;

  const openTrade = (asset: Asset) => {
    setTradeAsset(asset);
    setTradeOpen(true);
  };

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-6"
      data-ocid="dashboard.page"
    >
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
          Portfolio overview &amp; market snapshot
          {isLive && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.36_0.12_145)]">
              <Radio className="w-2 h-2 animate-pulse" />
              LIVE
            </span>
          )}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Available Balance",
            icon: DollarSign,
            value: balanceLoading ? null : formatCurrency(balance ?? 0),
            sub: "Buying power",
            color: "text-primary",
          },
          {
            label: "Portfolio Value",
            icon: Briefcase,
            value: portfolioLoading
              ? null
              : formatCurrency(totalPortfolioValue),
            sub: `${holdingsCount} position${holdingsCount !== 1 ? "s" : ""}`,
            color: "text-chart-1",
          },
          {
            label: "Total Assets",
            icon: TrendingUp,
            value:
              portfolioLoading || balanceLoading
                ? null
                : formatCurrency((balance ?? 0) + totalPortfolioValue),
            sub: "Balance + portfolio",
            color: "text-chart-2",
          },
          {
            label: "Holdings",
            icon: Star,
            value: portfolioLoading ? null : holdingsCount.toString(),
            sub: "Open positions",
            color: "text-chart-4",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i + 1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <Card className="glow-card bg-card border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-2xl bg-primary" />
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {stat.value === null ? (
                    <Skeleton
                      className="h-7 w-32 bg-muted/50"
                      data-ocid="dashboard.loading_state"
                    />
                  ) : (
                    <div
                      className={`font-mono text-xl font-bold ${stat.color}`}
                    >
                      {stat.value}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.sub}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alpaca Account Card — only visible in Real mode */}
      {isRealAccount && (
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="glow-card bg-card border-border overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2
                  className="w-4 h-4"
                  style={{ color: "oklch(0.72 0.18 145)" }}
                />
                Alpaca Live Account
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                  style={{
                    background: "oklch(0.14 0.06 145 / 0.80)",
                    border: "1px solid oklch(0.38 0.14 145 / 0.60)",
                    color: "oklch(0.75 0.18 145)",
                  }}
                  data-ocid="dashboard.alpaca_live_badge"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "oklch(0.72 0.18 145)" }}
                  />
                  ALPACA LIVE
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alpacaLoading ? (
                <div
                  className="grid grid-cols-3 gap-4"
                  data-ocid="dashboard.alpaca.loading_state"
                >
                  {["a", "b", "c"].map((k) => (
                    <div key={k} className="space-y-1">
                      <Skeleton className="h-3 w-20 bg-muted/50" />
                      <Skeleton className="h-6 w-28 bg-muted/50" />
                    </div>
                  ))}
                </div>
              ) : alpacaError || !alpacaAccount ? (
                <div
                  data-ocid="dashboard.alpaca.error_state"
                  className="flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs font-mono font-semibold text-red-400">
                      Connection Failed
                    </p>
                    <p className="text-[11px] font-mono text-red-300/70">
                      Check API keys or network. Alpaca may be unavailable.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                      Portfolio Value
                    </div>
                    <div
                      className="font-mono text-lg font-bold"
                      style={{ color: "oklch(0.75 0.18 145)" }}
                    >
                      {formatCurrency(
                        Number.parseFloat(alpacaAccount.portfolio_value),
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                      Buying Power
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground">
                      {formatCurrency(
                        Number.parseFloat(alpacaAccount.buying_power),
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                      Cash
                    </div>
                    <div className="font-mono text-lg font-bold text-foreground">
                      {formatCurrency(Number.parseFloat(alpacaAccount.cash))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Watchlist Preview */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="glow-card bg-card border-border h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-chart-4" />
                Watchlist
              </CardTitle>
              <Link to="/watchlist">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1 h-7"
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {!watchlistAssets || watchlistAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                  No assets in watchlist
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {watchlistAssets.slice(0, 5).map((asset) => {
                    const liveData = livePrices[asset.symbol];
                    const displayPrice = liveData?.price ?? asset.price;
                    const displayChange =
                      liveData?.change24h ?? asset.change24h;
                    return (
                      <button
                        type="button"
                        key={asset.symbol}
                        onClick={() => openTrade(asset)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                            {asset.symbol.slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-semibold font-mono flex items-center gap-1.5">
                              {asset.symbol}
                              {liveData && (
                                <span className="text-[8px] font-mono text-[oklch(0.72_0.18_145)] leading-none">
                                  ●
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-semibold">
                            {formatCurrency(displayPrice)}
                          </div>
                          <div
                            className={`text-xs font-mono flex items-center justify-end gap-0.5 ${
                              displayChange >= 0
                                ? "price-positive"
                                : "price-negative"
                            }`}
                          >
                            {displayChange >= 0 ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {formatChange(displayChange)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Trades */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="glow-card bg-card border-border h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-chart-5" />
                Recent Trades
              </CardTitle>
              <Link to="/history">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1 h-7"
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {tradesLoading ? (
                <div
                  className="space-y-2 p-4"
                  data-ocid="dashboard.loading_state"
                >
                  {["sk1", "sk2", "sk3"].map((k) => (
                    <Skeleton key={k} className="h-10 bg-muted/50" />
                  ))}
                </div>
              ) : recentTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                  No trades yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTrades.map((trade, idx) => (
                    <div
                      key={`${trade.symbol}-${String(trade.timestamp)}-${idx}`}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            trade.tradeType === "buy"
                              ? "bg-profit-muted text-profit border-profit/30"
                              : "bg-loss-muted text-loss border-loss/30"
                          }`}
                          variant="outline"
                        >
                          {trade.tradeType.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="text-sm font-semibold font-mono">
                            {trade.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {formatTimestamp(trade.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">
                          {formatCurrency(trade.total)}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {trade.quantity} ×{" "}
                          {formatCurrency(trade.pricePerUnit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <TradeModal
        asset={tradeAsset}
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
      />
    </div>
  );
}
