import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Fingerprint,
  IdCard,
  Info,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type ReviewStatus = "pending" | "approved" | "rejected";

interface KYCApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  dob: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  docType: "passport" | "national_id" | "driving_license";
  frontDoc: string;
  backDoc: string | null;
  selfie: string;
  submittedAt: string;
  status: ReviewStatus;
  rejectionReason?: string;
  rejectionNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const REJECTION_REASONS = [
  "Document expired",
  "Document not readable / blurry",
  "Name mismatch between documents",
  "Selfie does not match ID photo",
  "Document type not accepted",
  "Address proof insufficient",
  "Suspected fraudulent document",
  "Incomplete submission",
  "Other",
];

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_APPLICATIONS: KYCApplication[] = [
  {
    id: "KYC-00231",
    userId: "usr_3f8a12b",
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    dob: "1990-06-15",
    nationality: "Indian",
    address: "42 MG Road, Koramangala",
    city: "Bangalore",
    postalCode: "560034",
    country: "India",
    docType: "passport",
    frontDoc: "passport_rahul_front.jpg",
    backDoc: null,
    selfie: "selfie_rahul.jpg",
    submittedAt: "2026-03-04T09:14:00Z",
    status: "pending",
  },
  {
    id: "KYC-00230",
    userId: "usr_7c4d91e",
    fullName: "Priya Menon",
    email: "priya.menon@example.com",
    dob: "1995-11-22",
    nationality: "Indian",
    address: "7 Anna Salai, Nungambakkam",
    city: "Chennai",
    postalCode: "600034",
    country: "India",
    docType: "national_id",
    frontDoc: "aadhar_priya_front.jpg",
    backDoc: "aadhar_priya_back.jpg",
    selfie: "selfie_priya.jpg",
    submittedAt: "2026-03-03T14:30:00Z",
    status: "approved",
    reviewedBy: "staff@vertex.io",
    reviewedAt: "2026-03-03T16:55:00Z",
  },
  {
    id: "KYC-00229",
    userId: "usr_2a5e77f",
    fullName: "James O'Brien",
    email: "james.obrien@example.com",
    dob: "1988-03-08",
    nationality: "British",
    address: "14 Baker Street",
    city: "London",
    postalCode: "W1U 3BW",
    country: "United Kingdom",
    docType: "driving_license",
    frontDoc: "license_james_front.jpg",
    backDoc: "license_james_back.jpg",
    selfie: "selfie_james.jpg",
    submittedAt: "2026-03-02T11:05:00Z",
    status: "rejected",
    rejectionReason: "Document not readable / blurry",
    rejectionNote:
      "The front of the driver's license is too blurry to read the license number. Please resubmit with a clearer photo.",
    reviewedBy: "staff@vertex.io",
    reviewedAt: "2026-03-02T13:20:00Z",
  },
  {
    id: "KYC-00228",
    userId: "usr_9b3c44d",
    fullName: "Aisha Al-Farsi",
    email: "aisha.alfarsi@example.com",
    dob: "1993-08-30",
    nationality: "UAE National",
    address: "Villa 12, Jumeirah 1",
    city: "Dubai",
    postalCode: "00000",
    country: "UAE",
    docType: "passport",
    frontDoc: "passport_aisha_front.jpg",
    backDoc: null,
    selfie: "selfie_aisha.jpg",
    submittedAt: "2026-03-01T08:45:00Z",
    status: "pending",
  },
  {
    id: "KYC-00227",
    userId: "usr_1d6f23a",
    fullName: "Carlos Mendez",
    email: "carlos.mendez@example.com",
    dob: "1985-01-17",
    nationality: "Mexican",
    address: "Calle Insurgentes 300",
    city: "Mexico City",
    postalCode: "06600",
    country: "Mexico",
    docType: "national_id",
    frontDoc: "ine_carlos_front.jpg",
    backDoc: "ine_carlos_back.jpg",
    selfie: "selfie_carlos.jpg",
    submittedAt: "2026-02-28T16:20:00Z",
    status: "approved",
    reviewedBy: "staff@vertex.io",
    reviewedAt: "2026-03-01T09:10:00Z",
  },
];

// ─── Email Utility ────────────────────────────────────────────────────────────

