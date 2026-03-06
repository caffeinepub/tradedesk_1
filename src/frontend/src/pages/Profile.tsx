import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccountMode } from "@/context/AccountModeContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useBalance } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  ShieldCheck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useState } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function Profile() {
  const { accountMode, setAccountMode } = useAccountMode();
  const { identity } = useInternetIdentity();
  const { data: balance } = useBalance();
  const [showRealConfirm, setShowRealConfirm] = useState(false);

  const principal = identity?.getPrincipal().toString();

  const handleSwitchToReal = () => {
    if (accountMode !== "real") {
      setShowRealConfirm(true);
    }
  };

  const confirmSwitchToReal = () => {
    setAccountMode("real");
    setShowRealConfirm(false);
  };

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-6"
      data-ocid="profile.page"
    >
      {/* Header */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <h1 className="font-display text-2xl font-bold text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your account settings and trading mode
        </p>
      </motion.div>

      {/* User Info */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="glow-card bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Status
              </span>
              {identity ? (
                <Badge
                  className="bg-profit-muted text-profit border-profit/30 font-mono text-xs"
                  variant="outline"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge
                  className="bg-loss-muted text-loss border-loss/30 font-mono text-xs"
                  variant="outline"
                >
                  Not signed in
                </Badge>
              )}
            </div>

            {principal && (
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  Principal ID
                </span>
                <span className="font-mono text-xs text-foreground/70 max-w-[200px] truncate">
                  {principal}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                Active Mode
              </span>
              <Badge
                className={
                  accountMode === "real"
                    ? "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)] font-mono text-xs"
                    : "bg-[oklch(0.22_0.06_260)] text-[oklch(0.72_0.14_260)] border-[oklch(0.36_0.10_260)] font-mono text-xs"
                }
                variant="outline"
              >
                {accountMode === "real" ? (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    REAL
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-3 h-3 mr-1" />
                    DEMO
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Mode Selector */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="glow-card bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-chart-4" />
              Trading Account Mode
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose between a live real account or a risk-free demo
              environment.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Demo Account Card */}
              <button
                type="button"
                data-ocid="profile.demo_account.button"
                onClick={() => setAccountMode("demo")}
                className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  accountMode === "demo"
                    ? "border-[oklch(0.6_0.14_260)] bg-[oklch(0.16_0.06_260)] shadow-[0_0_20px_oklch(0.4_0.14_260/0.15)]"
                    : "border-border bg-card/50 hover:border-border/80 hover:bg-card"
                }`}
              >
                {accountMode === "demo" && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[oklch(0.6_0.14_260)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[oklch(0.22_0.06_260)] border border-[oklch(0.36_0.10_260)] flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-[oklch(0.72_0.14_260)]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      Demo Account
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Risk-free simulation
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.14_260)] shrink-0" />
                    $10,000 simulated starting balance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.14_260)] shrink-0" />
                    No real money at risk
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.14_260)] shrink-0" />
                    Practice strategies safely
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.14_260)] shrink-0" />
                    All features available
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">
                    Demo Balance
                  </div>
                  <div className="font-mono text-base font-bold text-[oklch(0.72_0.14_260)]">
                    $10,000.00
                  </div>
                </div>
              </button>

              {/* Real Account Card */}
              <button
                type="button"
                data-ocid="profile.real_account.button"
                onClick={handleSwitchToReal}
                className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  accountMode === "real"
                    ? "border-[oklch(0.6_0.18_145)] bg-[oklch(0.16_0.08_145)] shadow-[0_0_20px_oklch(0.4_0.18_145/0.15)]"
                    : "border-border bg-card/50 hover:border-border/80 hover:bg-card"
                }`}
              >
                {accountMode === "real" && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[oklch(0.6_0.18_145)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[oklch(0.22_0.08_145)] border border-[oklch(0.36_0.12_145)] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[oklch(0.72_0.18_145)]" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      Real Account
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Live trading
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.18_145)] shrink-0" />
                    Live market execution
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.18_145)] shrink-0" />
                    Deposit and withdraw funds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.18_145)] shrink-0" />
                    KYC verification required
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-[oklch(0.6_0.18_145)] shrink-0" />
                    Full account history
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-1">
                    Account Balance
                  </div>
                  <div className="font-mono text-base font-bold text-[oklch(0.72_0.18_145)]">
                    {balance !== undefined ? formatCurrency(balance) : "—"}
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions based on mode */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {accountMode === "real" ? (
          <Card className="glow-card bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-[oklch(0.72_0.18_145)]" />
                Real Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/payments">
                <Button
                  data-ocid="profile.deposit.button"
                  variant="outline"
                  className="w-full justify-between border-[oklch(0.36_0.12_145)] text-[oklch(0.72_0.18_145)] hover:bg-[oklch(0.22_0.08_145)] font-mono text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Deposit Funds
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/kyc">
                <Button
                  data-ocid="profile.kyc.button"
                  variant="outline"
                  className="w-full justify-between border-border text-muted-foreground hover:bg-accent font-mono text-sm"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    KYC Verification
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="glow-card bg-[oklch(0.14_0.05_260)] border-[oklch(0.28_0.08_260)]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-5 h-5 text-[oklch(0.72_0.14_260)] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-[oklch(0.88_0.06_260)] mb-1">
                    Demo Mode Active
                  </div>
                  <p className="text-xs text-[oklch(0.60_0.08_260)] leading-relaxed">
                    You are trading with $10,000 of simulated funds. All trades,
                    portfolio changes, and history are virtual. Switch to Real
                    Account when you are ready to trade with live funds.
                  </p>
                  <Button
                    data-ocid="profile.switch_real.button"
                    size="sm"
                    onClick={handleSwitchToReal}
                    className="mt-3 bg-[oklch(0.22_0.06_260)] border border-[oklch(0.36_0.10_260)] text-[oklch(0.72_0.14_260)] hover:bg-[oklch(0.28_0.08_260)] font-mono text-xs"
                    variant="outline"
                  >
                    Switch to Real Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Confirmation dialog: Demo → Real */}
      <AlertDialog open={showRealConfirm} onOpenChange={setShowRealConfirm}>
        <AlertDialogContent
          className="bg-card border-border max-w-md"
          data-ocid="profile.real_confirm.dialog"
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[oklch(0.22_0.12_30)] border border-[oklch(0.40_0.16_30)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[oklch(0.75_0.18_50)]" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Switch to Real Account?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed pl-[52px]">
                <p>
                  You are about to switch from Demo to{" "}
                  <span className="font-semibold text-[oklch(0.72_0.18_145)]">
                    Real Account
                  </span>{" "}
                  mode. Any trades you place will use{" "}
                  <span className="font-semibold text-foreground">
                    live funds
                  </span>
                  .
                </p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2 text-[oklch(0.75_0.18_50)]">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Real money is at risk on every trade
                  </li>
                  <li className="flex items-center gap-2 text-[oklch(0.75_0.18_50)]">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Orders execute at live market prices
                  </li>
                  <li className="flex items-center gap-2 text-[oklch(0.75_0.18_50)]">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Losses cannot be reversed
                  </li>
                </ul>
                <p className="text-xs">
                  Make sure you have deposited funds and completed KYC
                  verification before trading.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel
              data-ocid="profile.real_confirm.cancel_button"
              className="font-mono text-sm"
            >
              Stay in Demo
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="profile.real_confirm.confirm_button"
              onClick={confirmSwitchToReal}
              className="bg-[oklch(0.36_0.12_145)] hover:bg-[oklch(0.42_0.14_145)] text-[oklch(0.88_0.06_145)] font-mono text-sm border border-[oklch(0.5_0.16_145)]"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Yes, Switch to Real
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
