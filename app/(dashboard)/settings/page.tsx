"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  ArrowRight,
  Bell,
  Languages,
  Shield,
  FileText,
  Info,
  Trash2,
  AlertTriangle,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { LANGUAGE_LABELS, type Language } from "@/lib/enums";
import { useSettings } from "./use-settings";

const APP_VERSION = "1.0.0";
const PRIVACY_URL = "https://gocodeable.com/privacy";
const TERMS_URL = "https://gocodeable.com/terms";

const LANGUAGE_OPTIONS = (Object.keys(LANGUAGE_LABELS) as Language[]).map((value) => ({
  value,
  label: LANGUAGE_LABELS[value],
}));

export default function SettingsPage() {
  const { query, preferences, updatePreferences, deleteAccount } = useSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Manage your preferences and account." />

      {/* Profile shortcut */}
      <Link href="/profile">
        <Card hover className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-muted text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Profile</p>
              <p className="text-sm text-foreground-muted">View and edit your personal details.</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-foreground-muted" />
        </Card>
      </Link>

      {/* Preferences */}
      <SectionCard title="Preferences" icon={SlidersHorizontal}>
        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : query.isError && !preferences ? (
          <ErrorState message="We couldn't load your preferences." onRetry={() => query.refetch()} />
        ) : (
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-foreground-muted">
                    Receive updates about leaves, payslips and more.
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.notifications_enabled ?? false}
                disabled={updatePreferences.isPending || !preferences}
                onChange={(v) => updatePreferences.mutate({ notifications_enabled: v })}
                aria-label="Toggle notifications"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 last:pb-0">
              <div className="flex items-center gap-3">
                <Languages className="h-4 w-4 text-foreground-muted" />
                <div>
                  <p className="text-sm font-medium text-foreground">Language</p>
                  <p className="text-xs text-foreground-muted">Choose your preferred language.</p>
                </div>
              </div>
              <div className="w-40">
                <Select
                  value={preferences?.language}
                  options={LANGUAGE_OPTIONS}
                  disabled={updatePreferences.isPending || !preferences}
                  onChange={(v) => updatePreferences.mutate({ language: v as Language })}
                />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Legal & info */}
      <SectionCard title="Legal & Info" icon={Info}>
        <div className="divide-y divide-border">
          <ExternalRow icon={Shield} label="Privacy Policy" href={PRIVACY_URL} />
          <ExternalRow icon={FileText} label="Terms of Service" href={TERMS_URL} />
          <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-foreground-muted" />
              <p className="text-sm font-medium text-foreground">App Version</p>
            </div>
            <span className="text-sm text-foreground-muted">{APP_VERSION}</span>
          </div>
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account" icon={Trash2}>
        <DeleteAccountFlow
          onConfirm={() => deleteAccount.mutate()}
          deleting={deleteAccount.isPending}
        />
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete account — warning sheet → final confirm modal                */
/* ------------------------------------------------------------------ */
function DeleteAccountFlow({
  onConfirm,
  deleting,
}: {
  onConfirm: () => void;
  deleting: boolean;
}) {
  const [warnOpen, setWarnOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Delete account</p>
        <p className="text-xs text-foreground-muted">
          Permanently remove your account and all associated data.
        </p>
      </div>
      <Button variant="destructive" className="gap-2" onClick={() => setWarnOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete Account
      </Button>

      <Sheet
        open={warnOpen}
        onClose={() => setWarnOpen(false)}
        title="Delete your account"
        description="Please read this carefully before continuing."
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-muted">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm text-foreground">
            This is <span className="font-semibold">permanent</span>. Deleting your account will
            remove your profile, requests and history from CodeableHR. This action cannot be undone.
          </p>
          <ul className="space-y-2 text-sm text-foreground-muted">
            <li>· Your personal and employment records will be erased.</li>
            <li>· Leave, EOD and claim history will be lost.</li>
            <li>· You will be signed out immediately.</li>
          </ul>
        </div>
        <SheetFooter className="-mx-6 -mb-5 mt-6">
          <Button variant="outline" onClick={() => setWarnOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setWarnOpen(false);
              setConfirmOpen(true);
            }}
          >
            Continue
          </Button>
        </SheetFooter>
      </Sheet>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        title="Delete account?"
        description="This will permanently delete your account. This cannot be undone."
        confirmLabel="Delete account"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
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
  icon: typeof Info;
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

function ExternalRow({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Info;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:text-primary"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-foreground-muted" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-foreground-muted" />
    </a>
  );
}
