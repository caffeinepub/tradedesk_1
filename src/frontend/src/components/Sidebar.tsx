import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountMode } from "@/context/AccountModeContext";
import { usePriceAlertsContext } from "@/context/PriceAlertsContext";
import { useTheme } from "@/context/ThemeContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useBalance } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Bell,
  Briefcase,
  ClipboardList,
  FlaskConical,
  History,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  ShieldCheck,
  Star,
  Sun,
  User,
  Wallet,
  Zap,
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
  {
    to: "/profile",
    label: "Profile",
    icon: User,
    ocid: "nav.profile.link",
  },
];

export function Sidebar() {
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { accountMode } = useAccountMode();
  const { theme, setTheme } = useTheme();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { activeAlerts } = usePriceAlertsContext();

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-sidebar border-r border-sidebar-border relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 terminal-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <img
              src="/assets/generated/vertex-logo-transparent.dim_600x200.png"
              alt="Vertex"
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Balance Widget */}
        {isLoggedIn && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="rounded-md bg-accent/40 border border-sidebar-border px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                  {accountMode === "demo"
                    ? "Demo Balance"
                    : "Available Balance"}
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border",
                    accountMode === "real"
                      ? "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]"
                      : "bg-[oklch(0.22_0.06_260)] text-[oklch(0.72_0.14_260)] border-[oklch(0.36_0.10_260)]",
                  )}
                >
                  {accountMode === "real" ? (
                    <Zap className="w-2 h-2" />
                  ) : (
                    <FlaskConical className="w-2 h-2" />
                  )}
                  {accountMode.toUpperCase()}
                </div>
              </div>
              {balanceLoading ? (
                <Skeleton className="h-5 w-28 bg-muted/50" />
              ) : (
                <div
                  className={cn(
                    "font-mono text-sm font-bold",
                    accountMode === "real"
                      ? "text-[oklch(0.72_0.18_145)]"
                      : "text-[oklch(0.72_0.14_260)]",
                  )}
                >
                  {accountMode === "demo"
                    ? "$10,000.00"
                    : balance !== undefined
                      ? formatCurrency(balance)
                      : "—"}
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

          {/* Price Alerts Link */}
          <Link to="/alerts" data-ocid="nav.alerts.link">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group",
                currentPath === "/alerts"
                  ? "bg-sidebar-primary/15 text-primary border border-primary/25"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent",
              )}
            >
              <div className="relative shrink-0">
                <Bell
                  className={cn(
                    "w-4 h-4 transition-colors",
                    currentPath === "/alerts"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[oklch(0.72_0.18_55)] text-[oklch(0.12_0.04_55)] text-[8px] font-bold flex items-center justify-center leading-none">
                    {activeAlerts.length > 9 ? "9+" : activeAlerts.length}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-medium",
                  currentPath === "/alerts" && "font-semibold",
                )}
              >
                Price Alerts
              </span>
              {currentPath === "/alerts" && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </div>
          </Link>

          {/* Staff Section */}
          <div className="pt-3 pb-1">
            <div className="px-3 pb-1.5 flex items-center gap-2">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest shrink-0">
                Staff
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>
            <Link to="/kyc-admin" data-ocid="nav.kyc_admin.link">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group",
                  currentPath === "/kyc-admin"
                    ? "bg-sidebar-primary/15 text-primary border border-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent",
                )}
              >
                <ClipboardList
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    currentPath === "/kyc-admin"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "font-medium",
                    currentPath === "/kyc-admin" && "font-semibold",
                  )}
                >
                  KYC Review
                </span>
                {currentPath === "/kyc-admin" && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 pb-3 border-t border-sidebar-border pt-3">
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 border border-border">
            <button
              type="button"
              data-ocid="theme.toggle"
              onClick={() => setTheme("bright")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                theme === "bright"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={theme === "bright"}
              aria-label="Switch to Bright theme"
            >
              <Sun className="w-3.5 h-3.5" />
              Bright
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                theme === "dark"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={theme === "dark"}
              aria-label="Switch to Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

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
