"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePeople } from "./use-people";
import type { EmployeeListItem } from "@/lib/api/employees";

const STATUS_TONE: Record<string, "success" | "warning" | "muted" | "destructive"> = {
  active: "success",
  on_leave: "warning",
  probation: "warning",
  inactive: "muted",
  terminated: "destructive",
};

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PeoplePage() {
  const router = useRouter();
  const {
    query,
    filtered,
    total,
    departmentChips,
    search,
    setSearch,
    department,
    setDepartment,
  } = usePeople();

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Employee directory"
        actions={
          <Button onClick={() => router.push("/people/add")}>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        }
      />

      {/* Search */}
      <Input
        icon={<Search className="h-4 w-4" />}
        placeholder="Search by name, code, or position…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Department filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <DeptChip
          label="All"
          count={total}
          active={department === "all"}
          onClick={() => setDepartment("all")}
        />
        {departmentChips.map((d) => (
          <DeptChip
            key={d.id}
            label={d.name}
            count={d.count}
            active={department === d.name}
            onClick={() => setDepartment(d.name)}
          />
        ))}
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.items}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex flex-col items-center text-center">
                  <Skeleton variant="circular" className="mb-3 h-16 w-16" />
                  <Skeleton variant="text" className="mb-1 h-5 w-24" />
                  <Skeleton variant="text" className="mb-2 h-4 w-20" />
                  <Skeleton variant="default" className="h-5 w-16 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        }
        emptyIcon={Users}
        emptyTitle="No employees yet"
        emptyDescription="Add your first team member to get started."
        emptyAction={{ label: "Add Employee", onClick: () => router.push("/people/add") }}
      >
        {() => (
          <div className="space-y-3">
            <p className="text-sm text-foreground-muted">
              {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
            </p>
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-foreground-muted">
                No employees match your search.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((emp) => (
                  <EmployeeTile
                    key={emp.id}
                    employee={emp}
                    onClick={() => router.push(`/people/${emp.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}

function DeptChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-foreground-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function EmployeeTile({
  employee,
  onClick,
}: {
  employee: EmployeeListItem;
  onClick: () => void;
}) {
  return (
    <Card hover className="cursor-pointer p-4" onClick={onClick}>
      <div className="flex flex-col items-center text-center">
        <Avatar
          name={employee.full_name}
          src={employee.avatar ?? undefined}
          size="xl"
          className="mb-3"
        />
        <h3 className="font-semibold text-foreground">{employee.full_name}</h3>
        <p className="text-xs text-foreground-subtle">{employee.employee_code}</p>
        <p className="mb-2 mt-1 text-sm text-foreground-muted">
          {employee.designation?.name ?? "—"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {employee.department?.name && (
            <Badge variant="muted" className="text-xs">
              {employee.department.name}
            </Badge>
          )}
          <Badge variant={STATUS_TONE[employee.status] ?? "muted"} className="text-xs">
            {statusLabel(employee.status)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
