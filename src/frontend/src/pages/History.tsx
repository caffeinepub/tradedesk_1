import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountMode } from "@/context/AccountModeContext";
import { useAlpacaOrders } from "@/hooks/useAlpacaOrders";
import { useTrades } from "@/hooks/useQueries";
import { formatCurrency, formatTimestamp } from "@/utils/format";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  History as HistoryIcon,
} from "lucide-react";
import { motion } from "motion/react";

export function History() {
  const { data: trades, isLoading } = useTrades();
  const { accountMode } = useAccountMode();
  const isRealAccount = accountMode === "real";
  const {
    data: alpacaOrders,
    isLoading: alpacaLoading,
    isError: alpacaError,
  } = useAlpacaOrders();
  const sorted = trades ? [...trades].reverse() : [];

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-5"
      data-ocid="history.page"
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
              Trade History
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              All executed trades in order
            </p>
          </div>
          {!isLoading && sorted.length > 0 && (
            <div className="text-xs text-muted-foreground font-mono bg-muted/40 border border-border px-3 py-1.5 rounded-md">
              {sorted.length} trade{sorted.length !== 1 ? "s" : ""}
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
        data-ocid="history.table"
      >
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_0.7fr_1fr_1fr_1fr] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
          {["Date / Time", "Asset", "Type", "Quantity", "Price", "Total"].map(
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
            data-ocid="history.loading_state"
          >
            {["sk1", "sk2", "sk3", "sk4", "sk5"].map((k) => (
              <div
                key={k}
                className="grid grid-cols-[1fr_1fr_0.7fr_1fr_1fr_1fr] gap-4 px-4 py-3"
              >
                {["a", "b", "c", "d", "e", "f"].map((j) => (
                  <Skeleton key={j} className="h-5 bg-muted/50" />
                ))}
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="text-center py-16 space-y-3"
            data-ocid="history.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted/40 border border-border flex items-center justify-center mx-auto">
              <HistoryIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-mono">
              No trades executed yet
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Your trade history will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map((trade, i) => {
              const isBuy = trade.tradeType === "buy";
              return (
                <motion.div
                  key={`${trade.symbol}-${String(trade.timestamp)}-${i}`}
                  data-ocid={`history.item.${i + 1}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: Math.min(i * 0.02, 0.3),
                    duration: 0.22,
                  }}
                  className={`grid grid-cols-[1fr_1fr_0.7fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors ${
                    isBuy
                      ? "border-l-2 border-l-profit/20"
                      : "border-l-2 border-l-loss/20"
                  }`}
                >
                  {/* Date/Time */}
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTimestamp(trade.timestamp)}
                  </span>

                  {/* Asset */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-mono font-bold text-primary shrink-0">
                      {trade.symbol.slice(0, 2)}
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {trade.symbol}
                    </span>
                  </div>

                  {/* Type */}
                  <Badge
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 w-fit ${
                      isBuy
                        ? "bg-profit-muted text-profit border-profit/30"
                        : "bg-loss-muted text-loss border-loss/30"
                    }`}
                    variant="outline"
                  >
                    <span className="flex items-center gap-0.5">
                      {isBuy ? (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5" />
                      )}
                      {trade.tradeType.toUpperCase()}
                    </span>
                  </Badge>

                  {/* Quantity */}
                  <span className="font-mono text-sm">
                    {trade.quantity.toFixed(4)}
                  </span>

                  {/* Price */}
                  <span className="font-mono text-sm">
                    {formatCurrency(trade.pricePerUnit)}
                  </span>

                  {/* Total */}
                  <span
                    className={`font-mono text-sm font-semibold ${isBuy ? "price-positive" : "price-negative"}`}
                  >
                    {isBuy ? "+" : "-"}
                    {formatCurrency(trade.total)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      {/* Alpaca Live Orders — only visible in Real mode */}
      {isRealAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-3"
        >
          {/* Section header */}
          <div className="flex items-center gap-2">
            <Building2
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.18 145)" }}
            />
            <h2 className="text-sm font-semibold font-mono text-foreground">
              Alpaca Live Orders
            </h2>
            <span
              data-ocid="history.alpaca_live_badge"
              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
              style={{
                background: "oklch(0.14 0.06 145 / 0.80)",
                border: "1px solid oklch(0.38 0.14 145 / 0.60)",
                color: "oklch(0.75 0.18 145)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "oklch(0.72 0.18 145)" }}
              />
              ALPACA LIVE
            </span>
          </div>

          <div
            className="glow-card rounded-lg border border-border overflow-hidden"
            data-ocid="history.alpaca.table"
          >
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_1fr_1fr] gap-4 px-4 py-2.5 bg-muted/40 border-b border-border">
              {[
                "Submitted",
                "Symbol",
                "Side",
                "Qty",
                "Fill Price",
                "Status",
              ].map((h) => (
                <div
                  key={h}
                  className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
                >
                  {h}
                </div>
              ))}
            </div>

            {alpacaLoading ? (
              <div
                className="divide-y divide-border"
                data-ocid="history.alpaca.loading_state"
              >
                {["sk1", "sk2", "sk3"].map((k) => (
                  <div
                    key={k}
                    className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_1fr_1fr] gap-4 px-4 py-3"
                  >
                    {["a", "b", "c", "d", "e", "f"].map((j) => (
                      <Skeleton key={j} className="h-5 bg-muted/50" />
                    ))}
                  </div>
                ))}
              </div>
            ) : alpacaError ? (
              <div
                className="flex items-center gap-2 px-4 py-6"
                data-ocid="history.alpaca.error_state"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs font-mono text-red-400">
                  Failed to load Alpaca orders. Check API keys or network.
                </p>
              </div>
            ) : !alpacaOrders || alpacaOrders.length === 0 ? (
              <div
                className="text-center py-10 space-y-2"
                data-ocid="history.alpaca.empty_state"
              >
                <p className="text-muted-foreground text-sm font-mono">
                  No Alpaca orders yet
                </p>
                <p className="text-muted-foreground/60 text-xs">
                  Place a real order to see it here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alpacaOrders.map((order, i) => {
                  const isBuy = order.side === "buy";
                  const fillPrice = order.filled_avg_price
                    ? formatCurrency(Number.parseFloat(order.filled_avg_price))
                    : "—";
                  const submittedAt = order.submitted_at
                    ? new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(order.submitted_at))
                    : "—";

                  const statusColor =
                    order.status === "filled"
                      ? "text-emerald-400"
                      : order.status === "canceled" ||
                          order.status === "expired"
                        ? "text-red-400"
                        : order.status === "partially_filled"
                          ? "text-yellow-400"
                          : "text-muted-foreground";

                  return (
                    <motion.div
                      key={order.id}
                      data-ocid={`history.alpaca.item.${i + 1}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: Math.min(i * 0.02, 0.3),
                        duration: 0.22,
                      }}
                      className={`grid grid-cols-[1fr_1fr_0.7fr_0.8fr_1fr_1fr] gap-4 px-4 py-3 items-center hover:bg-accent/30 transition-colors ${
                        isBuy
                          ? "border-l-2 border-l-profit/20"
                          : "border-l-2 border-l-loss/20"
                      }`}
                    >
                      {/* Submitted */}
                      <span className="font-mono text-xs text-muted-foreground">
                        {submittedAt}
                      </span>

                      {/* Symbol */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-mono font-bold text-primary shrink-0">
                          {order.symbol.replace("/USD", "").slice(0, 2)}
                        </div>
                        <span className="font-mono text-sm font-semibold">
                          {order.symbol}
                        </span>
                      </div>

                      {/* Side */}
                      <Badge
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 w-fit ${
                          isBuy
                            ? "bg-profit-muted text-profit border-profit/30"
                            : "bg-loss-muted text-loss border-loss/30"
                        }`}
                        variant="outline"
                      >
                        <span className="flex items-center gap-0.5">
                          {isBuy ? (
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          ) : (
                            <ArrowDownRight className="w-2.5 h-2.5" />
                          )}
                          {order.side.toUpperCase()}
                        </span>
                      </Badge>

                      {/* Quantity */}
                      <span className="font-mono text-sm">
                        {Number.parseFloat(order.qty).toFixed(4)}
                      </span>

                      {/* Fill Price */}
                      <span className="font-mono text-sm">{fillPrice}</span>

                      {/* Status */}
                      <span
                        className={`font-mono text-xs font-semibold capitalize ${statusColor}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
