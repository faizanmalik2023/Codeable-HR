"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Palmtree,
  LogIn,
  LogOut,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/table";
import { SkeletonStats } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusCard } from "@/components/shared/status-card";
import { AttendanceReportStatusEnum, ATTENDANCE_FILTERS } from "@/lib/enums";
import { formatOrdinalDate } from "@/lib/format";
import { formatTime } from "@/lib/utils";
import { useEmployeeAttendance } from "./use-employee-attendance";
import type { AttendanceDay } from "@/types";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1), label }));

/** Tabs = the shared attendance filters plus Holiday for the HR view. */
const EMPLOYEE_FILTERS = [...ATTENDANCE_FILTERS, "holiday"] as const;

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

export default function HrEmployeeAttendancePage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code);
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? code;
  const department = searchParams.get("department") ?? undefined;
  const avatar = searchParams.get("avatar") ?? undefined;

  const { month, setMonth, year, setYear, filter, setFilter, filtered, summary, query } =
    useEmployeeAttendance(code);
  const [selected, setSelected] = React.useState<AttendanceDay | null>(null);

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => {
      const y = current - 3 + i;
      return { value: String(y), label: String(y) };
    });
  }, []);

  const tabs = EMPLOYEE_FILTERS.map((value) => ({
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
    { key: "check_out", header: "Check-Out", render: (d) => clock(d.check_out) },
    { key: "hours", header: "Hours", align: "right", render: (d) => hoursLabel(d.hours_worked) },
  ];

  const isInitialLoading = query.isLoading && !query.data;

  return (
    <div className="space-y-6">
      {/* Pinned employee header + period selectors */}
      <div className="sticky top-0 z-20 -mx-4 space-y-4 bg-background/95 px-4 pb-4 pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <PageHeader title="Attendance" description="Employee attendance log" back />
        <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={name} src={avatar} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{name}</p>
              <p className="truncate text-sm text-foreground-muted">
                {code}
                {department ? ` · ${department}` : ""}
              </p>
            </div>
          </div>
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
        </Card>
      </div>

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

      {/* Pinned filter tabs */}
      <div className="sticky top-0 z-10 bg-background/95 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
      </div>

      {query.isError && !query.data ? (
        <ErrorState message="We couldn't load this employee's attendance." onRetry={() => query.refetch()} />
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
          </div>
        )}
      </Sheet>
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
