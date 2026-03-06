import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlertStatus, PriceAlert } from "@/context/PriceAlertsContext";
import { usePriceAlertsContext } from "@/context/PriceAlertsContext";
import { formatCurrency } from "@/utils/format";
import {
  Bell,
  BellOff,
  Download,
  RotateCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

type TabFilter = "all" | AlertStatus;

const TABS: { label: string; value: TabFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Triggered", value: "triggered" },
  { label: "Cancelled", value: "cancelled" },
];

function sortAlerts(alerts: PriceAlert[]): PriceAlert[] {
  const order: Record<AlertStatus, number> = {
    active: 0,
    triggered: 1,
    cancelled: 2,
  };
  return [...alerts].sort((a, b) => {
    const statusDiff = order[a.status] - order[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt - a.createdAt;
  });
}

function StatusBadge({ status }: { status: AlertStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[oklch(0.18_0.08_220)] text-[oklch(0.78_0.16_220)] border border-[oklch(0.36_0.12_220)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.68_0.18_220)] animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "triggered") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[oklch(0.20_0.08_55)] text-[oklch(0.82_0.18_55)] border border-[oklch(0.40_0.12_55)]">
        <Bell className="w-3 h-3" />
        Triggered
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-muted/50 text-muted-foreground border border-border">
      <BellOff className="w-3 h-3" />
      Cancelled
    </span>
  );
}

