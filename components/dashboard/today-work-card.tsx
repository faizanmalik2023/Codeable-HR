"use client";

import * as React from "react";
import { Clock, LogIn, LogOut, Coffee, ArrowRight, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/utils";
import type { AttendanceToday, AttendanceTodaySession } from "@/types";
import { useTodayWork } from "@/app/(dashboard)/dashboard/use-today-work";

/* ---------------------------------- time ---------------------------------- */

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Stopwatch form for the big live timer: H:MM:SS. */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${pad2(m)}:${pad2(Math.floor(s % 60))}`;
}

/** Compact duration for session/break chips: "4h 12m", "45m", or "<1m". */
function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "<1m";
}

const ms = (iso?: string | null) => (iso ? new Date(iso).getTime() : NaN);

/** A pulsing "live" dot — the signature of an in-progress session. */
function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 motion-reduce:hidden" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
    </span>
  );
}

/* --------------------------------- derive --------------------------------- */

interface Segment {
  in: string;
  out: string | null;
  open: boolean;
  seconds: number;
  breakAfter: number; // gap in seconds to the next segment (0 if none)
}

/**
 * Normalize the day into displayable segments and the live total. Uses the
 * `sessions` array when present (biometric flow); falls back to the outer
 * check-in/out span for manual check-ins that record no sessions.
 */
function derive(record: AttendanceToday, now: number) {
  const raw: AttendanceTodaySession[] = record.sessions?.length
    ? record.sessions
    : record.check_in_time
      ? [{ in: record.check_in_time, out: record.check_out_time }]
      : [];

  const working =
    record.status === "checked_in" && raw.length > 0 && !raw[raw.length - 1].out;

  const segments: Segment[] = raw.map((seg, i) => {
    const start = ms(seg.in);
    const open = !seg.out;
    // An open segment only ticks while the user is actually clocked in; otherwise
    // it contributes nothing (guards a stale open punch from running away).
    const end = seg.out ? ms(seg.out) : working ? now : start;
    const next = raw[i + 1];
    const breakAfter =
      seg.out && next ? Math.max(0, Math.floor((ms(next.in) - ms(seg.out)) / 1000)) : 0;
    return {
      in: seg.in,
      out: seg.out,
      open,
      seconds: Number.isFinite(start) ? Math.max(0, Math.floor((end - start) / 1000)) : 0,
      breakAfter,
    };
  });

  const totalSeconds = segments.reduce((sum, s) => sum + s.seconds, 0);
  const firstIn = raw[0]?.in ?? null;
  const lastOut = working ? null : record.check_out_time ?? raw[raw.length - 1]?.out ?? null;

  return { segments, working, totalSeconds, firstIn, lastOut };
}

/* --------------------------------- status --------------------------------- */

function StatusPill({
  working,
  status,
}: {
  working: boolean;
  status: AttendanceToday["status"];
}) {
  if (working) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-success-muted px-3 py-1.5 text-sm font-medium text-success">
        <LiveDot />
        Working now
      </span>
    );
  }
  if (status === "checked_out") return <Badge variant="secondary">Checked out</Badge>;
  return <Badge variant="muted">Not checked in</Badge>;
}

/* ------------------------------- session row ------------------------------ */

function SessionRow({ seg, index }: { seg: Segment; index: number }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-3 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <span className="hidden text-xs font-medium tabular-nums text-foreground-subtle sm:inline">
            {pad2(index + 1)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <LogIn className="h-4 w-4 text-success" />
            <span className="font-medium text-foreground">{formatTime(seg.in)}</span>
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-foreground-subtle" />
          {seg.open ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <LiveDot />
              In progress
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <LogOut className="h-4 w-4 text-destructive" />
              <span className="font-medium text-foreground">{formatTime(seg.out!)}</span>
            </span>
          )}
        </div>
        <Badge variant={seg.open ? "success" : "muted"} className="tabular-nums">
          {formatDuration(seg.seconds)}
        </Badge>
      </div>

      {seg.breakAfter > 0 && (
        <div className="flex items-center gap-1.5 py-0.5 pl-4 text-xs text-foreground-subtle">
          <Coffee className="h-3.5 w-3.5" />
          Break · {formatDuration(seg.breakAfter)}
        </div>
      )}
    </>
  );
}

/* ---------------------------------- card ---------------------------------- */

/** Live "time worked today" timer + the day's work sessions. Read-only —
 *  attendance is driven by biometric punches, so there are no clock-in controls. */
export function TodayWorkCard({ enabled = true }: { enabled?: boolean }) {
  const { data, isLoading, isError, refetch, isFetching } = useTodayWork(enabled);

  // Re-render every second only while a session is actually open.
  const [now, setNow] = React.useState(() => Date.now());
  const working =
    !!data &&
    data.status === "checked_in" &&
    !!data.sessions?.length &&
    !data.sessions[data.sessions.length - 1].out;

  React.useEffect(() => {
    if (!working) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [working]);

  if (isLoading) {
    return (
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-48" />
          </div>
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="mt-5 space-y-2 border-t border-border pt-5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="flex items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground-muted">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Couldn&apos;t load today&apos;s hours</p>
            <p className="text-xs text-foreground-muted">Your work timer is temporarily unavailable.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </Card>
    );
  }

  const { segments, totalSeconds, firstIn, lastOut } = derive(data, now);

  const subtitle = working
    ? firstIn
      ? `On the clock since ${formatTime(firstIn)}`
      : "You're on the clock"
    : lastOut
      ? `Wrapped up at ${formatTime(lastOut)}`
      : "You haven't checked in yet today";

  return (
    <Card className="p-5 sm:p-6">
      {/* Header — live timer + status */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              Today&apos;s work
            </p>
            {isFetching && <RotateCw className="h-3 w-3 animate-spin text-foreground-subtle" />}
          </div>
          <p
            className="mt-1 font-mono text-4xl font-bold tabular-nums text-foreground sm:text-5xl"
            aria-live={working ? "off" : "polite"}
          >
            {formatClock(totalSeconds)}
          </p>
          <p className="mt-1.5 text-sm text-foreground-muted">{subtitle}</p>
        </div>
        <StatusPill working={working} status={data.status} />
      </div>

      {/* Sessions */}
      <div className="mt-5 border-t border-border pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Sessions
          </p>
          {segments.length > 0 && (
            <span className="text-xs text-foreground-subtle">
              {segments.length} {segments.length === 1 ? "session" : "sessions"}
            </span>
          )}
        </div>

        {segments.length ? (
          <div className="space-y-2">
            {segments.map((seg, i) => (
              <SessionRow key={`${seg.in}-${i}`} seg={seg} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-border bg-secondary/20 py-8 text-center">
            <Clock className="h-6 w-6 text-foreground-subtle" />
            <p className="text-sm font-medium text-foreground">No sessions yet today</p>
            <p className="text-xs text-foreground-muted">
              Your check-ins will appear here once you&apos;re on the clock.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
