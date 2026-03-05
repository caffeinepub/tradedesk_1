import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useBalance } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Briefcase,
  History,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";

const NAV_LINKS = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    to: "/markets",
    label: "Markets",
    icon: LineChart,
    ocid: "nav.markets.link",
  },
  {
    to: "/charts",
    label: "Charts",
    icon: BarChart2,
    ocid: "nav.charts.link",
  },
  {
    to: "/portfolio",
    label: "Portfolio",
    icon: Briefcase,
    ocid: "nav.portfolio.link",
  },
  {
    to: "/history",
    label: "Trade History",
    icon: History,
    ocid: "nav.history.link",
  },
  {
    to: "/watchlist",
    label: "Watchlist",
    icon: Star,
    ocid: "nav.watchlist.link",
  },
  {
    to: "/kyc",
    label: "KYC / Verify",
    icon: ShieldCheck,
    ocid: "nav.kyc.link",
  },
  {
    to: "/payments",
    label: "Payments",
    icon: Wallet,
    ocid: "nav.payments.link",
  },
];

export function Sidebar() {
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-sidebar border-r border-sidebar-border relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 terminal-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-display font-bold text-sidebar-foreground tracking-tight text-base">
                TradeDesk
              </span>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mt-0.5">
                Terminal
              </div>
            </div>
          </div>
        </div>

        {/* Balance Widget */}
        {isLoggedIn && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="rounded-md bg-accent/40 border border-sidebar-border px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">
                Available Balance
              </div>
              {balanceLoading ? (
                <Skeleton className="h-5 w-28 bg-muted/50" />
              ) : (
                <div className="font-mono text-sm font-bold text-primary">
                  {balance !== undefined ? formatCurrency(balance) : "—"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.to;
            return (
              <Link key={link.to} to={link.to} data-ocid={link.ocid}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group",
                    isActive
                      ? "bg-sidebar-primary/15 text-primary border border-primary/25"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span
                    className={cn("font-medium", isActive && "font-semibold")}
                  >
                    {link.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          {isLoggedIn ? (
            <>
              <div className="px-3 py-2 rounded-md bg-muted/30">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">
                  Principal
                </div>
                <div className="font-mono text-xs text-foreground/70 truncate">
                  {identity.getPrincipal().toString().slice(0, 20)}...
                </div>
              </div>
              <Button
                data-ocid="nav.logout.button"
                variant="ghost"
                size="sm"
                onClick={() => clear()}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-normal"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              data-ocid="nav.login.button"
              onClick={() => login()}
              disabled={isLoggingIn || isInitializing}
              className="w-full gap-2 bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 font-mono text-sm"
              variant="outline"
            >
              {isLoggingIn || isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoggingIn ? "Connecting..." : "Sign In"}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="text-[10px] text-muted-foreground/50 font-mono">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Built with caffeine.ai
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
