import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Fingerprint,
  IdCard,
  RefreshCw,
  Shield,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export type KYCStatus = "unverified" | "pending" | "level1" | "level2";

export function getKYCStatus(): KYCStatus {
  return (localStorage.getItem("kyc_status") as KYCStatus) || "unverified";
}

export function setKYCStatus(status: KYCStatus) {
  localStorage.setItem("kyc_status", status);
}

const NATIONALITIES = [
  "Indian",
  "American",
  "British",
  "Canadian",
  "Australian",
  "German",
  "French",
  "Japanese",
  "Chinese",
  "Brazilian",
  "South African",
  "Mexican",
  "Italian",
  "Spanish",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Swiss",
  "Austrian",
  "Belgian",
  "Portuguese",
  "Greek",
  "Turkish",
  "Russian",
  "Polish",
  "Czech",
  "Hungarian",
  "Romanian",
  "Bulgarian",
  "Ukrainian",
  "Israeli",
  "Saudi Arabian",
  "UAE National",
  "Singaporean",
  "Malaysian",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Filipino",
  "Pakistani",
  "Bangladeshi",
  "Sri Lankan",
  "Nepali",
  "Egyptian",
  "Nigerian",
  "Kenyan",
  "Ghanaian",
  "Ethiopian",
  "Other",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "South Africa",
  "Mexico",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Belgium",
  "Portugal",
  "Greece",
  "Turkey",
  "Russia",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Bulgaria",
  "Ukraine",
  "Israel",
  "Saudi Arabia",
  "UAE",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Pakistan",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Egypt",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Other",
];

const KYC_STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "ID Verification", icon: IdCard },
  { id: 3, label: "Selfie Check", icon: Camera },
  { id: 4, label: "Review & Submit", icon: FileText },
];

