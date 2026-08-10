"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Clock, CheckCircle2, XCircle, Timer, Palmtree, LogIn, LogOut, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SkeletonStats } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusCard } from "@/components/shared/status-card";
import { CheckoutAdjustSheet } from "@/components/attendance/checkout-adjust-sheet";
import { useAdjustCheckout } from "@/components/attendance/use-adjust-checkout";
import { AttendanceReportStatusEnum, CheckoutStatusEnum, ATTENDANCE_FILTERS } from "@/lib/enums";
import { formatOrdinalDate, toWireDate } from "@/lib/format";
import { formatTime } from "@/lib/utils";
import { useAttendance } from "./use-attendance";
import type { AttendanceDay } from "@/types";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1), label }));

/** Format a check-in/out value that may be an ISO datetime or a bare `HH:mm`. */
function clock(value?: string): string {
  if (!value) return "—";
  const d = /^\d{1,2}:\d{2}/.test(value) ? new Date(`1970-01-01T${value}`) : new Date(value);
  return Number.isNaN(d.getTime()) ? value : formatTime(d);
}

/** Round hours to one decimal, dropping a trailing `.0`. */
function hoursLabel(value?: number): string {
  if (!value) return "—";
  return `${Number(value.toFixed(1)).toString()}h`;
}

/** A day whose end isn't settled: still open, auto-closed, or waiting on HR. */
function needsCheckout(d: AttendanceDay): boolean {
  const s = d.checkout_status;
  return s === "open" || s === "auto_closed" || s === "pending_approval" || s === "rejected";
}

export default function TimePage() {
  return (
    <React.Suspense fallback={<SkeletonStats count={4} />}>
      <TimePageInner />
    </React.Suspense>
  );
}

