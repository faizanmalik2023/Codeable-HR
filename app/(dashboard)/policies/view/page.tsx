"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { usePolicyViewer } from "./use-policy-viewer";

function PolicyViewerContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const { query, policy } = usePolicyViewer(id);

  return (
    <div className="space-y-6">
      <PageHeader
        back
        title={policy?.title ?? "Policy"}
        description={policy?.description}
        actions={
          policy?.document_url ? (
            <a
              href={policy.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Download className="h-4 w-4" /> Open
            </a>
          ) : undefined
        }
      />

      {!id ? (
        <ErrorState title="Policy not found" message="No policy was specified." />
      ) : query.isLoading ? (
        <Skeleton className="h-[80vh] w-full rounded-[var(--radius-lg)]" />
      ) : query.isError ? (
        <ErrorState
          title="Couldn't load policy"
          message="We had trouble loading this document. Please try again."
          onRetry={() => query.refetch()}
        />
      ) : policy && !policy.document_url ? (
        <ErrorState
          title="Document unavailable"
          message="This policy has no document attached yet."
        />
      ) : policy ? (
        <Card className="p-2">
          <iframe
            src={policy.document_url}
            title={policy.title}
            className="w-full h-[80vh] rounded-[var(--radius-lg)] border border-border"
          />
        </Card>
      ) : null}
    </div>
  );
}

export default function PolicyViewerPage() {
  return (
    <React.Suspense fallback={<Skeleton className="h-[80vh] w-full rounded-[var(--radius-lg)]" />}>
      <PolicyViewerContent />
    </React.Suspense>
  );
}
