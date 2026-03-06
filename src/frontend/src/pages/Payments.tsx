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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountMode } from "@/context/AccountModeContext";
import { useBalance } from "@/hooks/useQueries";
import { formatCurrency } from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Globe,
  Info,
  Lock,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { type KYCStatus, getKYCStatus } from "./KYC";

const DEPOSIT_PRESETS = [100, 500, 1000, 2500, 5000, 10000];
const WITHDRAW_PRESETS = [100, 250, 500, 1000, 2500, 5000];

type PaymentMethod = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  processingTime: string;
  fee: string;
  badge?: string;
  badgeColor?: string;
  minAmount: number;
  maxAmount: number;
};

const UPI_BADGE_COLOR =
  "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]";

const DEPOSIT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    name: "Credit / Debit Card",
    description: "Visa, Mastercard, Amex",
    icon: CreditCard,
    processingTime: "Instant",
    fee: "1.5%",
    badge: "Popular",
    badgeColor: "bg-primary/20 text-primary border-primary/30",
    minAmount: 10,
    maxAmount: 50000,
  },
  {
    id: "bank",
    name: "Bank Wire Transfer",
    description: "SWIFT / SEPA international wire",
    icon: Building2,
    processingTime: "1–3 business days",
    fee: "Free",
    minAmount: 500,
    maxAmount: 500000,
  },
  {
    id: "crypto",
    name: "Crypto Deposit",
    description: "BTC, ETH, USDT, USDC",
    icon: Globe,
    processingTime: "10–60 minutes",
    fee: "Free",
    badge: "Fast",
    badgeColor:
      "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]",
    minAmount: 50,
    maxAmount: 1000000,
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "Skrill, Neteller, PayPal",
    icon: Smartphone,
    processingTime: "Instant",
    fee: "1%",
    minAmount: 10,
    maxAmount: 10000,
  },
  {
    id: "upi",
    name: "UPI / BHIM",
    description: "Google Pay, PhonePe, Paytm, BHIM",
    icon: QrCode,
    processingTime: "Instant",
    fee: "Free",
    badge: "Instant",
    badgeColor: UPI_BADGE_COLOR,
    minAmount: 1,
    maxAmount: 5000,
  },
];

const WITHDRAW_METHODS: PaymentMethod[] = [
  {
    id: "bank",
    name: "Bank Wire Transfer",
    description: "Withdraw to your bank account",
    icon: Building2,
    processingTime: "1–3 business days",
    fee: "Free",
    badge: "Recommended",
    badgeColor: "bg-primary/20 text-primary border-primary/30",
    minAmount: 50,
    maxAmount: 500000,
  },
  {
    id: "card",
    name: "Credit / Debit Card",
    description: "Return to original card",
    icon: CreditCard,
    processingTime: "3–5 business days",
    fee: "Free",
    minAmount: 50,
    maxAmount: 50000,
  },
  {
    id: "crypto",
    name: "Crypto Withdrawal",
    description: "BTC, ETH, USDT, USDC",
    icon: Globe,
    processingTime: "10–60 minutes",
    fee: "Network fee only",
    badge: "Fast",
    badgeColor:
      "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]",
    minAmount: 50,
    maxAmount: 1000000,
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "Skrill, Neteller, PayPal",
    icon: Smartphone,
    processingTime: "Within 24 hours",
    fee: "Free",
    minAmount: 10,
    maxAmount: 10000,
  },
  {
    id: "upi",
    name: "UPI Transfer",
    description: "Instant withdrawal to UPI ID",
    icon: QrCode,
    processingTime: "Within 30 minutes",
    fee: "Free",
    badge: "Instant",
    badgeColor: UPI_BADGE_COLOR,
    minAmount: 1,
    maxAmount: 2000,
  },
];