function TimePageInner() {
  const { month, setMonth, year, setYear, filter, setFilter, filtered, summary, query } =
    useAttendance();
  // `?adjust=YYYY-MM-DD` arrives from the forgotten-checkout notification.
  const searchParams = useSearchParams();
  const adjustParam = searchParams.get("adjust");
  const [selected, setSelected] = React.useState<AttendanceDay | null>(null);
  // Held separately from `selected`: the correction opens its own sheet, and two
  // stacked sheets would trap focus behind each other.
  const [adjusting, setAdjusting] = React.useState<AttendanceDay | null>(null);
  const adjust = useAdjustCheckout();

  // Days that never closed AND can still be fixed by the employee. `can_adjust_checkout`
  // alone is wider than that — a day showing a checkout stays correctable too (a lunch
  // punch nobody paired reads as finished) — so the alarm above the table would fire on
  // every ordinary day of the month. The row and the drawer still offer the fix on those;
  // this banner is only for the days nobody closed.
  const fixable = React.useMemo(
    () =>
      (query.data?.items ?? []).filter(
        (d) =>
          d.can_adjust_checkout &&
          (d.checkout_status === "open" || d.checkout_status === "auto_closed")
      ),
    [query.data]
  );

  // Arriving from the notification: show the month that day belongs to, otherwise the
  // row it names isn't even loaded.
  React.useEffect(() => {
    if (!adjustParam) return;
    const [y, m] = adjustParam.split("-").map(Number);
    if (!y || !m) return;
    setYear(y);
    setMonth(m);
  }, [adjustParam, setMonth, setYear]);

  // …then open the correction on that day once it has actually loaded. Fires once:
  // re-opening every render would make the sheet impossible to dismiss.
  const handledParam = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!adjustParam || handledParam.current === adjustParam) return;
    const day = (query.data?.items ?? []).find((d) => d.date === adjustParam);
    if (!day) return; // still loading, or a different month
    handledParam.current = adjustParam;
    // Only if it's still correctable — the window may have closed, or HR may already
    // have ruled, between the push landing and the tap.
    if (day.can_adjust_checkout) setAdjusting(day);
  }, [adjustParam, query.data]);

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => {
      const y = current - 3 + i;
      return { value: String(y), label: String(y) };
    });
  }, []);

  const tabs = ATTENDANCE_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : AttendanceReportStatusEnum.label(value),
  }));

  const columns: DataTableColumn<AttendanceDay>[] = [
    {
      key: "date",
      header: "Date",
      render: (d) => (
        <span className="font-medium text-foreground">{formatOrdinalDate(d.date)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <Badge variant={AttendanceReportStatusEnum.tone(d.status)}>
          {AttendanceReportStatusEnum.label(d.status)}
        </Badge>
      ),
    },
    { key: "check_in", header: "Check-In", render: (d) => clock(d.check_in) },
    {
      key: "check_out",
      header: "Check-Out",
      // A day nobody closed shows a chip instead of a blank cell. Without it an
      // unclosed day is indistinguishable from one that simply has no data, which is
      // exactly the day the employee needs to find.
      render: (d) =>
        needsCheckout(d) ? (
          <Badge variant={CheckoutStatusEnum.tone(d.checkout_status!)}>
            {CheckoutStatusEnum.label(d.checkout_status!)}
          </Badge>
        ) : (
          clock(d.check_out)
        ),
    },
    {
      key: "hours",
      header: "Hours",
      align: "right",
      render: (d) => hoursLabel(d.hours_worked),
    },
  ];

  const isInitialLoading = query.isLoading && !query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description="Your daily check-ins and hours"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={String(month)}
              onChange={(v) => setMonth(Number(v))}
              options={MONTH_OPTIONS}
              className="w-40"
            />
            <Select
              value={String(year)}
              onChange={(v) => setYear(Number(v))}
              options={yearOptions}
              className="w-28"
            />
          </div>
        }
      />

      {/* Days left open. Surfaced above the table because the whole problem is that
          nobody notices a forgotten tap-out until payroll is short. */}
      {fixable.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-warning/25 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {fixable.length === 1
                  ? "One day is still open"
                  : `${fixable.length} days are still open`}
              </p>
              <p className="text-xs text-foreground-muted">
                You clocked in but never tapped out. Set the time you finished so your
                hours are right.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAdjusting(fixable[0])}>
            Fix {formatOrdinalDate(fixable[0].date)}
          </Button>
        </div>
      )}

      {/* Summary */}
      {isInitialLoading ? (
        <SkeletonStats count={5} />
      ) : summary ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatusCard title="Present" value={String(summary.present ?? 0)} icon={CheckCircle2} variant="success" />
          <StatusCard title="Absent" value={String(summary.absent ?? 0)} icon={XCircle} variant="warning" />
          <StatusCard title="Late" value={String(summary.late ?? 0)} icon={Clock} variant="accent" />
          <StatusCard title="On Leave" value={String(summary.on_leave ?? 0)} icon={Palmtree} variant="primary" />
          <StatusCard title="Avg / Day" value={hoursLabel(summary.avg_daily_hours)} icon={Timer} variant="default" />
        </div>
      ) : null}

      <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />

      {query.isError && !query.data ? (
        <ErrorState message="We couldn't load your attendance." onRetry={() => query.refetch()} />
      ) : (
        <Card className="p-2">
          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(d) => d.date}
            onRowClick={(d) => setSelected(d)}
            isLoading={isInitialLoading}
            empty={
              <EmptyState
                icon={CalendarDays}
                title="No attendance found"
                description="No records match this month or filter."
              />
            }
          />
        </Card>
      )}

      {/* Sessions drawer */}
      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? formatOrdinalDate(selected.date) : "Attendance"}
        size="md"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-muted">Status</span>
              <Badge variant={AttendanceReportStatusEnum.tone(selected.status)}>
                {AttendanceReportStatusEnum.label(selected.status)}
              </Badge>
            </div>

            {selected.status === "holiday" && selected.holiday_name ? (
              <Card className="flex items-center gap-3 border-none bg-secondary/40 p-4 shadow-none">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-accent">
                  <Palmtree className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selected.holiday_name}</p>
                  <p className="text-sm text-foreground-muted">Public holiday</p>
                </div>
              </Card>
            ) : selected.sessions && selected.sessions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Sessions
                </p>
                {selected.sessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4"
                  >
                    <div className="space-y-1.5 text-sm">
                      <span className="flex items-center gap-2 text-foreground">
                        <LogIn className="h-4 w-4 text-success" /> {clock(s.in)}
                      </span>
                      <span className="flex items-center gap-2 text-foreground">
                        <LogOut className="h-4 w-4 text-destructive" /> {clock(s.out)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <DetailStat label="Check-In" value={clock(selected.check_in)} />
                <DetailStat label="Check-Out" value={clock(selected.check_out)} />
                <DetailStat label="Hours" value={hoursLabel(selected.hours_worked)} />
              </div>
            )}

            {selected.can_adjust_checkout && (
              <div className="rounded-[var(--radius-lg)] border border-warning/25 bg-warning/5 p-4">
                <p className="text-sm font-medium text-foreground">
                  {needsCheckout(selected)
                    ? "This day never closed"
                    : "Left later than this?"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                  Set the time you finished. Because the day has already passed, HR
                  approves it before it counts towards your hours.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    // Swap sheets rather than stacking them.
                    setAdjusting(selected);
                    setSelected(null);
                  }}
                >
                  Set checkout time
                </Button>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <CheckoutAdjustSheet
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        date={adjusting?.date ?? ""}
        checkInTime={adjusting?.sessions?.[0]?.in ?? adjusting?.check_in ?? null}
        // The log includes today, and today's correction applies immediately — telling
        // someone it goes to HR when it doesn't is the kind of small lie that stops
        // people using the fix at all.
        backdated={!!adjusting && adjusting.date !== toWireDate(new Date())}
        isPending={adjust.isPending}
        onSubmit={(body) => adjust.mutate(body, { onSuccess: () => setAdjusting(null) })}
      />
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
