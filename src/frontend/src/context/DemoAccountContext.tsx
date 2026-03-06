import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export interface DemoTrade {
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  tradeType: "buy" | "sell";
  timestamp: number;
}

export interface DemoHolding {
  symbol: string;
  quantity: number;
}

interface DemoAccountContextValue {
  demoBalance: number;
  demoPortfolio: DemoHolding[];
  demoTrades: DemoTrade[];
  demoBuy: (symbol: string, quantity: number, price: number) => string | null;
  demoSell: (symbol: string, quantity: number, price: number) => string | null;
  resetDemo: () => void;
}

const DEMO_INITIAL_BALANCE = 10000;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const DemoAccountContext = createContext<DemoAccountContextValue>({
  demoBalance: DEMO_INITIAL_BALANCE,
  demoPortfolio: [],
  demoTrades: [],
  demoBuy: () => null,
  demoSell: () => null,
  resetDemo: () => {},
});

export function DemoAccountProvider({ children }: { children: ReactNode }) {
  const [demoBalance, setDemoBalance] = useState<number>(() =>
    loadFromStorage("vertex_demo_balance", DEMO_INITIAL_BALANCE),
  );
  const [demoPortfolio, setDemoPortfolio] = useState<DemoHolding[]>(() =>
    loadFromStorage("vertex_demo_portfolio", []),
  );
  const [demoTrades, setDemoTrades] = useState<DemoTrade[]>(() =>
    loadFromStorage("vertex_demo_trades", []),
  );

  // Refs for synchronous reads inside callbacks
  const balanceRef = useRef(demoBalance);
  const portfolioRef = useRef(demoPortfolio);
  const tradesRef = useRef(demoTrades);

  const _setBalance = (val: number) => {
    balanceRef.current = val;
    setDemoBalance(val);
    saveToStorage("vertex_demo_balance", val);
  };

  const _setPortfolio = (val: DemoHolding[]) => {
    portfolioRef.current = val;
    setDemoPortfolio(val);
    saveToStorage("vertex_demo_portfolio", val);
  };

  const _addTrade = (trade: DemoTrade) => {
    const next = [trade, ...tradesRef.current];
    tradesRef.current = next;
    setDemoTrades(next);
    saveToStorage("vertex_demo_trades", next);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional stable ref pattern
  const demoBuy = useCallback(
    (symbol: string, quantity: number, price: number): string | null => {
      if (quantity <= 0) return "Invalid quantity";
      if (price <= 0) return "Invalid price";
      const total = quantity * price;
      const currentBalance = balanceRef.current;
      if (currentBalance < total) {
        return `Insufficient demo balance. Available: $${currentBalance.toFixed(2)}`;
      }

      _setBalance(currentBalance - total);

      const portfolio = portfolioRef.current;
      const existing = portfolio.find((h) => h.symbol === symbol);
      let nextPortfolio: DemoHolding[];
      if (existing) {
        nextPortfolio = portfolio.map((h) =>
          h.symbol === symbol ? { ...h, quantity: h.quantity + quantity } : h,
        );
      } else {
        nextPortfolio = [...portfolio, { symbol, quantity }];
      }
      _setPortfolio(nextPortfolio);

      _addTrade({
        symbol,
        quantity,
        pricePerUnit: price,
        total,
        tradeType: "buy",
        timestamp: Date.now(),
      });

      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional stable ref pattern
  const demoSell = useCallback(
    (symbol: string, quantity: number, price: number): string | null => {
      if (quantity <= 0) return "Invalid quantity";
      if (price <= 0) return "Invalid price";

      const portfolio = portfolioRef.current;
      const holding = portfolio.find((h) => h.symbol === symbol);
      const heldQty = holding?.quantity ?? 0;
      if (heldQty < quantity) {
        return `Insufficient holdings. You have ${heldQty.toFixed(6)} ${symbol}`;
      }

      const total = quantity * price;
      _setBalance(balanceRef.current + total);

      let nextPortfolio: DemoHolding[];
      const newQty = heldQty - quantity;
      if (newQty <= 1e-10) {
        nextPortfolio = portfolio.filter((h) => h.symbol !== symbol);
      } else {
        nextPortfolio = portfolio.map((h) =>
          h.symbol === symbol ? { ...h, quantity: newQty } : h,
        );
      }
      _setPortfolio(nextPortfolio);

      _addTrade({
        symbol,
        quantity,
        pricePerUnit: price,
        total,
        tradeType: "sell",
        timestamp: Date.now(),
      });

      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional stable ref pattern
  const resetDemo = useCallback(() => {
    _setBalance(DEMO_INITIAL_BALANCE);
    _setPortfolio([]);
    tradesRef.current = [];
    setDemoTrades([]);
    saveToStorage("vertex_demo_trades", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DemoAccountContext.Provider
      value={{
        demoBalance,
        demoPortfolio,
        demoTrades,
        demoBuy,
        demoSell,
        resetDemo,
      }}
    >
      {children}
    </DemoAccountContext.Provider>
  );
}

export function useDemoAccount() {
  return useContext(DemoAccountContext);
}
