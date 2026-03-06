import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Asset, PortfolioAsset, PublicTrade } from "../backend.d";
import { Category } from "../backend.d";
import { useActor } from "./useActor";

// ─── Static fallback assets (shown immediately before actor loads) ─────────────

const FALLBACK_ASSETS: Asset[] = [
  // Crypto
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 40000,
    change24h: 2.5,
    category: Category.crypto,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 2500,
    change24h: 1.8,
    category: Category.crypto,
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 120,
    change24h: 4.7,
    category: Category.crypto,
  },
  {
    symbol: "BNB",
    name: "BNB",
    price: 400,
    change24h: -2.1,
    category: Category.crypto,
  },
  {
    symbol: "XRP",
    name: "Ripple",
    price: 0.85,
    change24h: 0.3,
    category: Category.crypto,
  },
  {
    symbol: "ADA",
    name: "Cardano",
    price: 0.45,
    change24h: 1.2,
    category: Category.crypto,
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    price: 7.5,
    change24h: -0.8,
    category: Category.crypto,
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    price: 35,
    change24h: 3.4,
    category: Category.crypto,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    price: 14,
    change24h: 2.1,
    category: Category.crypto,
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    price: 95,
    change24h: -1.5,
    category: Category.crypto,
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.08,
    change24h: 5.2,
    category: Category.crypto,
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    price: 6,
    change24h: 1.9,
    category: Category.crypto,
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    price: 0.75,
    change24h: -0.4,
    category: Category.crypto,
  },
  // Stocks
  {
    symbol: "AAPL",
    name: "Apple",
    price: 150,
    change24h: -0.5,
    category: Category.stock,
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    price: 700,
    change24h: 3.1,
    category: Category.stock,
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    price: 3500,
    change24h: -1.2,
    category: Category.stock,
  },
  {
    symbol: "GOOGL",
    name: "Google",
    price: 2800,
    change24h: 0.9,
    category: Category.stock,
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    price: 300,
    change24h: 1.4,
    category: Category.stock,
  },
  // Metals
  {
    symbol: "GOLD",
    name: "Gold",
    price: 1950,
    change24h: 0.4,
    category: Category.metal,
  },
  {
    symbol: "SILVER",
    name: "Silver",
    price: 24.5,
    change24h: -0.6,
    category: Category.metal,
  },
  {
    symbol: "PLATINUM",
    name: "Platinum",
    price: 980,
    change24h: 0.2,
    category: Category.metal,
  },
  {
    symbol: "COPPER",
    name: "Copper",
    price: 3.85,
    change24h: -1.1,
    category: Category.metal,
  },
  // Indices
  {
    symbol: "SPX",
    name: "S&P 500",
    price: 4500,
    change24h: 0.7,
    category: Category.index,
  },
  {
    symbol: "NDX",
    name: "NASDAQ 100",
    price: 15800,
    change24h: 1.1,
    category: Category.index,
  },
  {
    symbol: "DJI",
    name: "Dow Jones",
    price: 35000,
    change24h: 0.3,
    category: Category.index,
  },
  {
    symbol: "FTSE",
    name: "FTSE 100",
    price: 7400,
    change24h: -0.2,
    category: Category.index,
  },
  {
    symbol: "N225",
    name: "Nikkei 225",
    price: 32000,
    change24h: 0.8,
    category: Category.index,
  },
  {
    symbol: "DAX",
    name: "DAX",
    price: 16000,
    change24h: 0.5,
    category: Category.index,
  },
];

// ─── Assets ──────────────────────────────────────────────────────────────────

export function useAllAssets() {
  const { actor } = useActor();
  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return FALLBACK_ASSETS;
      return actor.getAllAssets();
    },
    enabled: true,
    initialData: FALLBACK_ASSETS,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

export function useAsset(symbol: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Asset>({
    queryKey: ["asset", symbol],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getAsset(symbol);
    },
    enabled: !!actor && !isFetching && !!symbol,
    refetchInterval: 10_000,
  });
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export function useBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ["balance"],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export function usePortfolioAssets(sortBy?: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PortfolioAsset[]>({
    queryKey: ["portfolio", sortBy ?? null],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPortfolioAssets(sortBy ?? null);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Trades ───────────────────────────────────────────────────────────────────

export function useTrades() {
  const { actor, isFetching } = useActor();
  return useQuery<PublicTrade[]>({
    queryKey: ["trades"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrades();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function useWatchlist() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["watchlist"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWatchlist();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAddToWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addToWatchlist(symbol);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.removeFromWatchlist(symbol);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useBuy() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      quantity,
    }: { symbol: string; quantity: number }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.buy(symbol, quantity);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

export function useSell() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      symbol,
      quantity,
    }: { symbol: string; quantity: number }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.sell(symbol, quantity);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}
