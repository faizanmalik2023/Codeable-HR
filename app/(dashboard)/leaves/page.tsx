"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, History, CalendarDays, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { LeaveStatusEnum, LEAVE_TYPE_LABELS } from "@/lib/enums";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isManagerUser, useAuthStore } from "@/stores/auth-store";
import { useLeaves } from "./use-leaves";
import { LeaveDetailsDialog } from "./leave-details-dialog";
import type { LeaveBalanceModel, LeaveModel } from "@/types";

function typeLabel(leave: LeaveModel): string {
  return (
    leave.leave_type_name ||
    LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] ||
    String(leave.leave_type)
  );
}

export default function LeavesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isManager = isManagerUser(user);
  const { quota, history } = useLeaves();
  const [selected, setSelected] = React.useState<LeaveModel | null>(null);

  const balances = quota.data ?? [];
  const recent = (history.data?.items ?? []).slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leaves"
        description="Manage your time off and view balances"
        actions={
          <div className="flex items-center gap-2">
            {isManager && (
              <Button variant="outline" onClick={() => router.push("/leaves/team")}>
                <Users className="h-4 w-4" /> Team
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/leaves/history")}>
              <History className="h-4 w-4" /> History
            </Button>
            <Button onClick={() => router.push("/leaves/apply")}>
              <Plus className="h-4 w-4" /> Apply Leave
            </Button>
          </div>
        }
      />

      {/* Balances */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your Balance</h2>
        {quota.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        ) : quota.isError ? (
          <ErrorState message={quota.error?.message} onRetry={() => quota.refetch()} />
        ) : balances.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={CalendarDays}
              title="No leave balances"
              description="Your accrued leave types will appear here."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((b) => (
              <BalanceCard key={b.leave_type_id} balance={b} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Leaves */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Leaves</h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-primary"
            onClick={() => router.push("/leaves/history")}
          >
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {history.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-[var(--radius-lg)]" />
            ))}
          </div>
        ) : history.isError ? (
          <ErrorState message={history.error?.message} onRetry={() => history.refetch()} />
        ) : recent.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={CalendarDays}
              title="No leaves yet"
              description="Apply for your first leave to see it here."
              action={{ label: "Apply Leave", onClick: () => router.push("/leaves/apply") }}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {recent.map((leave) => (
              <Card
                key={leave.id}
                hover
                className="flex cursor-pointer items-center justify-between gap-3 p-4"
                onClick={() => setSelected(leave)}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <CalendarDays className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {formatDateRange(leave.date_from, leave.date_to)}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {typeLabel(leave)}
                      {typeof leave.total_days === "number" && (
                        <> · {leave.total_days} {leave.total_days === 1 ? "day" : "days"}</>
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={LeaveStatusEnum.tone(leave.status)}>
                  {LeaveStatusEnum.label(leave.status)}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <LeaveDetailsDialog
        leave={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function BalanceCard({ balance }: { balance: LeaveBalanceModel }) {
  const total = balance.quota || 0;
  const used = balance.used || 0;
  const remaining = balance.remaining ?? Math.max(total - used, 0);
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{balance.name}</p>
        <Badge variant="muted">{remaining} left</Badge>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-foreground">{remaining}</span>
        <span className="text-sm text-foreground-muted">/ {total} days</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full bg-primary transition-all")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-foreground-muted">
        {used} {used === 1 ? "day" : "days"} used
      </p>
    </Card>
  );
}
