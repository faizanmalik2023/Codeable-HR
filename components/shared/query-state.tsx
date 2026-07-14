"use client";

import * as React from "react";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import type { LucideIcon } from "lucide-react";

interface QueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  data: T | undefined;
  onRetry?: () => void;
  /** Predicate for the empty state; defaults to array-length / falsy check. */
  isEmpty?: (data: T) => boolean;
  skeleton?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: { label: string; onClick: () => void };
  children: (data: T) => React.ReactNode;
}

function defaultEmpty<T>(data: T): boolean {
  if (Array.isArray(data)) return data.length === 0;
  return data === null || data === undefined;
}

/**
 * Renders the standard list/detail states from spec §3.7:
 * loading skeleton → error + retry → empty → data.
 */
export function QueryState<T>({
  isLoading,
  isError,
  error,
  data,
  onRetry,
  isEmpty = defaultEmpty,
  skeleton,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  emptyAction,
  children,
}: QueryStateProps<T>) {
  if (isLoading && data === undefined) {
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }
  if (isError && data === undefined) {
    const message = error instanceof Error ? error.message : undefined;
    return <ErrorState message={message} onRetry={onRetry} />;
  }
  if (data === undefined) return <>{skeleton ?? <DefaultSkeleton />}</>;
  if (isEmpty(data)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return <>{children(data)}</>;
}

function DefaultSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-[var(--radius-lg)] bg-secondary/50 animate-pulse" />
      ))}
    </div>
  );
}