const RECENT_TRANSACTIONS = [
  {
    id: "txn001",
    type: "deposit" as const,
    method: "Credit Card",
    amount: 1000,
    status: "completed" as const,
    date: "Mar 04, 2026",
    ref: "DEP-8821",
  },
  {
    id: "txn002",
    type: "deposit" as const,
    method: "Bank Wire",
    amount: 5000,
    status: "completed" as const,
    date: "Feb 28, 2026",
    ref: "DEP-8754",
  },
  {
    id: "txn003",
    type: "withdrawal" as const,
    method: "Bank Wire",
    amount: 2000,
    status: "pending" as const,
    date: "Mar 03, 2026",
    ref: "WTH-3312",
  },
  {
    id: "txn004",
    type: "deposit" as const,
    method: "Crypto",
    amount: 500,
    status: "completed" as const,
    date: "Feb 20, 2026",
    ref: "DEP-8601",
  },
];

// ─── KYC Banner ────────────────────────────────────────────────────────────────

function KYCBanner({ status }: { status: KYCStatus }) {
  if (status === "level1" || status === "level2") return null;

  if (status === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
      >
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-mono text-primary font-semibold">
            KYC Verification Under Review
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your verification is being processed (1–2 business days). Limited
            features are active.
          </p>
        </div>
        <Link to="/kyc">
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 whitespace-nowrap"
          >
            View Status
          </Button>
        </Link>
      </motion.div>
    );
  }

  // unverified
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-lg border border-[oklch(0.36_0.12_55)] bg-[oklch(0.16_0.05_55)] p-4"
    >
      <ShieldAlert className="w-4 h-4 text-[oklch(0.75_0.18_55)] mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-mono text-[oklch(0.85_0.18_55)] font-semibold">
          KYC Verification Required
        </p>
        <p className="text-xs text-[oklch(0.65_0.12_55)] mt-0.5">
          Deposits limited to $500 and withdrawals are blocked until you
          complete identity verification.
        </p>
      </div>
      <Link to="/kyc">
        <Button
          data-ocid="kyc.start.button"
          variant="outline"
          size="sm"
          className="font-mono text-xs bg-[oklch(0.22_0.08_55)] border-[oklch(0.36_0.12_55)] text-[oklch(0.85_0.18_55)] hover:bg-[oklch(0.26_0.1_55)] whitespace-nowrap"
        >
          <ShieldCheck className="w-3 h-3 mr-1.5" />
          Start KYC
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Method Card ───────────────────────────────────────────────────────────────

function MethodCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = method.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      data-ocid={`payments.method_${method.id}.button`}
      className={`w-full text-left rounded-lg border p-3.5 transition-all duration-150 ${
        selected
          ? "border-primary/60 bg-primary/8 shadow-[0_0_0_1px_oklch(var(--primary)/0.3)]"
          : "border-border bg-card/60 hover:border-primary/30 hover:bg-accent/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
            selected
              ? "bg-primary/20 border border-primary/40"
              : "bg-muted/50 border border-border"
          }`}
        >
          <Icon
            className={`w-4 h-4 ${selected ? "text-primary" : "text-muted-foreground"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold ${selected ? "text-foreground" : "text-foreground/80"}`}
            >
              {method.name}
            </span>
            {method.badge && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 font-mono ${method.badgeColor}`}
              >
                {method.badge}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {method.description}
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              {method.processingTime}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[oklch(0.72_0.18_145)]">
              <Zap className="w-3 h-3" />
              Fee: {method.fee}
            </span>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 mt-1 shrink-0 transition-colors ${
            selected ? "text-primary" : "text-muted-foreground/40"
          }`}
        />
      </div>
    </button>
  );
}

// ─── UPI Deposit Section ────────────────────────────────────────────────────────

