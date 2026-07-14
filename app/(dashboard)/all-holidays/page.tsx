"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Palmtree, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { formatOrdinalDate } from "@/lib/format";
import { HOLIDAY_TYPE_LABELS, type HolidayType } from "@/lib/enums";
import { hasRole, useAuthStore } from "@/stores/auth-store";
import type { Holiday } from "@/lib/api/holidays";
import { useHolidays } from "./use-holidays";

const TYPE_TONE: Record<string, "default" | "success" | "warning" | "muted"> = {
  religious: "success",
  national: "default",
  company: "warning",
};

export default function AllHolidaysPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user && hasRole(user.role, "admin");
  const { filter, setFilter, query, filtered, counts } = useHolidays();

  const tabs = [
    { value: "upcoming", label: "Upcoming", count: counts.upcoming },
    { value: "past", label: "Past", count: counts.past },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holidays"
        description="Company holiday calendar"
        actions={
          isAdmin ? (
            <Button onClick={() => router.push("/all-holidays/create")}>
              <Plus className="h-4 w-4" /> Add Holiday
            </Button>
          ) : undefined
        }
      />

      <FilterTabs
        tabs={tabs}
        value={filter}
        onChange={(v) => setFilter(v as typeof filter)}
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={filtered}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-secondary/50"
              />
            ))}
          </div>
        }
        emptyIcon={Palmtree}
        emptyTitle={filter === "past" ? "No past holidays" : "No upcoming holidays"}
        emptyDescription={
          filter === "past"
            ? "Past holidays will appear here."
            : "Upcoming holidays will appear here."
        }
      >
        {(rows) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((h) => (
              <HolidayCard key={h.id} holiday={h} />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

function HolidayCard({ holiday }: { holiday: Holiday }) {
  const typeLabel =
    HOLIDAY_TYPE_LABELS[holiday.type as HolidayType] ?? holiday.type;
  return (
    <Card className="overflow-hidden">
      {holiday.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={holiday.image}
          alt={holiday.name}
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-primary-muted">
          <CalendarDays className="h-10 w-10 text-primary" />
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground-muted">
              {formatOrdinalDate(holiday.date)}
            </p>
            <h3 className="truncate font-semibold text-foreground">
              {holiday.name}
            </h3>
          </div>
          <Badge variant={TYPE_TONE[holiday.type] ?? "muted"}>{typeLabel}</Badge>
        </div>
        <p className="text-xs text-foreground-subtle">
          {holiday.days} {holiday.days === 1 ? "day" : "days"}
        </p>
        {holiday.description && (
          <p className="line-clamp-2 text-sm text-foreground-muted">
            {holiday.description}
          </p>
        )}
      </div>
    </Card>
  );
}
