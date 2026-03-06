import { type ReactNode, createContext, useContext, useState } from "react";

export type AccountMode = "real" | "demo";

interface AccountModeContextValue {
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => void;
}

const AccountModeContext = createContext<AccountModeContextValue>({
  accountMode: "demo",
  setAccountMode: () => {},
});

export function AccountModeProvider({ children }: { children: ReactNode }) {
  const [accountMode, setAccountModeState] = useState<AccountMode>(() => {
    try {
      const stored = localStorage.getItem("vertex_account_mode");
      if (stored === "real" || stored === "demo") return stored;
    } catch {
      // ignore
    }
    return "demo";
  });

  const setAccountMode = (mode: AccountMode) => {
    setAccountModeState(mode);
    try {
      localStorage.setItem("vertex_account_mode", mode);
    } catch {
      // ignore
    }
  };

  return (
    <AccountModeContext.Provider value={{ accountMode, setAccountMode }}>
      {children}
    </AccountModeContext.Provider>
  );
}

export function useAccountMode() {
  return useContext(AccountModeContext);
}
