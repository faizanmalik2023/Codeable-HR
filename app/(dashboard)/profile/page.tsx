"use client";

import * as React from "react";
import Link from "next/link";
import {
  Camera,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  Mail,
  IdCard,
  Cake,
  Pencil,
  Briefcase,
  Building2,
  CalendarDays,
  BadgeCheck,
  UserCog,
  Wallet,
  HeartPulse,
  Gift,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/enums";
import type {
  EmergencyContact,
  LoanModel,
  PerkModel,
  ProfileModel,
} from "@/types";
import type { Tone } from "@/lib/enums";
import { useProfile } from "./use-profile";

const PERK_TONE: Record<PerkModel["status"], Tone> = {
  active: "success",
  upcoming: "warning",
  expired: "muted",
};

const PERK_LABEL: Record<PerkModel["status"], string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
};

export default function ProfilePage() {
  const { query, profile, update, uploadAvatar, deleteAvatar } = useProfile();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your personal and employment details." />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={profile}
        onRetry={() => query.refetch()}
        skeleton={<ProfileSkeleton />}
      >
        {(data) => (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <HeaderCard
                profile={data}
                onUpload={(f) => uploadAvatar.mutate(f)}
                onRemove={() => deleteAvatar.mutate()}
                uploading={uploadAvatar.isPending || deleteAvatar.isPending}
              />
              <PersonalInfoCard
                profile={data}
                onSave={(body) => update.mutateAsync(body)}
                saving={update.isPending}
              />
              <EmploymentCard profile={data} />
            </div>

            <div className="space-y-6">
              <CompensationCard salary={data.salary} />
              <LoansCard loans={data.loans ?? []} />
              <PerksCard perks={data.perks ?? []} />
            </div>
          </div>
        )}
      </QueryState>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header — avatar + identity                                          */
/* ------------------------------------------------------------------ */
function HeaderCard({
  profile,
  onUpload,
  onRemove,
  uploading,
}: {
  profile: ProfileModel;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      onUpload(file);
      setSheetOpen(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Change photo"
        >
          <Avatar name={profile.name} src={profile.avatar ?? undefined} size="xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          {profile.position && (
            <p className="text-sm text-foreground-muted">{profile.position}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {profile.employeeCode && (
              <Badge variant="secondary">{profile.employeeCode}</Badge>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setSheetOpen(true)}>
          <Camera className="h-4 w-4" />
          Change photo
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Change photo"
        description="Upload a new profile picture or remove the current one."
        size="sm"
      >
        <div className="flex flex-col items-center gap-5">
          <Avatar name={profile.name} src={profile.avatar ?? undefined} size="xl" />
          <div className="w-full space-y-3">
            <Button
              className="w-full gap-2"
              isLoading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload new photo
            </Button>
            {profile.avatar && (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                disabled={uploading}
                onClick={() => {
                  onRemove();
                  setSheetOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Remove photo
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Compensation                                                        */
/* ------------------------------------------------------------------ */
function CompensationCard({ salary }: { salary?: number }) {
  const [show, setShow] = React.useState(false);

  return (
    <SectionCard title="Compensation" icon={Wallet}>
      <div className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground-muted">Net salary</p>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-foreground-muted transition-colors hover:text-foreground"
            aria-label={show ? "Hide salary" : "Show salary"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {show ? formatMoney(salary) : "••••••"}
        </p>
      </div>
      <Link
        href="/salary-details"
        className="mt-3 flex items-center justify-between rounded-[var(--radius-lg)] px-2 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-muted/40"
      >
        View details
        <ArrowRight className="h-4 w-4" />
      </Link>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Personal info                                                       */
/* ------------------------------------------------------------------ */
function PersonalInfoCard({
  profile,
  onSave,
  saving,
}: {
  profile: ProfileModel;
  onSave: (body: { phone?: string; emergency_contact?: EmergencyContact }) => Promise<unknown>;
  saving: boolean;
}) {
  const [phoneOpen, setPhoneOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);
  const contact = profile.emergencyContact;

  return (
    <SectionCard title="Personal Information" icon={IdCard}>
      <dl className="divide-y divide-border">
        <InfoRow
          icon={Phone}
          label="Phone"
          value={profile.phone}
          onEdit={() => setPhoneOpen(true)}
        />
        <InfoRow icon={Mail} label="Email" value={profile.email} />
        <InfoRow icon={IdCard} label="CNIC" value={profile.cnic} />
        <InfoRow
          icon={Cake}
          label="Birthday"
          value={profile.birthday ? formatOrdinalDate(profile.birthday) : undefined}
        />
        <InfoRow
          icon={HeartPulse}
          label="Emergency contact"
          value={
            contact?.name
              ? `${contact.name}${contact.phone ? ` · ${contact.phone}` : ""}${
                  contact.relation ? ` (${contact.relation})` : ""
                }`
              : undefined
          }
          onEdit={() => setContactOpen(true)}
        />
      </dl>

      <EditPhoneModal
        open={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        initial={profile.phone ?? ""}
        saving={saving}
        onSubmit={async (phone) => {
          await onSave({ phone });
          setPhoneOpen(false);
        }}
      />

      <EditContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        initial={contact}
        saving={saving}
        onSubmit={async (emergency_contact) => {
          await onSave({ emergency_contact });
          setContactOpen(false);
        }}
      />
    </SectionCard>
  );
}

function EditPhoneModal({
  open,
  onClose,
  initial,
  saving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: string;
  saving: boolean;
  onSubmit: (phone: string) => void;
}) {
  const [phone, setPhone] = React.useState(initial);
  React.useEffect(() => {
    if (open) setPhone(initial);
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title="Edit phone" description="Update your contact number.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(phone.trim());
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            type="tel"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} disabled={!phone.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditContactModal({
  open,
  onClose,
  initial,
  saving,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial?: EmergencyContact;
  saving: boolean;
  onSubmit: (contact: EmergencyContact) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [phone, setPhone] = React.useState(initial?.phone ?? "");
  const [relation, setRelation] = React.useState(initial?.relation ?? "");

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
      setRelation(initial?.relation ?? "");
    }
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Emergency contact"
      description="Who should we reach in an emergency?"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name: name.trim(),
            phone: phone.trim(),
            relation: relation.trim(),
          });
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="ec-name">Name</Label>
          <Input
            id="ec-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ec-phone">Phone number</Label>
          <Input
            id="ec-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            type="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ec-relation">Relation</Label>
          <Input
            id="ec-relation"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="e.g. Spouse, Parent"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} disabled={!name.trim() || !phone.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Employment                                                          */
/* ------------------------------------------------------------------ */
function EmploymentCard({ profile }: { profile: ProfileModel }) {
  return (
    <SectionCard title="Employment" icon={Briefcase}>
      <dl className="divide-y divide-border">
        <InfoRow icon={BadgeCheck} label="Designation" value={profile.position} />
        <InfoRow icon={Building2} label="Department" value={profile.department} />
        <InfoRow
          icon={CalendarDays}
          label="Join date"
          value={profile.dateOfJoining ? formatOrdinalDate(profile.dateOfJoining) : undefined}
        />
        <InfoRow
          icon={Briefcase}
          label="Employment type"
          value={profile.employmentType ? EMPLOYMENT_TYPE_LABELS[profile.employmentType] : undefined}
        />
        <InfoRow icon={UserCog} label="Reports to" value={profile.manager} />
      </dl>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Loans                                                               */
/* ------------------------------------------------------------------ */
function LoansCard({ loans }: { loans: LoanModel[] }) {
  return (
    <SectionCard title="Loans" icon={Wallet}>
      {loans.length === 0 ? (
        <EmptyLine text="No active loans." />
      ) : (
        <div className="space-y-4">
          {loans.map((loan, i) => (
            <LoanRow key={loan.id ?? i} loan={loan} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function LoanRow({ loan }: { loan: LoanModel }) {
  const total = loan.totalAmount || 0;
  const remaining = loan.remainingAmount ?? 0;
  const paidAmount = Math.max(total - remaining, 0);
  const paidPct = total > 0 ? Math.min(Math.round((paidAmount / total) * 100), 100) : 0;
  const paidInst = loan.paidInstallments;
  const totalInst = loan.totalInstallments;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{loan.title}</p>
        <p className="text-right text-sm font-medium text-foreground">
          {formatMoney(remaining)}
          <span className="text-foreground-subtle"> / {formatMoney(total)}</span>
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${paidPct}%` }} />
      </div>
      <p className="mt-2 text-xs text-foreground-muted">
        {typeof paidInst === "number" && typeof totalInst === "number"
          ? `${paidInst} of ${totalInst} installments paid`
          : `${paidPct}% repaid`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Perks                                                               */
/* ------------------------------------------------------------------ */
function PerksCard({ perks }: { perks: PerkModel[] }) {
  return (
    <SectionCard title="Perks & Benefits" icon={Gift}>
      {perks.length === 0 ? (
        <EmptyLine text="No perks assigned yet." />
      ) : (
        <div className="space-y-3">
          {perks.map((perk, i) => (
            <div
              key={`${perk.title}-${i}`}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{perk.title}</p>
                {perk.description && (
                  <p className="mt-0.5 text-xs text-foreground-muted">{perk.description}</p>
                )}
              </div>
              <Badge variant={PERK_TONE[perk.status]}>{PERK_LABEL[perk.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */
function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Wallet;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-foreground-muted" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  onEdit,
}: {
  icon: typeof Wallet;
  label: string;
  value?: string | null;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
      {onEdit && (
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${label}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-foreground-muted">{text}</p>;
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="mb-4 h-4 w-40" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
