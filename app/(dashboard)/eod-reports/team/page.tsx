"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useTeamEod } from "./use-team-eod";

export default function TeamEodPage() {
  const router = useRouter();
  const query = useTeamEod();

  return (
    <div className="space-y-6">
      <PageHeader title="Team EOD" description="Members reporting to you" back />
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
                key={m.id}
                hover
                className="flex cursor-pointer items-center gap-3 p-4"
                onClick={() => router.push(`/eod-reports/team/${m.id}`)}
              >
                <Avatar name={m.full_name} src={m.avatar ?? undefined} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{m.full_name}</p>
                  {m.designation && <p className="truncate text-xs text-foreground-muted">{m.designation}</p>}
                </div>
                {typeof m.unread_count === "number" && m.unread_count > 0 && (
                  <Badge variant="warning">{m.unread_count} new</Badge>
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
