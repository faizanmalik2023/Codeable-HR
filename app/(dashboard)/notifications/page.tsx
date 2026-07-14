"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  FileCheck2,
  FileText,
  MessageSquare,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { NOTIFICATION_FILTERS } from "@/lib/enums";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNotifications } from "./use-notifications";
import type { NotificationModel } from "@/types";

/* Notification category → icon + tone mapping (mirrors the dashboard's activityVisual). */
function notificationVisual(category: string): { icon: LucideIcon; className: string } {
  const c = (category ?? "").toLowerCase();
  if (c.includes("leave")) return { icon: CalendarCheck, className: "bg-success-muted text-success" };
  if (c.includes("eod")) return { icon: FileText, className: "bg-primary-muted text-primary" };
  if (c.includes("payslip") || c.includes("salary"))
    return { icon: Wallet, className: "bg-success-muted text-success" };
  if (c.includes("claim")) return { icon: FileCheck2, className: "bg-warning-muted text-warning" };
  if (c.includes("expense")) return { icon: Receipt, className: "bg-warning-muted text-warning" };
  if (c.includes("ticket")) return { icon: MessageSquare, className: "bg-primary-muted text-primary" };
  if (c.includes("policy")) return { icon: FileCheck2, className: "bg-secondary text-foreground-muted" };
  return { icon: Bell, className: "bg-secondary text-foreground-muted" };
}

/* Deep-link map keyed by `notification.data.target`. */
const TARGET_ROUTES: Record<string, string> = {
  leave: "/leaves",
  eod: "/eod-reports",
  claim: "/insurance-claims",
  expense: "/expense-claims",
  ticket: "/my-issues",
  policy: "/policies",
  holiday: "/all-holidays",
  payslip: "/salary-details",
  profile: "/profile",
  security: "/settings",
};

const FILTER_LABELS: Record<string, string> = { all: "All", unread: "Unread", read: "Read" };

export default function NotificationsPage() {
  const router = useRouter();
  const { filter, setFilter, pagination, page, setPage, query, markRead, markAllRead } =
    useNotifications();

  const tabs = NOTIFICATION_FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] }));

  function handleClick(n: NotificationModel) {
    if (!n.is_read) markRead.mutate(n.id);
    const target = n.data?.target;
    const route = target ? TARGET_ROUTES[target] : undefined;
    if (route) router.push(route);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with what's happening"
        actions={
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        }
      />

      <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        isEmpty={(d) => (d.items?.length ?? 0) === 0}
        skeleton={<SkeletonList items={5} />}
        emptyIcon={Bell}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up."
      >
        {(d) => (
          <div className="space-y-2">
            {d.items.map((n) => (
              <NotificationRow key={n.id} n={n} onClick={() => handleClick(n)} />
            ))}
          </div>
        )}
      </QueryState>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onClick }: { n: NotificationModel; onClick: () => void }) {
  const { icon: Icon, className } = notificationVisual(String(n.category));
  const unread = !n.is_read;

  return (
    <Card
      hover
      onClick={onClick}
      className={cn(
        "cursor-pointer p-4",
        unread && "border-primary/20 bg-primary-muted/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", className)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{n.title}</p>
            {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
          {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-foreground-muted">{n.body}</p>}
        </div>
        <span className="shrink-0 whitespace-nowrap text-xs text-foreground-subtle">
          {timeAgo(n.created_at, n.time_ago)}
        </span>
      </div>
    </Card>
  );
}