async function sendKycEmail(params: {
  email: string;
  fullName: string;
  decision: "approved" | "rejected";
  appId: string;
  rejectionReason?: string;
  rejectionNote?: string;
}): Promise<{ success: boolean; message: string }> {
  // Simulate async email call
  await new Promise((r) => setTimeout(r, 800));
  // Email is currently disabled on this account
  void params; // suppress unused-vars warning
  return {
    success: false,
    message:
      "Email notifications are not yet enabled on this account. Upgrade to send automatic KYC decision emails.",
  };
}

const STORAGE_KEY = "kyc_admin_decisions";

function loadDecisions(): Record<
  string,
  {
    status: ReviewStatus;
    rejectionReason?: string;
    rejectionNote?: string;
    reviewedAt?: string;
  }
> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function mergeWithDecisions(apps: KYCApplication[]): KYCApplication[] {
  const decisions = loadDecisions();
  return apps.map((app) => {
    const d = decisions[app.id];
    if (!d) return app;
    return {
      ...app,
      status: d.status,
      rejectionReason: d.rejectionReason,
      rejectionNote: d.rejectionNote,
      reviewedAt: d.reviewedAt,
      reviewedBy: "staff@vertex.io",
    };
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "pending")
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-mono bg-[oklch(0.2_0.06_55)] text-[oklch(0.82_0.15_55)] border-[oklch(0.35_0.1_55)] gap-1"
      >
        <Clock className="w-2.5 h-2.5" />
        Pending
      </Badge>
    );
  if (status === "approved")
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-mono bg-[oklch(0.2_0.06_145)] text-[oklch(0.72_0.18_145)] border-[oklch(0.35_0.12_145)] gap-1"
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
        Approved
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="text-[10px] font-mono bg-[oklch(0.2_0.06_25)] text-[oklch(0.72_0.18_25)] border-[oklch(0.35_0.12_25)] gap-1"
    >
      <XCircle className="w-2.5 h-2.5" />
      Rejected
    </Badge>
  );
}

function DocTypeBadge({
  docType,
}: {
  docType: "passport" | "national_id" | "driving_license";
}) {
  const labels = {
    passport: "Passport",
    national_id: "National ID",
    driving_license: "Driver's License",
  };
  return (
    <span className="text-[11px] font-mono text-muted-foreground">
      {labels[docType]}
    </span>
  );
}

function DocThumbnail({
  filename,
  label,
}: {
  filename: string | null;
  label: string;
}) {
  if (!filename) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 flex flex-col items-center justify-center p-5 text-muted-foreground/40 gap-2 min-h-[120px]">
        <FileText className="w-6 h-6" />
        <span className="text-[11px] font-mono">Not provided</span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <div className="rounded-lg border border-border bg-muted/20 flex flex-col items-center justify-center p-5 gap-2 min-h-[120px] relative overflow-hidden">
        {/* Placeholder visual for uploaded document */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <IdCard className="w-8 h-8 text-primary/40 relative z-10" />
        <span className="text-[11px] font-mono text-muted-foreground relative z-10 text-center truncate max-w-full px-2">
          {filename}
        </span>
        <Badge
          variant="outline"
          className="text-[9px] font-mono bg-primary/10 text-primary border-primary/30 relative z-10"
        >
          Uploaded
        </Badge>
      </div>
    </div>
  );
}

// ─── Review Drawer ────────────────────────────────────────────────────────────

