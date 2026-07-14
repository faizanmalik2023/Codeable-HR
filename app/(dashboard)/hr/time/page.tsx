"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { useAttendanceEmployees } from "./use-attendance-employees";

export default function HrTimePage() {
  const router = useRouter();
  const { search, setSearch, page, setPage, items, pagination, query } =
    useAttendanceEmployees();

  const open = (code: string, name: string, department?: string, avatar?: string | null) => {
    const params = new URLSearchParams({ name });
    if (department) params.set("department", department);
    if (avatar) params.set("avatar", avatar);
    router.push(`/hr/time/${encodeURIComponent(code)}?${params.toString()}`);
  };

  const skeleton = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary/70" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary/70" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary/70" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Browse an employee's attendance logs" />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
        <Input
          placeholder="Search employees by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data ? items : undefined}
        onRetry={() => query.refetch()}
        skeleton={skeleton}
        emptyIcon={Users}
        emptyTitle="No employees yet"
        emptyDescription={
          search ? "No employees match your search." : "There are no employees to display."
        }
      >
        {(list) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((emp) => (
              <Card
                key={emp.employee_code}
                hover
                className="flex cursor-pointer items-center gap-3 p-4"
                onClick={() => open(emp.employee_code, emp.full_name, emp.department, emp.avatar)}
              >
                <Avatar name={emp.full_name} src={emp.avatar ?? undefined} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{emp.full_name}</p>
                  <p className="truncate text-xs text-foreground-muted">
                    {emp.employee_code}
                    {emp.department ? ` · ${emp.department}` : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
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
