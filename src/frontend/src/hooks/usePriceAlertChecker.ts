import { usePriceAlertsContext } from "@/context/PriceAlertsContext";
import { formatCurrency } from "@/utils/format";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { LivePriceData } from "./useLivePrices";

export function usePriceAlertChecker(livePrices: LivePriceData): void {
  const { activeAlerts, markTriggered } = usePriceAlertsContext();
  // Track already-triggered alert IDs in this session to avoid duplicate toasts
  const triggeredInSession = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!livePrices || Object.keys(livePrices).length === 0) return;

    for (const alert of activeAlerts) {
      // Skip if already fired in this session
      if (triggeredInSession.current.has(alert.id)) continue;

      const liveData = livePrices[alert.symbol];
      if (!liveData) continue;

      const { price } = liveData;
      const shouldTrigger =
        (alert.direction === "above" && price >= alert.targetPrice) ||
        (alert.direction === "below" && price <= alert.targetPrice);

      if (shouldTrigger) {
        triggeredInSession.current.add(alert.id);
        markTriggered(alert.id);

        const dirLabel =
          alert.direction === "above" ? "↑ reached" : "↓ dropped to";

        toast(`🔔 Alert: ${alert.symbol}`, {
          description: `${alert.assetName} ${dirLabel} ${formatCurrency(alert.targetPrice)}`,
          duration: 8000,
          action: {
            label: "Trade Now",
            onClick: () => {
              window.location.href = "/charts";
            },
          },
        });
      }
    }
  }, [livePrices, activeAlerts, markTriggered]);
}
