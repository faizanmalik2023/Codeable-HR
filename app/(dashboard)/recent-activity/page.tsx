"use client";

import {
  Bell,
  CalendarCheck,
  FileCheck2,
  FileText,
  Filter,
  Megaphone,
  MessageSquare,
  Receipt,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { ACTIVITY_FILTERS } from "@/lib/enums";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useRecentActivity } from "./use-recent-activity";
import type { ActivityItemModel } from "@/types";

/* Activity type → icon + tone mapping (mirrors the dashboard's activityVisual). */
function activityVisual(type: string): { icon: LucideIcon; className: string } {
  const t = (type ?? "").toLowerCase();
  if (t.includes("leave") && t.includes("reject"))
    return { icon: XCircle, className: "bg-destructive-muted text-destructive" };
  if (t.includes("leave")) return { icon: CalendarCheck, className: "bg-success-muted text-success" };
  if (t.includes("eod")) return { icon: FileText, className: "bg-primary-muted text-primary" };
  if (t.includes("payslip") || t.includes("salary"))
    return { icon: Wallet, className: "bg-success-muted text-success" };
  if (t.includes("claim")) return { icon: FileCheck2, className: "bg-warning-muted text-warning" };
  if (t.includes("expense")) return { icon: Receipt, className: "bg-warning-muted text-warning" };
  if (t.includes("ticket")) return { icon: MessageSquare, className: "bg-primary-muted text-primary" };
  if (t.includes("policy")) return { icon: FileCheck2, className: "bg-secondary text-foreground-muted" };
  if (t.includes("announce")) return { icon: Megaphone, className: "bg-accent-muted text-accent" };
  return { icon: Bell, className: "bg-secondary text-foreground-muted" };
}

const FILTER_LABELS: Record<string, string> = {
  all: "All",
  leaves: "Leaves",
  eod: "EOD",
  other: "Other",
};

export default function RecentActivityPage() {
  const { filter, setFilter, items, query } = useRecentActivity();
  const tabs = ACTIVITY_FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Recent Activity" description="Your latest updates across the app" />

      <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={6} />}
        emptyIcon={Bell}
        emptyTitle="No recent activity"
        emptyDescription="Your activity will show up here as things happen."
      >
        {() =>
          items.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Nothing here"
              description="No activity matches this filter."
            />
          ) : (
            <Card className="divide-y divide-border p-2">
              {items.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))}
            </Card>
          )
        }
      </QueryState>
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityItemModel }) {
  const { icon: Icon, className } = activityVisual(activity.type);
  return (
    <div className="flex items-start gap-3 p-3">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", className)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{activity.title}</p>
        {activity.subtitle && (
          <p className="mt-0.5 truncate text-xs text-foreground-muted">{activity.subtitle}</p>
        )}
      </div>
      <span className="whitespace-nowrap text-xs text-foreground-subtle">
        {timeAgo(activity.timestamp, activity.time_ago)}
      </span>
    </div>
  );
}
