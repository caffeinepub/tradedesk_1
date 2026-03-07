import { getAlpacaAccount, getAlpacaPositions } from "@/utils/alpacaApi";
import { useQuery } from "@tanstack/react-query";

export function useAlpacaAccount() {
  return useQuery({
    queryKey: ["alpacaAccount"],
    queryFn: getAlpacaAccount,
    refetchInterval: 10_000,
    retry: false,
    throwOnError: false,
  });
}

export function useAlpacaPositions() {
  return useQuery({
    queryKey: ["alpacaPositions"],
    queryFn: getAlpacaPositions,
    refetchInterval: 10_000,
    retry: false,
    throwOnError: false,
  });
}
