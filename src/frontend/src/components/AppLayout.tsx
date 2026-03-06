import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/context/ThemeContext";
import { useLivePrices } from "@/hooks/useLivePrices";
import { usePriceAlertChecker } from "@/hooks/usePriceAlertChecker";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const { isDark } = useTheme();
  const { data: livePrices } = useLivePrices();
  usePriceAlertChecker(livePrices);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      <Toaster
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-mono text-sm",
            title: "font-semibold",
            description: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
