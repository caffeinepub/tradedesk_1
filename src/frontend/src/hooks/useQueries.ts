import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Asset, PortfolioAsset, PublicTrade } from "../backend.d";
import { useActor } from "./useActor";

// ─── Assets ──────────────────────────────────────────────────────────────────

export function useAllAssets() {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAssets();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
    staleTime: 5_000,
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
