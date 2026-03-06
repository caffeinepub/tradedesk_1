import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useLivePrices } from "@/hooks/useLivePrices";
import { useTrades } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { TradeType } from "../backend.d";

export function PnLTicker() {
  const { accountMode } = useAccountMode();
  const isDemoMode = accountMode === "demo";

  const { demoTrades } = useDemoAccount();
  const { data: realTradesRaw } = useTrades();
  const { data: livePrices } = useLivePrices();

  // Normalise both trade shapes
  type NormalTrade = {
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    pricePerUnit: number;
  };

  const trades: NormalTrade[] = isDemoMode
    ? demoTrades.map((t) => ({
        symbol: t.symbol,
        side: t.tradeType,
        quantity: t.quantity,
        pricePerUnit: t.pricePerUnit,
      }))
    : (realTradesRaw ?? []).map((t) => ({
        symbol: t.symbol,
        side: t.tradeType === TradeType.buy ? "buy" : "sell",
        quantity: t.quantity,
        pricePerUnit: t.pricePerUnit,
      }));

  // Calculate unrealised P&L across all open buy positions with live prices
  const buyTrades = trades.filter(
    (t) => t.side === "buy" && livePrices[t.symbol]?.price !== undefined,
  );

  const hasPnlData = buyTrades.length > 0;

  const totalPnl = buyTrades.reduce((sum, t) => {
    const lp = livePrices[t.symbol]!.price;
    return sum + (lp - t.pricePerUnit) * t.quantity;
  }, 0);

  const totalCost = buyTrades.reduce((sum, t) => {
    return sum + t.pricePerUnit * t.quantity;
  }, 0);

  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Detect P&L changes to trigger the pulse animation
  const prevPnlRef = useRef<number | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [flashDirection, setFlashDirection] = useState<"up" | "down" | null>(
    null,
  );

  useEffect(() => {
    if (!hasPnlData) {
      prevPnlRef.current = null;
      return;
    }
    const prev = prevPnlRef.current;
    if (prev !== null && Math.abs(totalPnl - prev) > 0.001) {
      setFlashDirection(totalPnl > prev ? "up" : "down");
      setFlashKey((k) => k + 1);
    }
    prevPnlRef.current = totalPnl;
  }, [totalPnl, hasPnlData]);

  const isPositive = totalPnl > 0;
  const isNegative = totalPnl < 0;

  function handleTickerClick() {
    window.dispatchEvent(new Event("vertex:open-orders-buy"));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-4 left-72 z-50 hidden md:flex"
      data-ocid="pnl_ticker.panel"
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild data-ocid="pnl_ticker.tooltip">
            <button
              type="button"
              onClick={handleTickerClick}
              data-ocid="pnl_ticker.button"
              className={`
          flex items-center gap-2.5 px-3.5 py-2 rounded-full border shadow-lg
          backdrop-blur-sm font-mono text-xs select-none
          transition-colors duration-300 cursor-pointer
          ${
            hasPnlData
              ? isPositive
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/80 hover:border-emerald-400/50"
                : isNegative
                  ? "bg-red-950/80 border-red-500/30 text-red-300 hover:bg-red-900/80 hover:border-red-400/50"
                  : "bg-card/80 border-border text-muted-foreground hover:bg-muted/80"
              : "bg-card/80 border-border text-muted-foreground hover:bg-muted/80"
          }
        `}
            >
              {/* Live dot */}
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                    hasPnlData
                      ? isPositive
                        ? "bg-emerald-400"
                        : isNegative
                          ? "bg-red-400"
                          : "bg-muted-foreground"
                      : "bg-muted-foreground"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    hasPnlData
                      ? isPositive
                        ? "bg-emerald-400"
                        : isNegative
                          ? "bg-red-400"
                          : "bg-muted-foreground"
                      : "bg-muted-foreground"
                  }`}
                />
              </span>

              {/* Label */}
              <span
                className={`font-semibold tracking-wider text-[10px] uppercase ${
                  hasPnlData && (isPositive || isNegative)
                    ? "opacity-70"
                    : "opacity-50"
                }`}
              >
                Unrealised P&amp;L
              </span>

              {/* Separator */}
              <span className="opacity-30">|</span>

              {/* P&L value */}
              {hasPnlData ? (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={flashKey}
                    initial={
                      flashDirection === "up"
                        ? { opacity: 0.5, y: -4 }
                        : flashDirection === "down"
                          ? { opacity: 0.5, y: 4 }
                          : { opacity: 1, y: 0 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center gap-1.5"
                    data-ocid="pnl_ticker.pnl_value"
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3 flex-shrink-0" />
                    ) : null}
                    <span className="font-bold tracking-tight">
                      {isPositive
                        ? `+${formatCurrency(totalPnl)}`
                        : formatCurrency(totalPnl)}
                    </span>
                    <span className="opacity-70 text-[10px]">
                      {isPositive
                        ? `+${totalPnlPct.toFixed(2)}%`
                        : `${totalPnlPct.toFixed(2)}%`}
                    </span>
                  </motion.span>
                </AnimatePresence>
              ) : (
                <span
                  className="opacity-40 text-[10px]"
                  data-ocid="pnl_ticker.pnl_value"
                >
                  No open positions
                </span>
              )}

              {/* Separator */}
              <span className="opacity-30">|</span>

              {/* Account mode badge */}
              <span
                className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${
                  isDemoMode
                    ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
                {isDemoMode ? "DEMO" : "REAL"}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="text-xs font-medium"
          >
            Click to view open positions
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
