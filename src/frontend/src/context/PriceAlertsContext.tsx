import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "triggered" | "cancelled";

export interface PriceAlert {
  id: string;
  symbol: string;
  assetName: string;
  targetPrice: number;
  direction: AlertDirection;
  note?: string;
  status: AlertStatus;
  createdAt: number;
  triggeredAt?: number;
}

interface PriceAlertsContextValue {
  alerts: PriceAlert[];
  activeAlerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, "id" | "createdAt" | "status">) => void;
  removeAlert: (id: string) => void;
  cancelAlert: (id: string) => void;
  reactivateAlert: (id: string) => void;
  markTriggered: (id: string) => void;
}

const STORAGE_KEY = "vertex_price_alerts";

function loadAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PriceAlert[];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // ignore
  }
}

function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const PriceAlertsContext = createContext<PriceAlertsContextValue>({
  alerts: [],
  activeAlerts: [],
  addAlert: () => {},
  removeAlert: () => {},
  cancelAlert: () => {},
  reactivateAlert: () => {},
  markTriggered: () => {},
});

export function PriceAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);

  const updateAlerts = useCallback(
    (updater: (prev: PriceAlert[]) => PriceAlert[]) => {
      setAlerts((prev) => {
        const next = updater(prev);
        saveAlerts(next);
        return next;
      });
    },
    [],
  );

  const addAlert = useCallback(
    (alertData: Omit<PriceAlert, "id" | "createdAt" | "status">) => {
      const newAlert: PriceAlert = {
        ...alertData,
        id: generateId(),
        createdAt: Date.now(),
        status: "active",
      };
      updateAlerts((prev) => [newAlert, ...prev]);
    },
    [updateAlerts],
  );

  const removeAlert = useCallback(
    (id: string) => {
      updateAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [updateAlerts],
  );

  const cancelAlert = useCallback(
    (id: string) => {
      updateAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
      );
    },
    [updateAlerts],
  );

  const reactivateAlert = useCallback(
    (id: string) => {
      updateAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "active", triggeredAt: undefined } : a,
        ),
      );
    },
    [updateAlerts],
  );

  const markTriggered = useCallback(
    (id: string) => {
      updateAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: "triggered", triggeredAt: Date.now() }
            : a,
        ),
      );
    },
    [updateAlerts],
  );

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.status === "active"),
    [alerts],
  );

  const value = useMemo(
    () => ({
      alerts,
      activeAlerts,
      addAlert,
      removeAlert,
      cancelAlert,
      reactivateAlert,
      markTriggered,
    }),
    [
      alerts,
      activeAlerts,
      addAlert,
      removeAlert,
      cancelAlert,
      reactivateAlert,
      markTriggered,
    ],
  );

  return (
    <PriceAlertsContext.Provider value={value}>
      {children}
    </PriceAlertsContext.Provider>
  );
}

export function usePriceAlertsContext() {
  return useContext(PriceAlertsContext);
}