function UPIDepositSection({
  amount,
  upiId,
  onUpiIdChange,
}: {
  amount: string;
  upiId: string;
  onUpiIdChange: (v: string) => void;
}) {
  const utrRef = useMemo(() => {
    const digits = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 10),
    ).join("");
    return digits;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono font-semibold text-primary uppercase tracking-widest">
          UPI Payment Details
        </span>
      </div>

      {/* UPI ID input */}
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Your UPI ID
        </Label>
        <Input
          data-ocid="payments.upi_id.input"
          placeholder="yourname@upi (e.g. 9876543210@ybl)"
          value={upiId}
          onChange={(e) => onUpiIdChange(e.target.value)}
          className="font-mono bg-card/80 border-border focus:border-primary/60 text-foreground"
        />
      </div>

      {/* Merchant VPA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Pay To (Merchant VPA)
          </Label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <Smartphone className="w-4 h-4 text-primary shrink-0" />
            <span className="font-mono text-sm text-primary font-semibold">
              vertex@ybl
            </span>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Scan QR Code
          </Label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg bg-card/40 h-24 gap-2">
            <QrCode className="w-8 h-8 text-primary/50" />
            <span className="text-[11px] font-mono text-muted-foreground">
              Scan to Pay
            </span>
          </div>
        </div>
      </div>

      {/* UTR Reference */}
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Reference / UTR Number
        </Label>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
          <span className="font-mono text-sm text-foreground/70 tracking-wider">
            {utrRef}
          </span>
          <Badge
            variant="outline"
            className="ml-auto text-[10px] font-mono bg-muted/20 border-border text-muted-foreground"
          >
            Auto-generated
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-2.5 rounded-md border border-primary/15 bg-card/40 p-3">
        <Info className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
        <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
          Open your UPI app, scan the QR code or enter the VPA{" "}
          <span className="text-primary">vertex@ybl</span>, enter the amount{" "}
          {amount ? <span className="text-primary">${amount}</span> : "below"},
          and confirm payment. Funds will be credited within seconds.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Deposit Panel ─────────────────────────────────────────────────────────────

function DepositPanel() {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const method = DEPOSIT_METHODS.find((m) => m.id === selectedMethod)!;

  const numAmount = Number(amount) || 0;
  const feeRate = method.fee.includes("%")
    ? Number.parseFloat(method.fee) / 100
    : 0;
  const feeAmount = numAmount * feeRate;
  const totalReceived = numAmount - feeAmount;
  const isValid =
    numAmount >= method.minAmount && numAmount <= method.maxAmount;

  const isUPI = selectedMethod === "upi";

  const handleDeposit = async () => {
    if (!isValid) return;
    if (isUPI && !upiId) {
      toast.error("Please enter your UPI ID");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast.success(`Deposit of ${formatCurrency(numAmount)} initiated`, {
      description: `Processing via ${method.name}. ${method.processingTime}.`,
    });
    setAmount("");
    setUpiId("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* Payment Methods */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
          Select Payment Method
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEPOSIT_METHODS.map((m) => (
            <MethodCard
              key={m.id}
              method={m}
              selected={selectedMethod === m.id}
              onSelect={() => setSelectedMethod(m.id)}
            />
          ))}
        </div>
      </div>

      {/* Amount + Summary */}
      <div className="space-y-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
          Deposit Amount
        </div>

        {/* UPI-specific section */}
        {isUPI && (
          <UPIDepositSection
            amount={amount}
            upiId={upiId}
            onUpiIdChange={setUpiId}
          />
        )}

        {/* Preset amounts */}
        <div className="grid grid-cols-3 gap-2">
          {DEPOSIT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              data-ocid={`payments.preset_${preset}.button`}
              onClick={() => setAmount(String(preset))}
              className={`rounded-md border py-2 text-sm font-mono font-semibold transition-all ${
                Number(amount) === preset
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-card/60 text-foreground/70 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              ${preset >= 1000 ? `${preset / 1000}K` : preset}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Custom Amount (USD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="payments.amount.input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
            />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Min: {formatCurrency(method.minAmount)} · Max:{" "}
            {formatCurrency(method.maxAmount)}
          </div>
        </div>

        {/* Fee breakdown */}
        {numAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-2"
          >
            <div className="flex justify-between text-sm font-mono">
              <span className="text-muted-foreground">Deposit amount</span>
              <span className="text-foreground">
                {formatCurrency(numAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-muted-foreground">
                Processing fee ({method.fee})
              </span>
              <span className="text-muted-foreground">
                {feeRate > 0 ? `-${formatCurrency(feeAmount)}` : "Free"}
              </span>
            </div>
            <Separator className="bg-border/60" />
            <div className="flex justify-between text-sm font-mono font-bold">
              <span className="text-foreground">You will receive</span>
              <span className="text-primary">
                {formatCurrency(totalReceived)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Security badges */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[oklch(0.72_0.18_145)]" />
            SSL Secured
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-[oklch(0.72_0.18_145)]" />
            Encrypted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[oklch(0.72_0.18_145)]" />
            Regulated
          </span>
        </div>

        <Button
          data-ocid="payments.deposit.submit_button"
          onClick={handleDeposit}
          disabled={!isValid || isSubmitting}
          className="w-full h-11 font-mono font-semibold text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 transition-all"
          variant="outline"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 mr-2" />
          )}
          {isSubmitting
            ? "Processing..."
            : isUPI
              ? `Verify & Deposit${numAmount > 0 ? ` ${formatCurrency(numAmount)}` : ""}`
              : `Deposit ${numAmount > 0 ? formatCurrency(numAmount) : ""}`}
        </Button>
      </div>
    </div>
  );
}

// ─── Withdraw Panel ────────────────────────────────────────────────────────────

function WithdrawPanel({ kycStatus }: { kycStatus: KYCStatus }) {
  const { data: balance } = useBalance();
  const { accountMode } = useAccountMode();
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [amount, setAmount] = useState("");
  const [withdrawUpiId, setWithdrawUpiId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAmountInput, setConfirmAmountInput] = useState("");
  const method = WITHDRAW_METHODS.find((m) => m.id === selectedMethod)!;

  const numAmount = Number(amount) || 0;
  const availableBalance = balance ?? 0;
  const isKYCBlocked = kycStatus === "unverified" || kycStatus === "pending";
  const isValid =
    !isKYCBlocked &&
    numAmount >= method.minAmount &&
    numAmount <= Math.min(method.maxAmount, availableBalance);

  const isUPI = selectedMethod === "upi";

  const handleWithdraw = async () => {
    if (!isValid) return;
    if (isUPI && !withdrawUpiId) {
      toast.error("Please enter your UPI ID");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    toast.success(`Withdrawal of ${formatCurrency(numAmount)} submitted`, {
      description: `Processing via ${method.name}. ${method.processingTime}.`,
    });
    setAmount("");
    setWithdrawUpiId("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* Payment Methods */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
          Select Withdrawal Method
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {WITHDRAW_METHODS.map((m) => (
            <MethodCard
              key={m.id}
              method={m}
              selected={selectedMethod === m.id}
              onSelect={() => setSelectedMethod(m.id)}
            />
          ))}
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2.5 rounded-lg border border-[oklch(0.28_0.08_55)] bg-[oklch(0.18_0.04_55)] p-3 mt-2">
          <AlertCircle className="w-4 h-4 text-[oklch(0.75_0.15_55)] mt-0.5 shrink-0" />
          <p className="text-xs text-[oklch(0.75_0.15_55)] font-mono leading-relaxed">
            Withdrawals are processed within{" "}
            {method.processingTime.toLowerCase()}. Funds must be verified before
            withdrawal. Maximum withdrawal per day: $50,000.
          </p>
        </div>
      </div>

      {/* Amount + Summary */}
      <div className="space-y-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
          Withdrawal Amount
        </div>

        {/* KYC block notice */}
        {isKYCBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-[oklch(0.36_0.12_55)] bg-[oklch(0.16_0.05_55)] p-4 flex items-start gap-3"
          >
            <ShieldAlert className="w-4 h-4 text-[oklch(0.75_0.18_55)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-mono text-[oklch(0.85_0.18_55)] font-semibold">
                KYC Required for Withdrawals
              </p>
              <p className="text-xs text-[oklch(0.65_0.12_55)] mt-1">
                Complete identity verification to enable withdrawals.
              </p>
              <Link to="/kyc" className="mt-2 inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs bg-[oklch(0.22_0.08_55)] border-[oklch(0.36_0.12_55)] text-[oklch(0.85_0.18_55)] hover:bg-[oklch(0.26_0.1_55)] mt-1"
                >
                  <ShieldCheck className="w-3 h-3 mr-1.5" />
                  {kycStatus === "pending" ? "KYC Under Review" : "Start KYC"}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Available balance */}
        <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Available to withdraw
          </span>
          <span className="font-mono font-bold text-primary">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        {/* UPI ID for withdraw */}
        {isUPI && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Your UPI ID
            </Label>
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-ocid="payments.upi_vpa.input"
                placeholder="yourname@upi (e.g. 9876543210@ybl)"
                value={withdrawUpiId}
                onChange={(e) => setWithdrawUpiId(e.target.value)}
                className="pl-9 font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
              />
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Funds will be transferred to this UPI ID within 30 minutes
            </div>
          </motion.div>
        )}

        {/* Preset amounts */}
        <div className="grid grid-cols-3 gap-2">
          {WITHDRAW_PRESETS.filter((p) => p <= availableBalance).map(
            (preset) => (
              <button
                key={preset}
                type="button"
                data-ocid={`payments.withdraw_preset_${preset}.button`}
                onClick={() => setAmount(String(preset))}
                disabled={isKYCBlocked}
                className={`rounded-md border py-2 text-sm font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  Number(amount) === preset
                    ? "border-[oklch(0.65_0.22_25)/60] bg-[oklch(0.65_0.22_25)/15] text-[oklch(0.65_0.22_25)]"
                    : "border-border bg-card/60 text-foreground/70 hover:border-[oklch(0.65_0.22_25)/40] hover:text-foreground"
                }`}
              >
                ${preset >= 1000 ? `${preset / 1000}K` : preset}
              </button>
            ),
          )}
          <button
            type="button"
            data-ocid="payments.withdraw_all.button"
            onClick={() => setAmount(String(availableBalance))}
            disabled={isKYCBlocked}
            className="rounded-md border py-2 text-sm font-mono font-semibold border-border bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            All
          </button>
        </div>

        {/* Custom amount */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Amount (USD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="payments.withdraw.input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isKYCBlocked}
              className="pl-9 font-mono bg-card/60 border-border focus:border-primary/60 text-foreground disabled:opacity-40"
            />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            Min: {formatCurrency(method.minAmount)} · Max:{" "}
            {formatCurrency(Math.min(method.maxAmount, availableBalance))}
          </div>
        </div>

        {/* Real account warning */}
        {accountMode === "real" && numAmount > 0 && (
          <motion.div
            data-ocid="payments.real_account.warning"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border border-[oklch(0.55_0.22_55)] bg-[oklch(0.18_0.06_55)] p-3.5"
          >
            <AlertTriangle className="w-4 h-4 text-[oklch(0.75_0.2_55)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-mono font-semibold text-[oklch(0.88_0.18_55)]">
                LIVE ACCOUNT — Real funds will be withdrawn
              </p>
              <p className="text-xs text-[oklch(0.65_0.12_55)] mt-0.5">
                This withdrawal will deduct real money from your account. Ensure
                all details are correct before confirming.
              </p>
            </div>
          </motion.div>
        )}

        <Button
          data-ocid="payments.withdraw.submit_button"
          onClick={() => {
            if (accountMode === "real") {
              setConfirmAmountInput("");
              setShowConfirmDialog(true);
            } else {
              handleWithdraw();
            }
          }}
          disabled={!isValid || isSubmitting || isKYCBlocked}
          className="w-full h-11 font-mono font-semibold text-sm bg-[oklch(0.62_0.22_25)/15] hover:bg-[oklch(0.62_0.22_25)/25] text-loss border border-loss/30 hover:border-loss/50 transition-all disabled:opacity-40"
          variant="outline"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowUpRight className="w-4 h-4 mr-2" />
          )}
          {isSubmitting
            ? "Processing..."
            : `Withdraw ${numAmount > 0 ? formatCurrency(numAmount) : ""}`}
        </Button>

        {/* Real Account Withdrawal Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent
            data-ocid="payments.withdraw_confirm.dialog"
            className="bg-card border border-destructive/30 font-mono max-w-md"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Confirm Withdrawal
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-left">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You are about to withdraw{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(numAmount)}
                    </span>{" "}
                    from your{" "}
                    <span className="font-semibold text-[oklch(0.65_0.22_145)]">
                      Real Account
                    </span>
                    . Real funds will be deducted immediately.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To confirm, type the amount below:
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-widest">
                      Type amount to confirm
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-ocid="payments.withdraw_confirm.input"
                        placeholder={String(numAmount)}
                        value={confirmAmountInput}
                        onChange={(e) => setConfirmAmountInput(e.target.value)}
                        autoFocus
                        className="pl-9 font-mono bg-background border-border focus:border-destructive/60 text-foreground"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Enter exactly: {numAmount}
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                data-ocid="payments.withdraw_confirm.cancel_button"
                onClick={() => setShowConfirmDialog(false)}
                className="font-mono text-sm"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="payments.withdraw_confirm.confirm_button"
                disabled={
                  !(
                    confirmAmountInput.trim() === String(numAmount) ||
                    Number(confirmAmountInput) === numAmount
                  )
                }
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleWithdraw();
                }}
                className="font-mono text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Confirm Withdrawal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Transaction History ────────────────────────────────────────────────────────

function TransactionHistory() {
  return (
    <div className="space-y-1" data-ocid="payments.history.table">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted/40 rounded-t-lg border border-border border-b-0">
        {["", "Method", "Amount", "Status", "Date"].map((h) => (
          <div
            key={h}
            className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
          >
            {h}
          </div>
        ))}
      </div>

      <div className="border border-border rounded-b-lg divide-y divide-border overflow-hidden">
        {RECENT_TRANSACTIONS.map((txn, i) => (
          <motion.div
            key={txn.id}
            data-ocid={`payments.history.item.${i + 1}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3.5 items-center hover:bg-accent/30 transition-colors"
          >
            {/* Icon */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                txn.type === "deposit"
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-loss/10 border border-loss/20"
              }`}
            >
              {txn.type === "deposit" ? (
                <ArrowDownLeft
                  className={`w-3.5 h-3.5 ${txn.type === "deposit" ? "text-primary" : "text-loss"}`}
                />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 text-loss" />
              )}
            </div>

            {/* Method */}
            <div>
              <div className="text-sm font-semibold font-mono capitalize">
                {txn.type === "deposit" ? "Deposit" : "Withdrawal"}
              </div>
              <div className="text-xs text-muted-foreground">{txn.method}</div>
            </div>

            {/* Amount */}
            <span
              className={`font-mono text-sm font-bold ${
                txn.type === "deposit" ? "text-primary" : "text-loss"
              }`}
            >
              {txn.type === "deposit" ? "+" : "-"}
              {formatCurrency(txn.amount)}
            </span>

            {/* Status */}
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-2 py-0 h-5 ${
                txn.status === "completed"
                  ? "bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)]"
                  : "bg-[oklch(0.22_0.08_55)] text-[oklch(0.75_0.15_55)] border-[oklch(0.36_0.1_55)]"
              }`}
            >
              {txn.status === "completed" ? (
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              ) : (
                <Clock className="w-2.5 h-2.5 mr-1" />
              )}
              {txn.status}
            </Badge>

            {/* Date */}
            <div className="text-xs text-muted-foreground font-mono text-right">
              <div>{txn.date}</div>
              <div className="text-[10px] opacity-60">{txn.ref}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Payments Page ────────────────────────────────────────────────────────

export function Payments() {
  const { data: balance } = useBalance();
  const [kycStatus] = useState<KYCStatus>(() => getKYCStatus());

  const isKYCBlocked = kycStatus === "unverified" || kycStatus === "pending";

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-6"
      data-ocid="payments.page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Payments
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Deposit and withdraw funds from your trading account
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
            Account Balance
          </div>
          <div className="font-mono text-xl font-bold text-primary">
            {balance !== undefined ? formatCurrency(balance) : "—"}
          </div>
        </div>
      </motion.div>

      {/* KYC Banner */}
      <KYCBanner status={kycStatus} />

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Total Deposited",
            value: "$6,500.00",
            icon: ArrowDownLeft,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Total Withdrawn",
            value: "$2,000.00",
            icon: ArrowUpRight,
            color: "text-loss",
            bg: "bg-loss/10",
          },
          {
            label: "Pending",
            value: "$2,000.00",
            icon: Clock,
            color: "text-[oklch(0.75_0.15_55)]",
            bg: "bg-[oklch(0.22_0.08_55)]",
          },
          {
            label: "Net Deposits",
            value: "$4,500.00",
            icon: Wallet,
            color: "text-chart-1",
            bg: "bg-chart-1/10",
          },
        ].map((s, _i) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="glow-card bg-card border-border relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 opacity-5 blur-2xl bg-primary rounded-full" />
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${s.bg}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    {s.label}
                  </span>
                </div>
                <div className={`font-mono text-base font-bold ${s.color}`}>
                  {s.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Main Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <Tabs defaultValue="deposit" className="space-y-5">
          <TabsList
            className="bg-card border border-border h-10 p-1"
            data-ocid="payments.main.tab"
          >
            <TabsTrigger
              value="deposit"
              data-ocid="payments.deposit.tab"
              className="font-mono text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" />
              Deposit
            </TabsTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="withdraw"
                    data-ocid="payments.withdraw.tab"
                    className="font-mono text-sm data-[state=active]:bg-loss/20 data-[state=active]:text-loss data-[state=active]:border data-[state=active]:border-loss/30"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                    Withdraw
                    {isKYCBlocked && (
                      <ShieldAlert className="w-3 h-3 ml-1.5 text-[oklch(0.75_0.18_55)]" />
                    )}
                  </TabsTrigger>
                </TooltipTrigger>
                {isKYCBlocked && (
                  <TooltipContent
                    side="bottom"
                    className="font-mono text-xs bg-card border-border"
                  >
                    Complete KYC to enable withdrawals
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TabsTrigger
              value="history"
              data-ocid="payments.history.tab"
              className="font-mono text-sm data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="mt-0">
            <Card className="glow-card bg-card border-border">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <ArrowDownLeft className="w-4 h-4 text-primary" />
                  Deposit Funds
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] font-mono bg-primary/10 text-primary border-primary/30"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    Verified Account
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <DepositPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="mt-0">
            <Card className="glow-card bg-card border-border">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <ArrowUpRight className="w-4 h-4 text-loss" />
                  Withdraw Funds
                  <Badge
                    variant="outline"
                    className="ml-auto text-[10px] font-mono bg-[oklch(0.22_0.08_55)] text-[oklch(0.75_0.15_55)] border-[oklch(0.36_0.1_55)]"
                  >
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    KYC Required
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <WithdrawPanel kycStatus={kycStatus} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="glow-card bg-card border-border">
              <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-chart-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <TransactionHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
