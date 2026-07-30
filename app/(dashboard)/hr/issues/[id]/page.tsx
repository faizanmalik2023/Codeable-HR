"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Clock, Send, CheckCircle2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/modal";
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
import { useHrIssueThread } from "./use-hr-issue-thread";

export default function HrIssueThreadPage() {
  const params = useParams();
  const id = String(params.id);
  const { query, issue, send, retry, resolve, notifyTyping, peerTyping } =
    useHrIssueThread(id);

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
      onResolve={() => resolve.mutate()}
      resolving={resolve.isPending}
      onTyping={notifyTyping}
      peerTyping={peerTyping}
    />
  );
}

function IssueThread({
  issue,
  onSend,
  onRetry,
  onResolve,
  resolving,
  onTyping,
  peerTyping,
}: {
  issue: IssueModel;
  onSend: (message: string) => void;
  onRetry: (message: IssueMessage) => void;
  onResolve: () => void;
  resolving: boolean;
  onTyping: () => void;
  peerTyping: boolean;
}) {
  const enums = useEnums();
  const [draft, setDraft] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messages = issue.messages ?? [];

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  // The typing indicator counts as movement, otherwise it lands below the fold.
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
  const canResolve = issue.status === "open" || issue.status === "in_progress";
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
      <PageHeader
        title="Issue"
        back
        actions={
          canResolve ? (
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              <CheckCircle2 className="h-4 w-4" /> Resolve
            </Button>
          ) : undefined
        }
      />

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
          {issue.is_anonymous && (
            <Badge variant="outline" className="gap-1">
              <EyeOff className="h-3 w-3" /> Anonymous
            </Badge>
          )}
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

      {/* Thread */}
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.label} className="space-y-2.5">
            <DayDivider label={group.label} />
            {group.messages.map((message, i) => (
              <MessageBubble
                key={message.id ?? `${group.label}-${i}`}
                message={message}
                anonymous={Boolean(issue.is_anonymous)}
                startsRun={startsRun(group.messages, i)}
                showTime={showsTime(group.messages, i)}
                onRetry={onRetry}
              />
            ))}
          </div>
        ))}
        {peerTyping && (
          <TypingIndicator
            label={issue.is_anonymous ? "Anonymous is typing" : "The employee is typing"}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-sm md:pl-[240px]">
        <div className="mx-auto max-w-3xl p-4">
          {locked ? (
            <p className="rounded-[var(--radius-lg)] bg-secondary/60 px-4 py-3 text-center text-sm text-foreground-muted">
              This issue has been {issue.status}. Replies are closed.
            </p>
          ) : (
            <>
              {/* The shared shell replaces the app's default Textarea here. That
                  component lights a 2px accent ring on focus, and a thread's
                  textarea holds focus for the whole session, so the ring was
                  permanently on and read as an error state. It also put a circular
                  button beside a rounded-rect field, mixing two radius systems in
                  one control. */}
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
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    issue.is_anonymous
                      ? "Reply to this anonymous report…"
                      : "Reply to the employee…"
                  }
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
              <ComposerHint send="Cmd" />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onResolve();
          setConfirmOpen(false);
        }}
        title="Resolve this issue?"
        description="The employee will be notified and the thread will be closed to further replies."
        confirmLabel="Mark resolved"
        isLoading={resolving}
      />
    </div>
  );
}

function MessageBubble({
  message,
  anonymous,
  startsRun,
  showTime,
  onRetry,
}: {
  message: IssueMessage;
  anonymous: boolean;
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

  // HR view: HR's own messages sit on the right.
  const own = message.sender === "hr";
  const sending = message.delivery === "sending";
  const failed = message.delivery === "failed";
  const ownTime = message.timestamp ? formatTime(message.timestamp) : null;

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
        ) : showTime && ownTime ? (
          <span className="text-[11px] text-foreground-subtle">{ownTime}</span>
        ) : null}
      </div>
    );
  }

  // Employee message. On an anonymous ticket the server already strips
  // sender_employee, so there is no name to render — but falling back to
  // "Employee" plus an initials avatar still drew a person-shaped identity and
  // invited HR to wonder who it was. An anonymous report gets no name, no
  // initials and no photo: a masked glyph, and the word Anonymous.
  const senderName = anonymous ? "Anonymous" : message.sender_employee?.full_name ?? "Employee";
  const senderAvatar = anonymous ? null : message.sender_employee?.avatar;
  const time = message.timestamp ? formatTime(message.timestamp) : null;
  return (
    <div className="flex items-start gap-2.5">
      {!startsRun ? (
        <div className="w-8 shrink-0" aria-hidden />
      ) : anonymous ? (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground-subtle"
          aria-hidden
        >
          <EyeOff className="h-3.5 w-3.5" />
        </span>
      ) : (
        <Avatar size="sm" src={senderAvatar ?? undefined} name={senderName} />
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

// dateLabel / groupByDate / the run-grouping rules now live in
// components/chat/thread so both threads stay in step.
