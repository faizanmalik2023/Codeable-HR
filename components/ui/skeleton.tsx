"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "text";
  animate?: boolean;
}

function Skeleton({
  className,
  variant = "default",
  animate = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-secondary/70",
        animate && "animate-pulse",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "default" && "rounded-[var(--radius)]",
        className
      )}
      {...props}
    />
  );
}

// Pre-built skeleton patterns for common UI elements
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-5 rounded-[var(--radius-lg)] border border-border bg-card", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-5/6" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border">
        <Skeleton variant="text" className="h-4 w-24" />
        <Skeleton variant="text" className="h-4 w-32 flex-1" />
        <Skeleton variant="text" className="h-4 w-20" />
        <Skeleton variant="text" className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton variant="circular" className="h-8 w-8" />
          <Skeleton variant="text" className="h-4 w-32 flex-1" />
          <Skeleton variant="text" className="h-4 w-20" />
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/2" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
          <Skeleton variant="default" className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-[var(--radius-lg)] border border-border bg-card">
          <Skeleton variant="text" className="h-3 w-20 mb-2" />
          <Skeleton variant="text" className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonStats };
