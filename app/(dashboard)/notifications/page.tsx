"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { SkeletonList } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { NOTIFICATION_FILTERS } from "@/lib/enums";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { notificationVisual, routeForNotification } from "@/lib/notifications-nav";
import { useNotifications } from "./use-notifications";
import type { NotificationModel } from "@/types";

const FILTER_LABELS: Record<string, string> = { all: "All", unread: "Unread", read: "Read" };

export default function NotificationsPage() {
  const router = useRouter();
  const { filter, setFilter, pagination, page, setPage, query, markRead, markAllRead } =
    useNotifications();

  const tabs = NOTIFICATION_FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] }));

  function handleClick(n: NotificationModel) {
    if (!n.is_read) markRead.mutate(n.id);
    const route = routeForNotification(n);
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
