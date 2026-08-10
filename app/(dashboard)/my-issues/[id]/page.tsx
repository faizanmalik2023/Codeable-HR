"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Clock,
  Send,
  MessagesSquare,
  AlertCircle,
  ShieldCheck,
  EyeOff,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/ui/empty-state";
import {
  ComposerHint,
  ComposerShell,
  DayDivider,
  TypingIndicator,
  groupByDate,
  showsTime,
  startsRun,
} from "@/components/chat/thread";
import { useEnums, toOptions } from "@/lib/api/enums";
import {
  IssueStatusEnum,
  IssuePriorityEnum,
  ISSUE_CATEGORY_LABELS,
} from "@/lib/enums";
import { formatOrdinalDate } from "@/lib/format";
import { cn, formatTime } from "@/lib/utils";
import type { EmployeeRef, IssueMessage, IssueModel } from "@/types";
import { useIssueThread } from "./use-issue-thread";

export default function IssueThreadPage() {
  const params = useParams();
  const id = String(params.id);
  const { query, issue, send, retry, notifyTyping, peerTyping } = useIssueThread(id);

  if (query.isLoading && !issue) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Issue" back />
        <Skeleton className="h-28 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="ml-auto h-20 w-2/3" />
          <Skeleton className="h-20 w-2/3" />
        </div>
      </div>
    );
  }

  if ((query.isError && !issue) || !issue) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Issue" back />
        <ErrorState
          message={query.error instanceof Error ? query.error.message : undefined}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  return (
    <IssueThread
      issue={issue}
      onSend={send}
      onRetry={retry}
      onTyping={notifyTyping}
      peerTyping={peerTyping}
    />
  );
}

