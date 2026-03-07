import { getAlpacaOrders } from "@/utils/alpacaApi";
import { useQuery } from "@tanstack/react-query";

export function useAlpacaOrders() {
  return useQuery({
    queryKey: ["alpacaOrders"],
    queryFn: () => getAlpacaOrders("all"),
    refetchInterval: 10_000,
    retry: false,
    throwOnError: false,
  });
}