type PersonalInfo = {
  fullName: string;
  dob: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type IDInfo = {
  docType: string;
  frontFile: File | null;
  backFile: File | null;
  frontName: string;
  backName: string;
};

type SelfieInfo = {
  selfieFile: File | null;
  selfieName: string;
};

function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {KYC_STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              data-ocid={`kyc.step.${step.id}`}
              onClick={() => onStepClick?.(step.id)}
              disabled={step.id > currentStep}
              className={`flex flex-col items-center gap-1.5 transition-all ${
                step.id > currentStep
                  ? "cursor-not-allowed opacity-40"
                  : "cursor-pointer"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-[oklch(0.22_0.08_145)] border-[oklch(0.5_0.2_145)] text-[oklch(0.72_0.18_145)]"
                    : isCurrent
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_oklch(var(--primary)/0.3)]"
                      : "bg-muted/20 border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider hidden sm:block ${
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                      ? "text-[oklch(0.62_0.18_145)]"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < KYC_STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 transition-colors ${
                  currentStep > step.id
                    ? "bg-[oklch(0.5_0.2_145)]"
                    : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FileDropzone({
  label,
  hint,
  fileName,
  ocid,
  onChange,
  required = true,
}: {
  label: string;
  hint?: string;
  fileName: string;
  ocid: string;
  onChange: (file: File) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
        {label}
        {!required && (
          <span className="ml-1 text-[10px] text-muted-foreground/60 normal-case tracking-normal">
            (optional)
          </span>
        )}
      </Label>
      <label
        data-ocid={ocid}
        htmlFor={ocid}
        className={`flex flex-col items-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all ${
          fileName
            ? "border-[oklch(0.5_0.2_145)] bg-[oklch(0.18_0.06_145)] text-[oklch(0.72_0.18_145)]"
            : "border-border hover:border-primary/40 bg-card/40 hover:bg-primary/5 text-muted-foreground"
        }`}
      >
        {fileName ? (
          <>
            <CheckCircle2 className="w-8 h-8 text-[oklch(0.72_0.18_145)]" />
            <span className="text-sm font-mono text-center truncate max-w-full px-2">
              {fileName}
            </span>
            <span className="text-xs text-[oklch(0.62_0.18_145)]">
              Click to replace
            </span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 opacity-40" />
            <span className="text-sm font-mono">Click to upload</span>
            {hint && (
              <span className="text-xs text-center opacity-60">{hint}</span>
            )}
          </>
        )}
        <input
          id={ocid}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
        />
      </label>
    </div>
  );
}

function Step1PersonalInfo({
  data,
  onChange,
}: {
  data: PersonalInfo;
  onChange: (d: PersonalInfo) => void;
}) {
  const set = (key: keyof PersonalInfo, val: string) =>
    onChange({ ...data, [key]: val });

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Full Name *
          </Label>
          <Input
            data-ocid="kyc.fullname.input"
            placeholder="As on your ID document"
            value={data.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Date of Birth *
          </Label>
          <Input
            data-ocid="kyc.dob.input"
            type="date"
            value={data.dob}
            onChange={(e) => set("dob", e.target.value)}
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Nationality *
        </Label>
        <Select
          value={data.nationality}
          onValueChange={(v) => set("nationality", v)}
        >
          <SelectTrigger
            data-ocid="kyc.nationality.select"
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          >
            <SelectValue placeholder="Select nationality" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border font-mono max-h-60">
            {NATIONALITIES.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Residential Address *
        </Label>
        <Input
          data-ocid="kyc.address.input"
          placeholder="Street address, apartment, suite, etc."
          value={data.address}
          onChange={(e) => set("address", e.target.value)}
          className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            City *
          </Label>
          <Input
            data-ocid="kyc.city.input"
            placeholder="City"
            value={data.city}
            onChange={(e) => set("city", e.target.value)}
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Postal Code *
          </Label>
          <Input
            data-ocid="kyc.postalcode.input"
            placeholder="ZIP / Postal"
            value={data.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Country *
          </Label>
          <Select value={data.country} onValueChange={(v) => set("country", v)}>
            <SelectTrigger
              data-ocid="kyc.country.select"
              className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
            >
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border font-mono max-h-60">
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

function Step2IDVerification({
  data,
  onChange,
}: {
  data: IDInfo;
  onChange: (d: IDInfo) => void;
}) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Document Type *
        </Label>
        <Select
          value={data.docType}
          onValueChange={(v) => onChange({ ...data, docType: v })}
        >
          <SelectTrigger
            data-ocid="kyc.doctype.select"
            className="font-mono bg-card/60 border-border focus:border-primary/60 text-foreground"
          >
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border font-mono">
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="national_id">National ID Card</SelectItem>
            <SelectItem value="driving_license">Driver's License</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.docType && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          <FileDropzone
            label="Front of Document"
            hint="Clear photo in good lighting"
            fileName={data.frontName}
            ocid="kyc.front_upload.upload_button"
            onChange={(file) =>
              onChange({ ...data, frontFile: file, frontName: file.name })
            }
          />
          <FileDropzone
            label="Back of Document"
            hint={
              data.docType === "passport"
                ? "Not required for passport"
                : "Required for ID & License"
            }
            fileName={data.backName}
            ocid="kyc.back_upload.upload_button"
            onChange={(file) =>
              onChange({ ...data, backFile: file, backName: file.name })
            }
            required={data.docType !== "passport"}
          />
        </motion.div>
      )}

      {!data.docType && (
        <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
          <IdCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-mono text-muted-foreground">
            Select a document type above to upload your ID
          </p>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          Your documents are encrypted and stored securely. They are used solely
          for identity verification and will not be shared with third parties.
        </p>
      </div>
    </motion.div>
  );
}

function Step3Selfie({
  data,
  onChange,
}: {
  data: SelfieInfo;
  onChange: (d: SelfieInfo) => void;
}) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Instructions */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest">
          Selfie Verification Instructions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Camera,
              title: "Hold your ID",
              desc: "Hold your ID document next to your face",
            },
            {
              icon: User,
              title: "Face clearly visible",
              desc: "Ensure your face and the ID are both in frame",
            },
            {
              icon: CheckCircle2,
              title: "Good lighting",
              desc: "Take the photo in bright, even lighting",
            },
          ].map((tip) => {
            const TipIcon = tip.icon;
            return (
              <div key={tip.title} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <TipIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground font-mono">
                    {tip.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {tip.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FileDropzone
        label="Selfie with ID Document"
        hint="Take a selfie holding your ID document next to your face"
        fileName={data.selfieName}
        ocid="kyc.selfie_upload.upload_button"
        onChange={(file) =>
          onChange({ selfieFile: file, selfieName: file.name })
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-[oklch(0.28_0.08_55)] bg-[oklch(0.18_0.04_55)] p-3">
        <AlertCircle className="w-4 h-4 text-[oklch(0.75_0.15_55)] mt-0.5 shrink-0" />
        <p className="text-xs text-[oklch(0.75_0.15_55)] font-mono leading-relaxed">
          Do not wear sunglasses or masks. Ensure the ID text is readable. Poor
          quality photos will delay verification.
        </p>
      </div>
    </motion.div>
  );
}

function Step4Review({
  personalInfo,
  idInfo,
  selfieInfo,
  confirmed,
  onConfirmChange,
}: {
  personalInfo: PersonalInfo;
  idInfo: IDInfo;
  selfieInfo: SelfieInfo;
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
}) {
  const docTypeLabel =
    idInfo.docType === "passport"
      ? "Passport"
      : idInfo.docType === "national_id"
        ? "National ID"
        : idInfo.docType === "driving_license"
          ? "Driver's License"
          : "—";

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Personal Info Summary */}
      <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest">
            Personal Information
          </span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          {[
            { label: "Full Name", value: personalInfo.fullName || "—" },
            { label: "Date of Birth", value: personalInfo.dob || "—" },
            { label: "Nationality", value: personalInfo.nationality || "—" },
            {
              label: "Address",
              value: personalInfo.address || "—",
              full: true,
            },
            { label: "City", value: personalInfo.city || "—" },
            { label: "Postal Code", value: personalInfo.postalCode || "—" },
            { label: "Country", value: personalInfo.country || "—" },
          ].map((row) => (
            <div
              key={row.label}
              className={row.full ? "col-span-2 sm:col-span-3" : ""}
            >
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

      {/* ID Documents Summary */}
      <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-2">
          <IdCard className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest">
            Identity Documents
          </span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">
              Document Type
            </span>
            <span className="text-sm font-mono text-foreground">
              {docTypeLabel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">
              Front Image
            </span>
            <span
              className={`text-sm font-mono ${idInfo.frontName ? "text-[oklch(0.72_0.18_145)]" : "text-loss"}`}
            >
              {idInfo.frontName || "Not uploaded"}
            </span>
          </div>
          {idInfo.docType !== "passport" && (
            <div className="flex justify-between">
              <span className="text-[11px] font-mono text-muted-foreground">
                Back Image
              </span>
              <span
                className={`text-sm font-mono ${idInfo.backName ? "text-[oklch(0.72_0.18_145)]" : "text-loss"}`}
              >
                {idInfo.backName || "Not uploaded"}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">
              Selfie Photo
            </span>
            <span
              className={`text-sm font-mono ${selfieInfo.selfieName ? "text-[oklch(0.72_0.18_145)]" : "text-loss"}`}
            >
              {selfieInfo.selfieName || "Not uploaded"}
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-border/60" />

      {/* Confirmation checkbox */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
        <Checkbox
          id="kyc-confirm"
          data-ocid="kyc.confirm.checkbox"
          checked={confirmed}
          onCheckedChange={(v) => onConfirmChange(v === true)}
          className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <label
          htmlFor="kyc-confirm"
          className="text-sm font-mono text-foreground/80 leading-relaxed cursor-pointer"
        >
          I confirm that all information provided is accurate, complete, and
          up-to-date. I understand that providing false information may result
          in account suspension.
        </label>
      </div>
    </motion.div>
  );
}

function SubmittedScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 space-y-6 text-center"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[oklch(0.22_0.08_145)] border-2 border-[oklch(0.5_0.2_145)] flex items-center justify-center">
          <Check className="w-3 h-3 text-[oklch(0.72_0.18_145)]" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Verification Submitted
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your KYC application is under review. We'll notify you once it's
          processed.
        </p>
      </div>

      <Badge
        variant="outline"
        className="text-sm font-mono px-4 py-1.5 bg-primary/10 text-primary border-primary/30"
      >
        <Clock className="w-3.5 h-3.5 mr-2" />
        Under Review
      </Badge>

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-left space-y-3 w-full max-w-sm">
        <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-widest">
          What happens next?
        </div>
        {[
          {
            step: "01",
            text: "Our compliance team reviews your documents",
          },
          {
            step: "02",
            text: "AI-powered identity verification checks",
          },
          {
            step: "03",
            text: "Account upgraded within 1–2 business days",
          },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-3">
            <span className="font-mono text-[10px] text-primary/60 mt-0.5 font-semibold">
              {item.step}
            </span>
            <span className="text-xs text-muted-foreground">{item.text}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link to="/payments">
          <Button
            variant="outline"
            className="font-mono text-sm bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          >
            Go to Payments
          </Button>
        </Link>
        <Link to="/">
          <Button
            variant="outline"
            className="font-mono text-sm bg-card border-border text-foreground hover:bg-accent"
          >
            Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export function KYC() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(
    () => getKYCStatus() === "pending",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "",
    dob: "",
    nationality: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  const [idInfo, setIdInfo] = useState<IDInfo>({
    docType: "",
    frontFile: null,
    backFile: null,
    frontName: "",
    backName: "",
  });

  const [selfieInfo, setSelfieInfo] = useState<SelfieInfo>({
    selfieFile: null,
    selfieName: "",
  });

  const [confirmed, setConfirmed] = useState(false);

  const canProceed = () => {
    if (step === 1) {
      return (
        personalInfo.fullName &&
        personalInfo.dob &&
        personalInfo.nationality &&
        personalInfo.address &&
        personalInfo.city &&
        personalInfo.postalCode &&
        personalInfo.country
      );
    }
    if (step === 2) {
      const needsBack = idInfo.docType !== "passport";
      return (
        idInfo.docType && idInfo.frontName && (!needsBack || idInfo.backName)
      );
    }
    if (step === 3) return !!selfieInfo.selfieName;
    if (step === 4) return confirmed;
    return false;
  };

  const handleSubmit = async () => {
    if (!confirmed) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setKYCStatus("pending");
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex-1 overflow-auto p-6" data-ocid="kyc.page">
        <SubmittedScreen />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6" data-ocid="kyc.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            KYC Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Complete identity verification to unlock full trading features
          </p>
        </div>
      </motion.div>

      {/* KYC Limits Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          {
            label: "Unverified",
            desc: "Deposit $500, No withdrawals",
            active: false,
          },
          {
            label: "Level 1 Verified",
            desc: "Deposit $10K, Withdraw $5K/day",
            active: false,
          },
          {
            label: "Level 2 Verified",
            desc: "Deposit $100K, Withdraw $50K/day",
            active: false,
          },
        ].map((tier, idx) => (
          <div
            key={tier.label}
            className={`rounded-lg border p-3 flex items-center gap-3 ${
              idx === 1
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-muted/10 opacity-60"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold ${
                idx === 0
                  ? "border-border text-muted-foreground"
                  : idx === 1
                    ? "border-primary text-primary"
                    : "border-[oklch(0.5_0.2_145)] text-[oklch(0.72_0.18_145)]"
              }`}
            >
              {idx + 1}
            </div>
            <div>
              <div className="text-xs font-mono font-semibold text-foreground">
                {tier.label}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {tier.desc}
              </div>
            </div>
            {idx === 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-primary ml-auto" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Wizard Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
      >
        <Card className="glow-card bg-card border-border">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Step {step} of {KYC_STEPS.length}: {KYC_STEPS[step - 1].label}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30"
              >
                {Math.round(((step - 1) / 4) * 100)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <StepIndicator
              currentStep={step}
              onStepClick={(s) => s < step && setStep(s)}
            />

            <AnimatePresence mode="wait">
              {step === 1 && (
                <Step1PersonalInfo
                  data={personalInfo}
                  onChange={setPersonalInfo}
                />
              )}
              {step === 2 && (
                <Step2IDVerification data={idInfo} onChange={setIdInfo} />
              )}
              {step === 3 && (
                <Step3Selfie data={selfieInfo} onChange={setSelfieInfo} />
              )}
              {step === 4 && (
                <Step4Review
                  personalInfo={personalInfo}
                  idInfo={idInfo}
                  selfieInfo={selfieInfo}
                  confirmed={confirmed}
                  onConfirmChange={setConfirmed}
                />
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="font-mono text-sm bg-card border-border text-foreground hover:bg-accent gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="font-mono text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 gap-2"
                  variant="outline"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  data-ocid="kyc.submit.submit_button"
                  onClick={handleSubmit}
                  disabled={!confirmed || isSubmitting}
                  className="font-mono text-sm bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 hover:border-primary/60 gap-2"
                  variant="outline"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Verification"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