function ReviewDrawer({
  app,
  onClose,
  onDecision,
}: {
  app: KYCApplication | null;
  onClose: () => void;
  onDecision: (
    id: string,
    decision: ReviewStatus,
    reason?: string,
    note?: string,
  ) => void;
}) {
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!app) {
      setConfirmAction(null);
      setRejectionReason("");
      setRejectionNote("");
    }
  }, [app]);

  const handleDecision = async () => {
    if (!app || !confirmAction) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    onDecision(
      app.id,
      confirmAction === "approve" ? "approved" : "rejected",
      confirmAction === "reject" ? rejectionReason : undefined,
      confirmAction === "reject" ? rejectionNote : undefined,
    );
    setIsProcessing(false);
    setConfirmAction(null);
    onClose();
  };

  if (!app) return null;

  const docTypeLabel =
    app.docType === "passport"
      ? "Passport"
      : app.docType === "national_id"
        ? "National ID"
        : "Driver's License";

  return (
    <Sheet open={!!app} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-ocid="kyc_admin.review.sheet"
        side="right"
        className="w-full sm:max-w-2xl bg-card border-border overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="font-display text-base text-foreground">
                KYC Review — {app.id}
              </SheetTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Submitted{" "}
                {new Date(app.submittedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={app.status} />
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Personal Info */}
          <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest">
                Personal Information
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Full Name", value: app.fullName },
                { label: "Date of Birth", value: app.dob },
                { label: "Nationality", value: app.nationality },
                { label: "Country", value: app.country },
                {
                  label: "Address",
                  value: `${app.address}, ${app.city}, ${app.postalCode}`,
                  full: true,
                },
                { label: "User ID", value: app.userId },
              ].map((row) => (
                <div key={row.label} className={row.full ? "col-span-2" : ""}>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">
                    {row.label}
                  </div>
                  <div className="text-sm font-mono text-foreground">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Type */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/10">
            <IdCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Document Type:
            </span>
            <span className="text-sm font-mono text-foreground font-semibold">
              {docTypeLabel}
            </span>
          </div>

          {/* Document Images */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Identity Documents
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DocThumbnail filename={app.frontDoc} label="Front of Document" />
              <DocThumbnail
                filename={app.backDoc}
                label={
                  app.docType === "passport"
                    ? "Back (N/A for Passport)"
                    : "Back of Document"
                }
              />
            </div>
          </div>

          {/* Selfie */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-primary" />
              Selfie with ID
            </div>
            <DocThumbnail filename={app.selfie} label="Selfie Photo" />
          </div>

          <Separator className="bg-border/60" />

          {/* Rejection info (if already rejected) */}
          {app.status === "rejected" && app.rejectionReason && (
            <div className="rounded-lg border border-[oklch(0.3_0.08_25)] bg-[oklch(0.17_0.04_25)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[oklch(0.75_0.15_25)] uppercase tracking-widest">
                <XCircle className="w-3.5 h-3.5" />
                Rejection Details
              </div>
              <div className="text-sm font-mono text-[oklch(0.72_0.18_25)]">
                {app.rejectionReason}
              </div>
              {app.rejectionNote && (
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {app.rejectionNote}
                </div>
              )}
              {app.reviewedAt && (
                <div className="text-[10px] font-mono text-muted-foreground/60">
                  Reviewed:{" "}
                  {new Date(app.reviewedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          )}

          {/* Approval info */}
          {app.status === "approved" && (
            <div className="rounded-lg border border-[oklch(0.3_0.1_145)] bg-[oklch(0.17_0.05_145)] p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[oklch(0.72_0.18_145)] uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Application Approved
              </div>
              {app.reviewedAt && (
                <div className="text-[10px] font-mono text-muted-foreground/60">
                  Approved:{" "}
                  {new Date(app.reviewedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {app.reviewedBy && ` by ${app.reviewedBy}`}
                </div>
              )}
            </div>
          )}

          {/* Action Panel (only for pending) */}
          {app.status === "pending" && (
            <div className="space-y-4">
              {!confirmAction && (
                <div className="flex gap-3">
                  <Button
                    data-ocid="kyc_admin.approve.primary_button"
                    onClick={() => setConfirmAction("approve")}
                    className="flex-1 font-mono text-sm bg-[oklch(0.22_0.08_145)] hover:bg-[oklch(0.28_0.1_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.4_0.12_145)] gap-2"
                    variant="outline"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    data-ocid="kyc_admin.reject.secondary_button"
                    onClick={() => setConfirmAction("reject")}
                    className="flex-1 font-mono text-sm bg-[oklch(0.2_0.06_25)] hover:bg-[oklch(0.25_0.08_25)] text-[oklch(0.72_0.18_25)] border border-[oklch(0.38_0.12_25)] gap-2"
                    variant="outline"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {confirmAction === "approve" && (
                  <motion.div
                    key="approve-confirm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-[oklch(0.35_0.1_145)] bg-[oklch(0.18_0.06_145)] p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-mono font-semibold text-[oklch(0.72_0.18_145)]">
                      <ShieldCheck className="w-4 h-4" />
                      Confirm Approval
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will mark the application as approved and unlock full
                      trading features for this user.
                    </p>
                    <p className="text-xs text-muted-foreground/70 font-mono italic">
                      An email notification will be sent to {app.email} once
                      email is enabled on your account.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        data-ocid="kyc_admin.confirm_approve.confirm_button"
                        onClick={handleDecision}
                        disabled={isProcessing}
                        className="font-mono text-sm bg-[oklch(0.22_0.08_145)] hover:bg-[oklch(0.28_0.1_145)] text-[oklch(0.72_0.18_145)] border border-[oklch(0.4_0.12_145)] gap-2"
                        variant="outline"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {isProcessing ? "Processing..." : "Confirm Approve"}
                      </Button>
                      <Button
                        data-ocid="kyc_admin.confirm_approve.cancel_button"
                        variant="ghost"
                        onClick={() => setConfirmAction(null)}
                        disabled={isProcessing}
                        className="font-mono text-sm text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {confirmAction === "reject" && (
                  <motion.div
                    key="reject-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-[oklch(0.35_0.1_25)] bg-[oklch(0.18_0.05_25)] p-4 space-y-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-mono font-semibold text-[oklch(0.72_0.18_25)]">
                      <AlertTriangle className="w-4 h-4" />
                      Rejection Details
                    </div>

                    <p className="text-xs text-muted-foreground/70 font-mono italic">
                      The rejection reason and any notes will be emailed to{" "}
                      {app.email} once email is enabled.
                    </p>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Reason *
                      </Label>
                      <Select
                        value={rejectionReason}
                        onValueChange={setRejectionReason}
                      >
                        <SelectTrigger
                          data-ocid="kyc_admin.rejection_reason.select"
                          className="font-mono bg-card/60 border-border text-foreground text-sm"
                        >
                          <SelectValue placeholder="Select rejection reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border font-mono">
                          {REJECTION_REASONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                        Note to User (optional)
                      </Label>
                      <Textarea
                        data-ocid="kyc_admin.rejection_note.textarea"
                        placeholder="Provide additional context to help the user resubmit correctly..."
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        className="font-mono bg-card/60 border-border text-foreground text-sm min-h-[80px] resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        data-ocid="kyc_admin.confirm_reject.confirm_button"
                        onClick={handleDecision}
                        disabled={!rejectionReason || isProcessing}
                        className="font-mono text-sm bg-[oklch(0.2_0.06_25)] hover:bg-[oklch(0.25_0.08_25)] text-[oklch(0.72_0.18_25)] border border-[oklch(0.38_0.12_25)] gap-2"
                        variant="outline"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {isProcessing ? "Processing..." : "Confirm Reject"}
                      </Button>
                      <Button
                        data-ocid="kyc_admin.confirm_reject.cancel_button"
                        variant="ghost"
                        onClick={() => {
                          setConfirmAction(null);
                          setRejectionReason("");
                          setRejectionNote("");
                        }}
                        disabled={isProcessing}
                        className="font-mono text-sm text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KYCAdmin() {
  const [applications, setApplications] = useState<KYCApplication[]>(() =>
    mergeWithDecisions(MOCK_APPLICATIONS),
  );
  const [filter, setFilter] = useState<"all" | ReviewStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<KYCApplication | null>(null);

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const filtered = applications.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.fullName.toLowerCase().includes(q) ||
      a.userId.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleDecision = (
    id: string,
    decision: ReviewStatus,
    reason?: string,
    note?: string,
  ) => {
    const now = new Date().toISOString();
    const decisions = loadDecisions();
    decisions[id] = {
      status: decision,
      rejectionReason: reason,
      rejectionNote: note,
      reviewedAt: now,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: decision,
              rejectionReason: reason,
              rejectionNote: note,
              reviewedAt: now,
              reviewedBy: "staff@vertex.io",
            }
          : a,
      ),
    );

    // Send email notification after drawer closes (drawer closes first, then toast appears)
    const app = applications.find((a) => a.id === id);
    if (app) {
      setTimeout(() => {
        sendKycEmail({
          email: app.email,
          fullName: app.fullName,
          decision: decision === "approved" ? "approved" : "rejected",
          appId: id,
          rejectionReason: reason,
          rejectionNote: note,
        }).then((result) => {
          if (result.success) {
            toast.success(`Email sent to ${app.fullName}`, {
              description: `Decision notification delivered to ${app.email}`,
            });
          } else {
            toast.warning("Decision saved — email not sent", {
              description: result.message,
            });
          }
        });
      }, 400);
    }
  };

  const FILTER_TABS: { key: "all" | ReviewStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div
      className="flex-1 overflow-auto p-6 space-y-6"
      data-ocid="kyc_admin.page"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            KYC Review Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Staff compliance dashboard — review and verify user identity
            submissions
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            variant="outline"
            className="font-mono text-xs bg-primary/10 text-primary border-primary/30 gap-1.5 px-3 py-1"
          >
            <Shield className="w-3 h-3" />
            Staff Access
          </Badge>
        </div>
      </motion.div>

      {/* Email Disabled Banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04 }}
        data-ocid="kyc_admin.email_disabled.panel"
        className="rounded-lg border border-[oklch(0.35_0.1_55)] bg-[oklch(0.17_0.05_55)] px-4 py-3 flex items-start gap-3"
      >
        <Info className="w-4 h-4 text-[oklch(0.82_0.15_55)] mt-0.5 shrink-0" />
        <p className="text-xs font-mono text-[oklch(0.82_0.15_55)]">
          <span className="font-semibold">
            Email notifications are currently disabled.
          </span>{" "}
          Upgrade your account to automatically notify users of KYC decisions.
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Total Applications",
            value: stats.total,
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10 border-primary/25",
            ocid: "kyc_admin.total.card",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: Clock,
            color: "text-[oklch(0.82_0.15_55)]",
            bg: "bg-[oklch(0.18_0.05_55)] border-[oklch(0.3_0.08_55)]",
            ocid: "kyc_admin.pending.card",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle2,
            color: "text-[oklch(0.72_0.18_145)]",
            bg: "bg-[oklch(0.18_0.05_145)] border-[oklch(0.3_0.08_145)]",
            ocid: "kyc_admin.approved.card",
          },
          {
            label: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            color: "text-[oklch(0.72_0.18_25)]",
            bg: "bg-[oklch(0.18_0.05_25)] border-[oklch(0.3_0.08_25)]",
            ocid: "kyc_admin.rejected.card",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              data-ocid={stat.ocid}
              className={`glow-card border ${stat.bg}`}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${stat.bg}`}
                >
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <div
                    className={`text-xl font-display font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Applications Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <Card className="glow-card bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                Applications
              </CardTitle>

              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                {/* Filter tabs */}
                <div
                  data-ocid="kyc_admin.filter.tab"
                  className="flex gap-1 rounded-lg bg-muted/30 border border-border p-0.5"
                >
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      data-ocid={`kyc_admin.filter_${tab.key}.tab`}
                      onClick={() => setFilter(tab.key)}
                      className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
                        filter === tab.key
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                      {tab.key !== "all" && (
                        <span className="ml-1.5 opacity-70">
                          ({stats[tab.key]})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    data-ocid="kyc_admin.search.search_input"
                    placeholder="Search name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs font-mono bg-card/60 border-border text-foreground w-48"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div
                data-ocid="kyc_admin.applications.empty_state"
                className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3"
              >
                <AlertCircle className="w-8 h-8 opacity-30" />
                <p className="text-sm font-mono">No applications found</p>
              </div>
            ) : (
              <div
                className="overflow-x-auto"
                data-ocid="kyc_admin.applications.table"
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {[
                        "App ID",
                        "User",
                        "Full Name",
                        "Document",
                        "Submitted",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] font-mono text-muted-foreground uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app, idx) => (
                      <motion.tr
                        key={app.id}
                        data-ocid={`kyc_admin.applications.row.${idx + 1}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className="border-b border-border/60 hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-primary">
                          {app.id}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {app.userId}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-foreground font-medium">
                          {app.fullName}
                        </td>
                        <td className="px-4 py-3">
                          <DocTypeBadge docType={app.docType} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {new Date(app.submittedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            data-ocid={`kyc_admin.review.open_modal_button.${idx + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(app)}
                            className="h-7 px-3 font-mono text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 gap-1.5"
                          >
                            <Eye className="w-3 h-3" />
                            Review
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Review Drawer */}
      <ReviewDrawer
        app={selected}
        onClose={() => setSelected(null)}
        onDecision={handleDecision}
      />
    </div>
  );
}
