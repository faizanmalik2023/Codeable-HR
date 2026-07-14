"use client";

import * as React from "react";
import {
  RefreshCw,
  Wallet,
  ShieldCheck,
  Download,
  History,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SALARY_REVISION_LABELS, SalarySlipStatusEnum } from "@/lib/enums";
import { formatMoney, formatOrdinalDate } from "@/lib/format";
import { useSalary } from "./use-salary";
import type { SalaryRevisionModel, SalarySlipModel } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(month: number | string, year: number): string {
  const idx = typeof month === "number" ? month - 1 : Number(month) - 1;
  const name = MONTH_NAMES[idx] ?? String(month);
  return `${name} ${year}`;
}

export default function SalaryDetailsPage() {
  const { breakdown, revisions, slips, download, downloadingId, refetchAll } = useSalary();

  const isRefreshing =
    breakdown.isFetching || revisions.isFetching || slips.isFetching;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Details"
        description="Your compensation, history and payslips"
        actions={
          <Button variant="outline" onClick={refetchAll} isLoading={isRefreshing}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {/* Breakdown */}
      <BreakdownSection {...breakdown} />

      {/* Salary History */}
      <SectionCard title="Salary History" icon={History}>
        {revisions.isLoading && !revisions.data ? (
          <TimelineSkeleton />
        ) : revisions.isError && !revisions.data ? (
          <ErrorState message="We couldn't load your salary history." onRetry={() => revisions.refetch()} />
        ) : (revisions.data ?? []).length === 0 ? (
          <EmptyState icon={TrendingUp} title="No revisions yet" description="Salary changes will appear here." />
        ) : (
          <Timeline revisions={revisions.data ?? []} />
        )}
      </SectionCard>

      {/* Salary Slips */}
      <SectionCard title="Salary Slips" icon={Receipt}>
        {slips.isError && !slips.data ? (
          <ErrorState message="We couldn't load your slips." onRetry={() => slips.refetch()} />
        ) : (
          <SlipsTable
            slips={slips.data ?? []}
            isLoading={slips.isLoading && !slips.data}
            downloadingId={downloadingId}
            onDownload={(id) => download.mutate(id)}
          />
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown                                                           */
/* ------------------------------------------------------------------ */
function BreakdownSection({
  data,
  isLoading,
  isError,
  refetch,
}: ReturnType<typeof useSalary>["breakdown"]) {
  if (isLoading && !data) return <SkeletonCard className="h-64" />;
  if (isError && !data)
    return <ErrorState message="We couldn't load your salary breakdown." onRetry={() => refetch()} />;

  const configured = data && data.configured !== false;
  if (!configured) {
    return (
      <Card className="flex items-center gap-4 border-warning/30 bg-warning-muted/40 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warning text-warning-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No salary configured yet</p>
          <p className="text-sm text-foreground-muted">
            Your compensation details will show here once HR sets them up.
          </p>
        </div>
      </Card>
    );
  }

  const b = data!;
  const pf = b.provident_fund ?? 0;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Current Breakdown</h2>
        </div>

        <div className="divide-y divide-border">
          {typeof b.basic === "number" && <LineRow label="Basic" amount={b.basic} />}

          {(b.allowances ?? []).map((a, i) => (
            <LineRow key={`al-${i}`} label={a.label} amount={a.amount} sign="+" tone="success" />
          ))}

          {(b.deductions ?? []).map((d, i) => (
            <LineRow key={`de-${i}`} label={d.label} amount={d.amount} sign="-" tone="destructive" />
          ))}

          {typeof b.tax === "number" && b.tax > 0 && (
            <LineRow label="Tax" amount={b.tax} sign="-" tone="destructive" />
          )}

          {pf > 0 && <LineRow label="Provident Fund" amount={pf} sign="-" tone="destructive" />}

          <div className="flex items-center justify-between pt-4">
            <span className="text-base font-semibold text-foreground">Net Salary</span>
            <span className="text-xl font-bold text-primary">{formatMoney(b.net)}</span>
          </div>
        </div>
      </Card>

      {pf > 0 && (
        <Card className="flex items-center gap-4 border-success/30 bg-success-muted/40 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Provident Fund</p>
            <p className="text-sm text-foreground-muted">
              {formatMoney(pf)} is contributed to your provident fund each month.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function LineRow({
  label,
  amount,
  sign,
  tone,
}: {
  label: string;
  amount: number;
  sign?: "+" | "-";
  tone?: "success" | "destructive";
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span
        className={
          tone === "success"
            ? "font-medium text-success"
            : tone === "destructive"
              ? "font-medium text-destructive"
              : "font-medium text-foreground"
        }
      >
        {sign ?? ""}
        {formatMoney(amount)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */
function Timeline({ revisions }: { revisions: SalaryRevisionModel[] }) {
  return (
    <ol className="relative space-y-6 pl-6">
      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {revisions.map((r) => (
        <li key={r.id} className="relative">
          <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-primary bg-card" aria-hidden />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {SALARY_REVISION_LABELS[r.type] ?? r.type}
                </p>
                {r.designation && (
                  <Badge variant="secondary">{r.designation}</Badge>
                )}
              </div>
              <p className="text-xs text-foreground-muted">{formatOrdinalDate(r.effective_date)}</p>
              {r.note && <p className="mt-1 text-sm text-foreground-muted">{r.note}</p>}
            </div>
            {typeof r.amount === "number" && (
              <span className="font-semibold text-foreground">{formatMoney(r.amount)}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 rounded-[var(--radius-lg)] bg-secondary/50 animate-pulse" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slips                                                               */
/* ------------------------------------------------------------------ */
function SlipsTable({
  slips,
  isLoading,
  downloadingId,
  onDownload,
}: {
  slips: SalarySlipModel[];
  isLoading: boolean;
  downloadingId: string | null;
  onDownload: (id: string) => void;
}) {
  const columns: DataTableColumn<SalarySlipModel>[] = [
    {
      key: "period",
      header: "Period",
      render: (s) => (
        <span className="font-medium text-foreground">{monthLabel(s.month, s.year)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <Badge variant={SalarySlipStatusEnum.tone(s.status)}>
          {SalarySlipStatusEnum.label(s.status)}
        </Badge>
      ),
    },
    { key: "net", header: "Net", align: "right", render: (s) => formatMoney(s.net) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => {
        const disabled = s.status !== "generated";
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            isLoading={downloadingId === s.id}
            onClick={() => onDownload(s.id)}
          >
            {downloadingId === s.id ? null : <Download className="h-4 w-4" />}
            Download
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={slips}
      rowKey={(s) => s.id}
      isLoading={isLoading}
      empty={
        <EmptyState icon={Receipt} title="No slips yet" description="Your payslips will appear here once released." />
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
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
