"use client";

import * as React from "react";
import { AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatOrdinalDate } from "@/lib/format";

/**
 * Set the checkout time for a day left open, for people who clocked in and forgot to
 * tap out. Attendance comes from biometric punches, so this is the one place an
 * employee authors their own attendance data — which is why the sheet is explicit
 * about what happens next rather than just saying "saved".
 *
 * Same-day corrections apply immediately. A BACKDATED one is held until HR approves,
 * because correcting a day that already closed is a request to rewrite history. The
 * server decides which; this component only has to say so honestly up front.
 */
export interface CheckoutAdjustSheetProps {
  open: boolean;
  onClose: () => void;
  /** The day being closed, `YYYY-MM-DD`. */
  date: string;
  /**
   * When they clocked in. Accepts EITHER an ISO datetime (the live record) or a bare
   * `HH:mm` (the month log, which the server pre-formats with orgTimeOfDay). Both
   * reach this component, and `new Date("09:04")` is Invalid Date — which would print
   * a broken hint and make the after-check-in guard silently never fire.
   */
  checkInTime?: string | null;
  /** True when `date` is not today, i.e. this will go to HR rather than apply. */
  backdated: boolean;
  isPending: boolean;
  onSubmit: (body: { check_out_time: string; date: string; reason?: string }) => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Resolve a check-in value to a real Date on `date`, accepting both wire forms:
 * an ISO datetime (live record) or a bare `HH:mm` (month log). Returns null when
 * unparseable, so callers degrade to "no hint, no guard" rather than to Invalid Date
 * comparisons that quietly evaluate false.
 */
const resolveCheckIn = (value: string | null | undefined, date: string): Date | null => {
  if (!value) return null;
  const hm = /^(\d{1,2}):(\d{2})/.exec(value);
  if (hm) {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, Number(hm[1]), Number(hm[2]), 0, 0);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** `HH:MM` in the viewer's local zone, which is what the `time` input speaks. */
const toTimeValue = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export function CheckoutAdjustSheet({
  open,
  onClose,
  date,
  checkInTime,
  backdated,
  isPending,
  onSubmit,
}: CheckoutAdjustSheetProps) {
  const [time, setTime] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Reset whenever the sheet opens for a (possibly different) day, so yesterday's
  // half-typed correction never carries into today's.
  React.useEffect(() => {
    if (!open) return;
    // Today defaults to right now — the common case is someone leaving, and making them
    // type the current time is a step for nothing. A past day gets no default: that one
    // goes to HR, and a guessed time is not something to put in their mouth.
    setTime(backdated ? "" : toTimeValue(new Date()));
    setReason("");
    setError(null);
  }, [open, date, backdated]);

  const checkInAt = React.useMemo(
    () => resolveCheckIn(checkInTime, date),
    [checkInTime, date]
  );
  const checkInLabel = checkInAt ? toTimeValue(checkInAt) : null;

  /**
   * Combine the picked wall-clock time with the day being closed. Built from explicit
   * parts rather than `new Date(\`${date}T${time}\`)` so it is unambiguously local:
   * the bare-date form is parsed as UTC by the spec, which would shift the recorded
   * checkout by the timezone offset and silently misreport the day's hours.
   */
  const buildIso = (): string | null => {
    if (!/^\d{2}:\d{2}$/.test(time)) return null;
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  };

  const submit = () => {
    const iso = buildIso();
    if (!iso) {
      setError("Pick the time you finished.");
      return;
    }
    // Only the two checks a person can fix by retyping. Everything else (the correction
    // window, leave conflicts, whether the time falls inside the shift-day) is the
    // server's call and comes back as a readable message.
    if (new Date(iso) > new Date()) {
      setError("That's in the future. Pick the time you actually finished.");
      return;
    }
    if (checkInAt && new Date(iso) <= checkInAt) {
      setError(`Has to be after you clocked in${checkInLabel ? ` at ${checkInLabel}` : ""}.`);
      return;
    }
    setError(null);
    onSubmit({ check_out_time: iso, date, reason: reason.trim() || undefined });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Set your checkout time"
      description={formatOrdinalDate(date)}
    >
      <div className="space-y-5 px-6 py-5">
        <div
          className={
            backdated
              ? "flex items-start gap-3 rounded-[var(--radius-lg)] border border-warning/25 bg-warning/5 p-4"
              : "flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-secondary/25 p-4"
          }
        >
          <span className="mt-0.5 shrink-0 text-foreground-muted">
            {backdated ? (
              <AlertCircle className="h-4 w-4 text-warning" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-success" />
            )}
          </span>
          <p className="text-xs leading-relaxed text-foreground-muted">
            {backdated ? (
              <>
                This day has already closed, so your time goes to HR for approval before
                it counts towards your hours. You&apos;ll see it as{" "}
                <span className="font-medium text-foreground">Awaiting HR</span> until
                then.
              </>
            ) : (
              <>
                This applies straight away and closes today. Your hours update as soon as
                you save.
              </>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-time">Checkout time</Label>
          <Input
            id="checkout-time"
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setError(null);
            }}
            icon={<Clock className="h-4 w-4" />}
            error={error ?? undefined}
          />
          {checkInLabel && !error && (
            <p className="text-xs text-foreground-subtle">
              You clocked in at {checkInLabel}.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout-reason">
            Reason {backdated ? <span className="text-foreground-subtle">(helps HR)</span> : <span className="text-foreground-subtle">(optional)</span>}
          </Label>
          <Textarea
            id="checkout-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Forgot to tap out on the way home"
            maxLength={500}
            className="min-h-[88px]"
          />
        </div>
      </div>

      <SheetFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={submit} isLoading={isPending} disabled={!time}>
          {backdated ? "Send to HR" : "Save checkout"}
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