function IssueThread({
  issue,
  onSend,
  onRetry,
  onTyping,
  peerTyping,
}: {
  issue: IssueModel;
  onSend: (message: string) => void;
  onRetry: (message: IssueMessage) => void;
  onTyping: () => void;
  peerTyping: boolean;
}) {
  const enums = useEnums();
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messages = issue.messages ?? [];

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // Follow the conversation — the typing indicator counts, otherwise it appears
  // below the fold exactly when it matters.
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  const categoryLabel = React.useMemo(() => {
    const opts = toOptions(enums.data?.ticket_category, ISSUE_CATEGORY_LABELS);
    return (
      opts.find((o) => o.value === issue.category)?.label ??
      ISSUE_CATEGORY_LABELS[issue.category as keyof typeof ISSUE_CATEGORY_LABELS] ??
      issue.category
    );
  }, [enums.data, issue.category]);

  const locked = issue.status === "resolved" || issue.status === "closed";
  const grouped = groupByDate(messages);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-28">
      <PageHeader title="Issue" back />

      {/* Header card */}
      <Card className="space-y-3 p-5">
        <h1 className="text-lg font-semibold text-foreground">{issue.title}</h1>
        {issue.created_date && (
          <p className="text-sm text-foreground-muted">
            Created {formatOrdinalDate(issue.created_date)}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={IssueStatusEnum.tone(issue.status)}>
            {IssueStatusEnum.label(issue.status)}
          </Badge>
          <Badge variant={IssuePriorityEnum.tone(issue.priority)}>
            {IssuePriorityEnum.label(issue.priority)}
          </Badge>
          <Badge variant="muted">{categoryLabel}</Badge>
        </div>
        {assignedName(issue.assigned_to) && (
          <p className="text-sm text-foreground-muted">
            Assigned to{" "}
            <span className="font-medium text-foreground">
              {assignedName(issue.assigned_to)}
            </span>
          </p>
        )}
      </Card>

      <PrivacyNotice anonymous={Boolean(issue.is_anonymous)} />

      {/* Thread */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-secondary/20 px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-muted text-primary">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">No replies yet</p>
            <p className="max-w-xs text-xs text-foreground-muted">
              Send a message below and HR will get back to you right here.
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <DayDivider label={group.label} />
              {group.messages.map((message, i) => (
                <MessageBubble
                  key={message.id ?? `${group.label}-${i}`}
                  message={message}
                  startsRun={startsRun(group.messages, i)}
                  showTime={showsTime(group.messages, i)}
                  onRetry={onRetry}
                />
              ))}
            </div>
          ))
        )}
        {peerTyping && (
          <TypingIndicator
            label={`${assignedName(issue.assigned_to) ?? "HR"} is typing`}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto max-w-3xl p-4">
          {locked ? (
            <p className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-secondary/60 px-4 py-3 text-center text-sm text-foreground-muted">
              <AlertCircle className="h-4 w-4 shrink-0" />
              This issue has been {issue.status}. Replies are closed.
            </p>
          ) : (
            <>
              <ComposerShell>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    autoGrow();
                    onTyping();
                  }}
                  onKeyDown={(e) => {
                    // Enter sends; Shift+Enter (or Cmd/Ctrl+Enter) inserts a newline.
                    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Write a reply…"
                  rows={1}
                  className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  size="icon"
                  className="shrink-0 rounded-full transition-transform duration-150 active:scale-90 disabled:opacity-40"
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </ComposerShell>
              <ComposerHint send="Enter" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Standing reassurance about who can see this thread. An anonymous claimant has no
 * way to verify the promise from the outside, and the old screen said nothing at
 * all — so the thread stated the guarantee nowhere and the natural move was to test
 * it by asking HR directly. This states it plainly, next to the messages.
 *
 * Every claim here is enforced server-side in ticketService: `formatMessage` nulls
 * `sender_employee` on the claimant's messages for any privileged viewer of an
 * anonymous ticket, and typing events deliberately carry no name.
 */
function PrivacyNotice({ anonymous }: { anonymous: boolean }) {
  if (anonymous) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-success/25 bg-success/5 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <EyeOff className="h-4 w-4" />
        </span>
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            You&apos;re anonymous here
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
          </p>
          <ul className="space-y-1 text-xs leading-relaxed text-foreground-muted">
            <li>HR sees your messages, never your name, photo, or employee ID.</li>
            <li>Your name is stripped on the server, not just hidden in this app.</li>
            <li>Even &ldquo;typing&rdquo; reaches them with no name attached.</li>
          </ul>
          <p className="pt-0.5 text-xs text-foreground-subtle">
            Replies arrive here, never by email to your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-secondary/25 p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
        <Lock className="h-4 w-4" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">This is a private thread</p>
        <p className="text-xs leading-relaxed text-foreground-muted">
          Only you and the HR team can open it, not your manager and not your
          teammates. You raised this one under your own name.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  startsRun,
  showTime,
  onRetry,
}: {
  message: IssueMessage;
  startsRun: boolean;
  showTime: boolean;
  onRetry: (message: IssueMessage) => void;
}) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center">
        <span className="max-w-[80%] rounded-full bg-secondary/50 px-3 py-1 text-center text-xs text-foreground-muted">
          {message.content}
        </span>
      </div>
    );
  }

  const own = message.sender === "user";
  const sending = message.delivery === "sending";
  const failed = message.delivery === "failed";
  const time = message.timestamp ? formatTime(message.timestamp) : null;

  if (own) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div
          className={cn(
            "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground",
            "animate-message-in transition-opacity duration-200",
            sending && "opacity-60"
          )}
        >
          {message.content}
        </div>
        {sending ? (
          <span className="flex items-center gap-1 text-[11px] text-foreground-subtle">
            <Clock className="h-3 w-3" /> Sending…
          </span>
        ) : failed ? (
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="text-[11px] font-medium text-destructive hover:underline"
          >
            Not sent. Tap to retry
          </button>
        ) : showTime && time ? (
          <span className="text-[11px] text-foreground-subtle">{time}</span>
        ) : null}
      </div>
    );
  }

  // HR message — avatar + name only lead a run of consecutive replies.
  const senderName = message.sender_employee?.full_name ?? "HR";
  const senderAvatar = message.sender_employee?.avatar;
  return (
    <div className="flex items-start gap-2.5">
      {startsRun ? (
        <Avatar size="sm" src={senderAvatar ?? undefined} name={senderName} />
      ) : (
        <div className="w-8 shrink-0" aria-hidden />
      )}
      <div className="flex max-w-[80%] flex-col items-start gap-1">
        {startsRun && (
          <span className="text-xs font-medium text-foreground-muted">{senderName}</span>
        )}
        <div className="animate-message-in whitespace-pre-wrap rounded-2xl rounded-tl-md bg-secondary px-4 py-2.5 text-sm text-foreground">
          {message.content}
        </div>
        {showTime && time && (
          <span className="text-[11px] text-foreground-subtle">{time}</span>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

function assignedName(assigned: EmployeeRef | string | undefined): string | null {
  if (!assigned) return null;
  if (typeof assigned === "string") return assigned;
  return assigned.full_name ?? assigned.name ?? null;
}

// sameMinute / dateLabel / groupByDate and the run-grouping rules now live in
// components/chat/thread so both threads stay in step.
