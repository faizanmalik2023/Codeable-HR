"use client";

import * as React from "react";
import { formatOrdinalDate } from "@/lib/format";
import type { IssueMessage } from "@/types";

/**
 * Shared pieces of the two HR Help threads (the employee's `/my-issues/[id]` and
 * HR's `/hr/issues/[id]`). Both render the same conversation from opposite sides,
 * so the grouping rules and the typing indicator live here rather than being
 * maintained twice and drifting apart.
 */

/**
 * Do two messages fall in the same displayed minute? Compared at minute precision
 * because that is the precision the thread renders ("9:48 PM"), so two messages 40
 * seconds apart carry an identical stamp and printing both reads as two separate
 * moments. A missing timestamp (an optimistic message still in flight) never groups.
 */
export function sameMinute(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const [x, y] = [new Date(a), new Date(b)];
  if (Number.isNaN(x.getTime()) || Number.isNaN(y.getTime())) return false;
  return Math.floor(x.getTime() / 60000) === Math.floor(y.getTime() / 60000);
}

/** "Today" / "Yesterday" / an ordinal date for a day separator. */
export function dateLabel(input: string | undefined): string {
  if (!input) return "Earlier";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (p: Date, q: Date) =>
    p.getFullYear() === q.getFullYear() &&
    p.getMonth() === q.getMonth() &&
    p.getDate() === q.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return formatOrdinalDate(d);
}

export interface MessageGroup {
  label: string;
  messages: IssueMessage[];
}

/** Split a thread into day-labelled runs. */
export function groupByDate(messages: IssueMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const label = dateLabel(message.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(message);
    else groups.push({ label, messages: [message] });
  }
  return groups;
}

/**
 * Whether a message should print its timestamp: only the LAST message of a run by
 * the same sender within the same minute. Stamping every bubble repeats the same
 * time down the thread and reads as separate moments.
 */
export function showsTime(messages: IssueMessage[], i: number): boolean {
  const message = messages[i];
  const next = messages[i + 1];
  return !next || next.sender !== message.sender || !sameMinute(message.timestamp, next.timestamp);
}

/** Whether a message leads a run by a sender (gets the avatar and name). */
export function startsRun(messages: IssueMessage[], i: number): boolean {
  const prev = messages[i - 1];
  return !prev || prev.sender !== messages[i].sender;
}

/** A day separator chip. */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/**
 * Three lifting dots while the other side composes a reply. Motivated motion: it
 * communicates live state, which is the one thing a static thread cannot show.
 * Collapses to still dots under prefers-reduced-motion (see globals.css).
 */
export function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex animate-fade-in items-center gap-2.5">
      <div className="w-8 shrink-0" aria-hidden />
      <div
        className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-secondary px-4 py-3"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-foreground-muted"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The composer shell: one bordered field holding the textarea and the send action.
 *
 * Focus is marked with a tinted border plus a 1px halo, NOT the app's default
 * `ring-2 ring-ring`. A thread's textarea holds focus for the whole session, so a
 * heavy accent ring is permanently lit and reads as an error state rather than as
 * focus. This still meets the keyboard-focus requirement without shouting.
 *
 * Radius rule for both threads: the field is `--radius-lg`, the icon action is a
 * full circle. Same on the employee and HR sides.
 */
export function ComposerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-border bg-background-secondary py-1.5 pl-3 pr-1.5 transition-colors duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/15">
      {children}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-secondary px-1 font-sans">{children}</kbd>
  );
}

/** The keyboard hint under a composer. `send` names the key that sends. */
export function ComposerHint({ send }: { send: "Enter" | "Cmd" }) {
  return (
    <p className="mt-1.5 px-1 text-[11px] text-foreground-subtle">
      {send === "Enter" ? (
        <>
          <Key>Enter</Key> to send, <Key>Shift</Key> + <Key>Enter</Key> for a new line
        </>
      ) : (
        <>
          <Key>Cmd</Key> + <Key>Enter</Key> to send, <Key>Enter</Key> for a new line
        </>
      )}
    </p>
  );
}
