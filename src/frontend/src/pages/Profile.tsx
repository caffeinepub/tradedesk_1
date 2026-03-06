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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAccountMode } from "@/context/AccountModeContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { usePIN } from "@/hooks/usePIN";
import { useBalance } from "@/hooks/useQueries";
import { type KYCStatus, getKYCStatus } from "@/pages/KYC";
import { formatCurrency } from "@/utils/format";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  KeyRound,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, type Variants, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

// ─── Security PIN Card ──────────────────────────────────────────────────────────

type SetPinStep = "enter" | "confirm" | "success";
type ChangePinStep = "current" | "new" | "confirm" | "success";

type ResetPinStep = "verify" | "new" | "confirm" | "success";

function SecurityPINCard() {
  const { hasPin, setPin, removePin, verifyPin, resetPin } = usePIN();

  // ── Set PIN dialog ──
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [setPinStep, setSetPinStep] = useState<SetPinStep>("enter");
  const [newPinValue, setNewPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [setPinError, setSetPinError] = useState(false);

  // ── Change PIN dialog ──
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [changePinStep, setChangePinStep] = useState<ChangePinStep>("current");
  const [currentPinValue, setCurrentPinValue] = useState("");
  const [changeNewPinValue, setChangeNewPinValue] = useState("");
  const [changeConfirmPinValue, setChangeConfirmPinValue] = useState("");
  const [changePinError, setChangePinError] = useState(false);

  // ── Remove PIN dialog ──
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removePinValue, setRemovePinValue] = useState("");
  const [removePinError, setRemovePinError] = useState(false);

  // ── Reset PIN dialog ──
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState<ResetPinStep>("verify");
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [resetError, setResetError] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>("unverified");

  // ── Handlers: Set PIN ──
  const handleOpenSetDialog = () => {
    setSetPinStep("enter");
    setNewPinValue("");
    setConfirmPinValue("");
    setSetPinError(false);
    setShowSetDialog(true);
  };

  const handleSetPinNext = () => {
    if (setPinStep === "enter") {
      if (newPinValue.length === 6) {
        setSetPinStep("confirm");
        setConfirmPinValue("");
        setSetPinError(false);
      }
    } else if (setPinStep === "confirm") {
      if (confirmPinValue === newPinValue) {
        setPin(newPinValue);
        setSetPinStep("success");
        setTimeout(() => {
          setShowSetDialog(false);
        }, 1800);
      } else {
        setSetPinError(true);
        setConfirmPinValue("");
      }
    }
  };

  // ── Handlers: Change PIN ──
  const handleOpenChangeDialog = () => {
    setChangePinStep("current");
    setCurrentPinValue("");
    setChangeNewPinValue("");
    setChangeConfirmPinValue("");
    setChangePinError(false);
    setShowChangeDialog(true);
  };

  const handleChangePinNext = () => {
    if (changePinStep === "current") {
      if (verifyPin(currentPinValue)) {
        setChangePinStep("new");
        setChangePinError(false);
      } else {
        setChangePinError(true);
        setCurrentPinValue("");
      }
    } else if (changePinStep === "new") {
      if (changeNewPinValue.length === 6) {
        setChangePinStep("confirm");
        setChangeConfirmPinValue("");
        setChangePinError(false);
      }
    } else if (changePinStep === "confirm") {
      if (changeConfirmPinValue === changeNewPinValue) {
        setPin(changeNewPinValue);
        setChangePinStep("success");
        toast.success("PIN updated successfully");
        setTimeout(() => {
          setShowChangeDialog(false);
        }, 1800);
      } else {
        setChangePinError(true);
        setChangeConfirmPinValue("");
      }
    }
  };

  // ── Handlers: Remove PIN ──
  const handleOpenRemoveDialog = () => {
    setRemovePinValue("");
    setRemovePinError(false);
    setShowRemoveDialog(true);
  };

  const handleRemovePin = () => {
    if (verifyPin(removePinValue)) {
      removePin();
      setShowRemoveDialog(false);
      toast.success("Security PIN removed");
    } else {
      setRemovePinError(true);
      setRemovePinValue("");
    }
  };

  // ── Handlers: Reset PIN (via KYC) ──
  const handleForgotPin = () => {
    setShowChangeDialog(false);
    setKycStatus(getKYCStatus());
    setResetStep("verify");
    setResetNewPin("");
    setResetConfirmPin("");
    setResetError(false);
    setShowResetDialog(true);
  };

  const handleResetPinSubmit = () => {
    if (resetStep === "new") {
      if (resetNewPin.length === 6) {
        setResetStep("confirm");
        setResetConfirmPin("");
        setResetError(false);
      }
    } else if (resetStep === "confirm") {
      if (resetConfirmPin === resetNewPin) {
        resetPin(resetNewPin);
        setResetStep("success");
        toast.success("PIN reset successfully");
        setTimeout(() => {
          setShowResetDialog(false);
        }, 1800);
      } else {
        setResetError(true);
        setResetConfirmPin("");
      }
    }
  };

  return (
    <>
      <Card className="glow-card bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Security PIN
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Protects large withdrawals (≥ $1,000)
          </p>
        </CardHeader>
        <CardContent>
          {!hasPin ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                <AlertCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-mono font-semibold text-foreground/80">
                    No security PIN configured
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Set a 6-digit PIN to protect your withdrawals from
                    unauthorised access.
                  </p>
                </div>
              </div>
              <Button
                data-ocid="profile.set_pin.button"
                onClick={handleOpenSetDialog}
                variant="outline"
                className="font-mono text-sm border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Set PIN
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[oklch(0.22_0.08_145)] border border-[oklch(0.36_0.12_145)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-[oklch(0.72_0.18_145)]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      PIN Active
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)] px-1.5 py-0 h-4"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <span className="font-mono text-lg tracking-[0.35em] text-muted-foreground select-none">
                    ●●●●●●
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  data-ocid="profile.change_pin.button"
                  onClick={handleOpenChangeDialog}
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs border-border hover:border-primary/40 hover:text-primary"
                >
                  Change PIN
                </Button>
                <Button
                  data-ocid="profile.remove_pin.button"
                  onClick={handleOpenRemoveDialog}
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs border-destructive/30 text-destructive/70 hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Set PIN Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={showSetDialog}
        onOpenChange={(open) => {
          if (!open && setPinStep !== "success") setShowSetDialog(false);
        }}
      >
        <DialogContent
          data-ocid="profile.set_pin.dialog"
          className="bg-card border-border font-mono max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              {setPinStep === "success" ? "PIN Set!" : "Set Security PIN"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {setPinStep === "enter" &&
                "Choose a 6-digit PIN for your account."}
              {setPinStep === "confirm" && "Re-enter your PIN to confirm."}
              {setPinStep === "success" && "Your PIN has been saved securely."}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {setPinStep === "success" ? (
              <motion.div
                key="set-success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-[oklch(0.22_0.08_145)] border-2 border-[oklch(0.5_0.18_145)] flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.18_145)]" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-mono text-center">
                  PIN set successfully. You can now use it to authorise large
                  withdrawals.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={setPinStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  {setPinStep === "enter"
                    ? "Enter new 6-digit PIN"
                    : "Confirm PIN"}
                </p>

                <motion.div
                  animate={
                    setPinError && setPinStep === "confirm"
                      ? {
                          x: [0, -8, 8, -6, 6, -4, 4, 0],
                          transition: { duration: 0.45 },
                        }
                      : {}
                  }
                >
                  <InputOTP
                    data-ocid={
                      setPinStep === "enter"
                        ? "profile.set_pin.input"
                        : "profile.set_pin.confirm_input"
                    }
                    maxLength={6}
                    value={
                      setPinStep === "enter" ? newPinValue : confirmPinValue
                    }
                    onChange={(v) => {
                      if (setPinStep === "enter") {
                        setNewPinValue(v);
                      } else {
                        setConfirmPinValue(v);
                        setSetPinError(false);
                      }
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-10 text-base font-mono font-bold bg-background border-border data-[active=true]:border-primary data-[active=true]:ring-primary/30 text-foreground"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </motion.div>

                {setPinError && setPinStep === "confirm" && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-mono text-destructive flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    PINs do not match. Try again.
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {setPinStep !== "success" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSetDialog(false)}
                className="font-mono text-sm"
              >
                Cancel
              </Button>
              <Button
                data-ocid="profile.set_pin.submit_button"
                onClick={handleSetPinNext}
                disabled={
                  setPinStep === "enter"
                    ? newPinValue.length !== 6
                    : confirmPinValue.length !== 6
                }
                className="font-mono text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 disabled:opacity-40"
                variant="outline"
              >
                {setPinStep === "enter" ? "Next →" : "Set PIN"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Change PIN Dialog ──────────────────────────────────────── */}
      <Dialog
        open={showChangeDialog}
        onOpenChange={(open) => {
          if (!open && changePinStep !== "success") setShowChangeDialog(false);
        }}
      >
        <DialogContent
          data-ocid="profile.change_pin.dialog"
          className="bg-card border-border font-mono max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              {changePinStep === "success" ? "PIN Updated!" : "Change PIN"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {changePinStep === "current" && "Enter your current PIN first."}
              {changePinStep === "new" && "Choose your new 6-digit PIN."}
              {changePinStep === "confirm" && "Confirm your new PIN."}
              {changePinStep === "success" && "Your PIN has been updated."}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {changePinStep === "success" ? (
              <motion.div
                key="change-success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-[oklch(0.22_0.08_145)] border-2 border-[oklch(0.5_0.18_145)] flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.18_145)]" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-mono text-center">
                  PIN updated successfully.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={changePinStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-widest">
                  {changePinStep === "current"
                    ? "Enter current PIN"
                    : changePinStep === "new"
                      ? "Enter new 6-digit PIN"
                      : "Confirm new PIN"}
                </p>

                <motion.div
                  animate={
                    changePinError
                      ? {
                          x: [0, -8, 8, -6, 6, -4, 4, 0],
                          transition: { duration: 0.45 },
                        }
                      : {}
                  }
                >
                  <InputOTP
                    data-ocid={
                      changePinStep === "current"
                        ? "profile.change_pin.current_input"
                        : changePinStep === "new"
                          ? "profile.change_pin.new_input"
                          : "profile.change_pin.confirm_input"
                    }
                    maxLength={6}
                    value={
                      changePinStep === "current"
                        ? currentPinValue
                        : changePinStep === "new"
                          ? changeNewPinValue
                          : changeConfirmPinValue
                    }
                    onChange={(v) => {
                      setChangePinError(false);
                      if (changePinStep === "current") setCurrentPinValue(v);
                      else if (changePinStep === "new") setChangeNewPinValue(v);
                      else setChangeConfirmPinValue(v);
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-10 text-base font-mono font-bold bg-background border-border data-[active=true]:border-primary data-[active=true]:ring-primary/30 text-foreground"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </motion.div>

                {changePinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-mono text-destructive flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {changePinStep === "current"
                      ? "Incorrect PIN. Try again."
                      : "PINs do not match. Try again."}
                  </motion.p>
                )}

                {changePinStep === "current" && (
                  <Button
                    data-ocid="profile.forgot_pin.button"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleForgotPin}
                    className="text-xs text-muted-foreground hover:text-primary font-mono gap-1.5 h-7 px-2 mt-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Forgot PIN?
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {changePinStep !== "success" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowChangeDialog(false)}
                className="font-mono text-sm"
              >
                Cancel
              </Button>
              <Button
                data-ocid="profile.change_pin.submit_button"
                onClick={handleChangePinNext}
                disabled={
                  changePinStep === "current"
                    ? currentPinValue.length !== 6
                    : changePinStep === "new"
                      ? changeNewPinValue.length !== 6
                      : changeConfirmPinValue.length !== 6
                }
                className="font-mono text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 disabled:opacity-40"
                variant="outline"
              >
                {changePinStep === "confirm" ? "Update PIN" : "Next →"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Remove PIN Dialog ──────────────────────────────────────── */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent
          data-ocid="profile.remove_pin.dialog"
          className="bg-card border-border font-mono max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-destructive">
              <div className="w-8 h-8 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              Remove Security PIN
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Enter your current PIN to confirm removal. Withdrawals ≥ $1,000
              will no longer require verification.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Enter current PIN to confirm
            </p>

            <motion.div
              animate={
                removePinError
                  ? {
                      x: [0, -8, 8, -6, 6, -4, 4, 0],
                      transition: { duration: 0.45 },
                    }
                  : {}
              }
            >
              <InputOTP
                data-ocid="profile.remove_pin.input"
                maxLength={6}
                value={removePinValue}
                onChange={(v) => {
                  setRemovePinValue(v);
                  setRemovePinError(false);
                }}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-10 text-base font-mono font-bold bg-background border-destructive/30 data-[active=true]:border-destructive data-[active=true]:ring-destructive/20 text-foreground"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </motion.div>

            {removePinError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-mono text-destructive flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Incorrect PIN. Try again.
              </motion.p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              data-ocid="profile.remove_pin.cancel_button"
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              className="font-mono text-sm"
            >
              Cancel
            </Button>
            <Button
              data-ocid="profile.remove_pin.confirm_button"
              onClick={handleRemovePin}
              disabled={removePinValue.length !== 6}
              className="font-mono text-sm bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 hover:border-destructive/60 disabled:opacity-40"
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset PIN Dialog (via KYC) ────────────────────────────── */}
      <Dialog
        open={showResetDialog}
        onOpenChange={(open) => {
          if (!open && resetStep !== "success") setShowResetDialog(false);
        }}
      >
        <DialogContent
          data-ocid="profile.reset_pin.dialog"
          className="bg-card border-border font-mono max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-primary" />
              </div>
              {resetStep === "success" ? "PIN Reset!" : "Reset Security PIN"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {resetStep === "verify" &&
                "Verify your identity to reset your PIN."}
              {resetStep === "new" &&
                "Choose a new 6-digit PIN for your account."}
              {resetStep === "confirm" &&
                "Confirm your new PIN to complete the reset."}
              {resetStep === "success" &&
                "Your PIN has been reset successfully."}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* ── Success Step ── */}
            {resetStep === "success" ? (
              <motion.div
                key="reset-success"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-[oklch(0.22_0.08_145)] border-2 border-[oklch(0.5_0.18_145)] flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.18_145)]" />
                </motion.div>
                <p className="text-sm text-muted-foreground font-mono text-center">
                  PIN reset successfully. Your account is now secured with your
                  new PIN.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={resetStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4 py-4"
              >
                {/* ── Verify Step ── */}
                {resetStep === "verify" && (
                  <div className="w-full space-y-4">
                    {/* KYC icon header */}
                    <div className="flex flex-col items-center gap-2 pb-2">
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-primary/70" />
                      </div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">
                        Identity Verification
                      </p>
                    </div>

                    {/* KYC Unverified */}
                    {kycStatus === "unverified" && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-destructive">
                              KYC Verification Required
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              You must complete KYC verification before you can
                              reset your PIN. This protects your account from
                              unauthorised access.
                            </p>
                          </div>
                        </div>
                        <Link
                          to="/kyc"
                          onClick={() => setShowResetDialog(false)}
                        >
                          <Button
                            data-ocid="profile.reset_pin.go_kyc.button"
                            variant="outline"
                            size="sm"
                            className="w-full font-mono text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive/60"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                            Complete KYC Verification
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* KYC Pending */}
                    {kycStatus === "pending" && (
                      <div className="rounded-lg border border-[oklch(0.55_0.15_55)/40] bg-[oklch(0.20_0.06_55)] p-4 space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-[oklch(0.75_0.15_55)] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-[oklch(0.85_0.12_55)]">
                              KYC Under Review
                            </p>
                            <p className="text-xs text-[oklch(0.65_0.08_55)] mt-1 leading-relaxed">
                              Your KYC is under review. You can still reset your
                              PIN — access will be fully restored once
                              verification completes.
                            </p>
                          </div>
                        </div>
                        <Button
                          data-ocid="profile.reset_pin.continue_button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetStep("new");
                            setResetError(false);
                          }}
                          className="w-full font-mono text-xs border-[oklch(0.45_0.12_55)/50] text-[oklch(0.75_0.15_55)] hover:bg-[oklch(0.26_0.08_55)] hover:border-[oklch(0.55_0.15_55)/60]"
                        >
                          Continue to Reset →
                        </Button>
                      </div>
                    )}

                    {/* KYC Verified (level1 or level2) */}
                    {(kycStatus === "level1" || kycStatus === "level2") && (
                      <div className="rounded-lg border border-[oklch(0.5_0.18_145)/30] bg-[oklch(0.18_0.06_145)] p-4 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[oklch(0.22_0.08_145)] border border-[oklch(0.36_0.12_145)] flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.18_145)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[oklch(0.85_0.12_145)]">
                              KYC Verified
                            </p>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono bg-[oklch(0.22_0.08_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.36_0.12_145)] px-1.5 py-0 h-4 mt-0.5"
                            >
                              {kycStatus === "level1" ? "Level 1" : "Level 2"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-[oklch(0.60_0.08_145)] leading-relaxed">
                          Your identity has been verified. You can now securely
                          reset your PIN.
                        </p>
                        <Button
                          data-ocid="profile.reset_pin.continue_button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetStep("new");
                            setResetError(false);
                          }}
                          className="w-full font-mono text-xs border-[oklch(0.36_0.12_145)] text-[oklch(0.72_0.18_145)] hover:bg-[oklch(0.22_0.08_145)] hover:border-[oklch(0.5_0.18_145)/50]"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                          Continue to Reset →
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── New PIN Step ── */}
                {(resetStep === "new" || resetStep === "confirm") && (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                      {resetStep === "new"
                        ? "Enter new 6-digit PIN"
                        : "Confirm new PIN"}
                    </p>

                    <motion.div
                      animate={
                        resetError && resetStep === "confirm"
                          ? {
                              x: [0, -8, 8, -6, 6, -4, 4, 0],
                              transition: { duration: 0.45 },
                            }
                          : {}
                      }
                    >
                      {resetStep === "new" ? (
                        <InputOTP
                          data-ocid="profile.reset_pin.new_input"
                          maxLength={6}
                          value={resetNewPin}
                          onChange={(v) => {
                            setResetNewPin(v);
                            setResetError(false);
                          }}
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className="h-12 w-10 text-base font-mono font-bold bg-background border-border data-[active=true]:border-primary data-[active=true]:ring-primary/30 text-foreground"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      ) : (
                        <InputOTP
                          data-ocid="profile.reset_pin.confirm_input"
                          maxLength={6}
                          value={resetConfirmPin}
                          onChange={(v) => {
                            setResetConfirmPin(v);
                            setResetError(false);
                          }}
                        >
                          <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className="h-12 w-10 text-base font-mono font-bold bg-background border-border data-[active=true]:border-primary data-[active=true]:ring-primary/30 text-foreground"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    </motion.div>

                    {resetError && resetStep === "confirm" && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-mono text-destructive flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        PINs do not match.
                      </motion.p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {resetStep !== "success" && (
            <DialogFooter className="gap-2">
              <Button
                data-ocid="profile.reset_pin.cancel_button"
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                className="font-mono text-sm"
              >
                Cancel
              </Button>

              {/* Show Next/Reset PIN only on new and confirm steps */}
              {(resetStep === "new" || resetStep === "confirm") && (
                <Button
                  data-ocid="profile.reset_pin.submit_button"
                  onClick={handleResetPinSubmit}
                  disabled={
                    resetStep === "new"
                      ? resetNewPin.length !== 6
                      : resetConfirmPin.length !== 6
                  }
                  className="font-mono text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 disabled:opacity-40"
                  variant="outline"
                >
                  {resetStep === "new" ? "Next →" : "Reset PIN"}
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Profile Page ───────────────────────────────────────────────────────────────

export function Profile() {
  const { accountMode, setAccountMode } = useAccountMode();
  const { theme, setTheme } = useTheme();
  const { identity } = useInternetIdentity();
  const { data: balance } = useBalance();
  const { demoBalance, demoPortfolio, demoTrades, resetDemo } =
    useDemoAccount();
  const [showRealConfirm, setShowRealConfirm] = useState(false);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);

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

      {/* Security PIN */}
      <motion.div
        custom={2}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <SecurityPINCard />
      </motion.div>

      {/* Appearance */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="glow-card bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Appearance
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose your preferred display theme.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {/* Bright Theme Card */}
              <button
                type="button"
                data-ocid="theme.bright_button"
                onClick={() => setTheme("bright")}
                aria-pressed={theme === "bright"}
                className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  theme === "bright"
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60"
                }`}
              >
                {theme === "bright" && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                {/* Preview */}
                <div className="w-full rounded-md overflow-hidden border border-border mb-3 bg-[oklch(0.97_0.005_250)]">
                  <div className="h-2 bg-[oklch(0.96_0.006_250)] border-b border-[oklch(0.87_0.012_250)]" />
                  <div className="p-1.5 flex gap-1">
                    <div className="h-4 w-10 rounded-sm bg-[oklch(0.88_0.012_250)]" />
                    <div className="h-4 w-6 rounded-sm bg-[oklch(0.55_0.18_165)/30]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Bright
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Light mode
                    </div>
                  </div>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                data-ocid="theme.dark_button"
                onClick={() => setTheme("dark")}
                aria-pressed={theme === "dark"}
                className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  theme === "dark"
                    ? "border-primary bg-primary/8 shadow-sm"
                    : "border-border bg-muted/30 hover:border-border/80 hover:bg-muted/60"
                }`}
              >
                {theme === "dark" && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                {/* Preview */}
                <div className="w-full rounded-md overflow-hidden border border-[oklch(0.28_0.012_250)] mb-3 bg-[oklch(0.12_0.005_250)]">
                  <div className="h-2 bg-[oklch(0.10_0.006_250)] border-b border-[oklch(0.22_0.012_250)]" />
                  <div className="p-1.5 flex gap-1">
                    <div className="h-4 w-10 rounded-sm bg-[oklch(0.22_0.01_250)]" />
                    <div className="h-4 w-6 rounded-sm bg-[oklch(0.78_0.18_165)/30]" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Dark
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Terminal mode
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Mode Selector */}
      <motion.div
        custom={4}
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
              <div
                className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  accountMode === "demo"
                    ? "border-[oklch(0.6_0.14_260)] bg-[oklch(0.16_0.06_260)] shadow-[0_0_20px_oklch(0.4_0.14_260/0.15)]"
                    : "border-border bg-card/50"
                }`}
              >
                {accountMode === "demo" && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[oklch(0.6_0.14_260)] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  data-ocid="profile.demo_account.button"
                  onClick={() => setAccountMode("demo")}
                  className="w-full text-left"
                >
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
                      {formatCurrency(demoBalance)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {demoPortfolio.length} position
                      {demoPortfolio.length !== 1 ? "s" : ""} ·{" "}
                      {demoTrades.length} trade
                      {demoTrades.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </button>
                {/* Reset Demo Account button */}
                <div className="mt-3 pt-3 border-t border-[oklch(0.36_0.10_260)/50]">
                  <button
                    type="button"
                    data-ocid="profile.reset_demo.button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowResetDemoConfirm(true);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-[oklch(0.55_0.08_260)] hover:text-[oklch(0.72_0.14_260)] transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Demo Account
                  </button>
                </div>
              </div>

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
        custom={5}
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

      {/* Confirmation dialog: Reset Demo Account */}
      <AlertDialog
        open={showResetDemoConfirm}
        onOpenChange={setShowResetDemoConfirm}
      >
        <AlertDialogContent
          className="bg-card border-border max-w-md"
          data-ocid="profile.reset_demo.dialog"
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-[oklch(0.22_0.06_260)] border border-[oklch(0.36_0.10_260)] flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-[oklch(0.72_0.14_260)]" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Reset Demo Account?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed pl-[52px]">
                <p>
                  This will reset your demo balance back to{" "}
                  <span className="font-semibold text-foreground">$10,000</span>{" "}
                  and clear all simulated positions and trade history.
                </p>
                <p className="text-xs text-[oklch(0.60_0.08_260)]">
                  Only your demo data will be affected. Real account data is
                  untouched.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel
              data-ocid="profile.reset_demo.cancel_button"
              className="font-mono text-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="profile.reset_demo.confirm_button"
              onClick={() => {
                resetDemo();
                toast.success("Demo account reset", {
                  description: "Balance restored to $10,000",
                });
              }}
              className="bg-[oklch(0.30_0.10_260)] hover:bg-[oklch(0.38_0.12_260)] text-[oklch(0.88_0.06_260)] font-mono text-sm border border-[oklch(0.45_0.12_260)]"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Yes, Reset Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