function DirectionBadge({ direction }: { direction: "above" | "below" }) {
  if (direction === "above") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[oklch(0.18_0.08_145)] text-[oklch(0.80_0.18_145)] border border-[oklch(0.36_0.12_145)]">
        <TrendingUp className="w-3 h-3" />
        Above
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[oklch(0.18_0.08_25)] text-[oklch(0.78_0.18_25)] border border-[oklch(0.36_0.12_25)]">
      <TrendingDown className="w-3 h-3" />
      Below
    </span>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function escapeCsvValue(val: string): string {
  const escaped = val.replace(/"/g, '""');
  return `"${escaped}"`;
}

function exportAlertsToCsv(alerts: PriceAlert[], tab: TabFilter): void {
  const headers = [
    "Symbol",
    "Asset Name",
    "Target Price",
    "Direction",
    "Status",
    "Note",
    "Created At",
    "Triggered At",
  ];

  const rows = alerts.map((a) => [
    escapeCsvValue(a.symbol),
    escapeCsvValue(a.assetName),
    escapeCsvValue(String(a.targetPrice)),
    escapeCsvValue(a.direction),
    escapeCsvValue(a.status),
    escapeCsvValue(a.note ?? ""),
    escapeCsvValue(formatTimestamp(a.createdAt)),
    escapeCsvValue(a.triggeredAt ? formatTimestamp(a.triggeredAt) : ""),
  ]);

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const filename = `vertex-alerts-${tab}-${dateStr}.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function PriceAlerts() {
  const { alerts, activeAlerts, cancelAlert, removeAlert, reactivateAlert } =
    usePriceAlertsContext();
  const [tab, setTab] = useState<TabFilter>("all");
  const [newAlertOpen, setNewAlertOpen] = useState(false);

  const filtered = sortAlerts(
    tab === "all" ? alerts : alerts.filter((a) => a.status === tab),
  );

  const tabCount = (t: TabFilter) =>
    t === "all" ? alerts.length : alerts.filter((a) => a.status === t).length;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5" data-ocid="alerts.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[oklch(0.22_0.07_55)] border border-[oklch(0.40_0.12_55)] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[oklch(0.82_0.18_55)]" />
            </div>
            Price Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 font-mono">
            {activeAlerts.length === 0
              ? "No active alerts"
              : `${activeAlerts.length} active alert${activeAlerts.length !== 1 ? "s" : ""} monitoring`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="alerts.export.button"
            variant="outline"
            disabled={filtered.length === 0}
            onClick={() => exportAlertsToCsv(filtered, tab)}
            className="font-mono font-semibold gap-2 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export{" "}
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}{" "}
            ({filtered.length})
          </Button>
          <Button
            data-ocid="alerts.new_alert.open_modal_button"
            onClick={() => setNewAlertOpen(true)}
            className="bg-[oklch(0.22_0.07_55)] hover:bg-[oklch(0.26_0.09_55)] text-[oklch(0.90_0.16_55)] border border-[oklch(0.42_0.12_55)] font-mono font-semibold gap-2"
          >
            <Bell className="w-4 h-4" />
            New Alert
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex items-center gap-1.5 flex-wrap"
      >
        {TABS.map((t) => {
          const isActive = tab === t.value;
          const count = tabCount(t.value);
          return (
            <button
              key={t.value}
              type="button"
              data-ocid="alerts.filter.tab"
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`text-[10px] px-1 py-0.5 rounded ${
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/50 text-muted-foreground/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Alert List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glow-card rounded-lg border border-border overflow-hidden"
        data-ocid="alerts.list"
      >
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1.5fr_1fr_auto] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
          {[
            "Symbol",
            "Asset",
            "Target",
            "Direction",
            "Status",
            "Created",
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

        {/* Rows or Empty State */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            data-ocid="alerts.empty_state"
          >
            <div className="w-12 h-12 rounded-full bg-muted/40 border border-border flex items-center justify-center">
              <BellOff className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {tab === "all" ? "No price alerts yet" : `No ${tab} alerts`}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                {tab === "all"
                  ? "Create your first alert to get notified when an asset hits your target price"
                  : "Switch to a different filter to see other alerts"}
              </p>
            </div>
            {tab === "all" && (
              <Button
                data-ocid="alerts.empty_state.new_alert.open_modal_button"
                onClick={() => setNewAlertOpen(true)}
                size="sm"
                className="bg-[oklch(0.22_0.07_55)] hover:bg-[oklch(0.26_0.09_55)] text-[oklch(0.90_0.16_55)] border border-[oklch(0.42_0.12_55)] font-mono font-semibold gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Set First Alert
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((alert, i) => (
              <motion.div
                key={alert.id}
                data-ocid={`alerts.item.${i + 1}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.25 }}
                className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1.5fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-accent/20 transition-colors group"
              >
                {/* Symbol */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded border border-border bg-muted/50 flex items-center justify-center text-[10px] font-mono font-bold text-foreground shrink-0">
                    {alert.symbol.slice(0, 2)}
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {alert.symbol}
                  </span>
                </div>

                {/* Asset Name */}
                <span className="text-sm text-muted-foreground truncate">
                  {alert.assetName}
                </span>

                {/* Target Price */}
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatCurrency(alert.targetPrice)}
                </span>

                {/* Direction */}
                <DirectionBadge direction={alert.direction} />

                {/* Status + Note */}
                <div className="flex flex-col gap-1">
                  <StatusBadge status={alert.status} />
                  {alert.note && (
                    <span className="text-[10px] text-muted-foreground/70 font-mono truncate max-w-[160px]">
                      {alert.note}
                    </span>
                  )}
                  {alert.triggeredAt && (
                    <span className="text-[10px] text-[oklch(0.72_0.14_55)] font-mono">
                      Hit {formatRelativeTime(alert.triggeredAt)}
                    </span>
                  )}
                </div>

                {/* Created */}
                <span className="text-xs text-muted-foreground font-mono">
                  {formatRelativeTime(alert.createdAt)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {alert.status === "active" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`alerts.cancel_button.${i + 1}`}
                      onClick={() => cancelAlert(alert.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                      title="Cancel alert"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {(alert.status === "triggered" ||
                    alert.status === "cancelled") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`alerts.reactivate_button.${i + 1}`}
                      onClick={() => reactivateAlert(alert.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-[oklch(0.78_0.16_220)] hover:bg-[oklch(0.18_0.08_220_/_0.3)]"
                      title="Reactivate alert"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    data-ocid={`alerts.delete_button.${i + 1}`}
                    onClick={() => removeAlert(alert.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Footer info */}
      {activeAlerts.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[11px] text-muted-foreground/60 font-mono text-center"
        >
          Alerts are checked every 30 seconds when live prices update
        </motion.p>
      )}

      {/* New Alert Dialog */}
      <PriceAlertDialog
        open={newAlertOpen}
        onClose={() => setNewAlertOpen(false)}
      />
    </div>
  );
}
