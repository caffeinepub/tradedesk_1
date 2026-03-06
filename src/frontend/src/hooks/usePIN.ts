import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCallback, useEffect, useState } from "react";

function getPinKey(principal: string | null | undefined): string {
  return `vertex_pin_${principal ?? "guest"}`;
}

export function usePIN() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? null;
  const key = getPinKey(principal);

  const [hasPin, setHasPin] = useState<boolean>(() => {
    return !!localStorage.getItem(getPinKey(principal));
  });

  // Re-sync when principal changes (login/logout)
  useEffect(() => {
    setHasPin(!!localStorage.getItem(key));
  }, [key]);

  const verifyPin = useCallback(
    (pin: string): boolean => {
      const stored = localStorage.getItem(key);
      return stored !== null && stored === pin;
    },
    [key],
  );

  const setPin = useCallback(
    (pin: string): void => {
      localStorage.setItem(key, pin);
      setHasPin(true);
    },
    [key],
  );

  const removePin = useCallback((): void => {
    localStorage.removeItem(key);
    setHasPin(false);
  }, [key]);

  const resetPin = useCallback(
    (pin: string): void => {
      localStorage.setItem(key, pin);
      setHasPin(true);
    },
    [key],
  );

  return { hasPin, verifyPin, setPin, removePin, resetPin };
}
