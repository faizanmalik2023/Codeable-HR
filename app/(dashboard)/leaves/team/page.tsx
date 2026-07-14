"use client";

import { useRouter } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useTeamLeaves } from "./use-team-leaves";

export default function TeamLeavesPage() {
  const router = useRouter();
  const query = useTeamLeaves();

  return (
    <div className="space-y-6">
      <PageHeader title="Team Leaves" description="Members reporting to you" back />
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        onRetry={() => query.refetch()}
        skeleton={<SkeletonList items={5} />}
        emptyIcon={Users}
        emptyTitle="No team members"
        emptyDescription="Nobody reports to you yet."
      >
        {(members) => (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <Card
                key={m.employee?.id}
                hover
                className="flex cursor-pointer items-center gap-3 p-4"
                onClick={() => router.push(`/leaves/team/${m.employee?.id}`)}
              >
                <Avatar
                  name={m.employee?.full_name}
                  src={m.employee?.avatar ?? undefined}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {m.employee?.full_name}
                  </p>
                  {m.employee?.designation && (
                    <p className="truncate text-xs text-foreground-muted">
                      {m.employee.designation}
                    </p>
                  )}
                </div>
                {typeof m.pending_count === "number" && m.pending_count > 0 && (
                  <Badge variant="warning">{m.pending_count} pending</Badge>
                )}
                <ChevronRight className="h-4 w-4 text-foreground-subtle" />
              </Card>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
