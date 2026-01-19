"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Filter,
  X,
  Palmtree,
  Stethoscope,
  Coffee,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LeaveStatusBadge } from "@/components/leave";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Mock leave history data
const leaveHistory = [
  {
    id: "1",
    type: "Annual",
    startDate: "2024-02-14",
    endDate: "2024-02-16",
    days: 3,
    status: "pending" as const,
    reason: "Family vacation to the mountains",
    submittedAt: "2024-01-15",
    reviewedBy: null,
    reviewedAt: null,
    comment: null,
  },
  {
    id: "2",
    type: "Annual",
    startDate: "2024-01-24",
    endDate: "2024-01-26",
    days: 3,
    status: "approved" as const,
    reason: "Personal time off",
    submittedAt: "2024-01-10",
    reviewedBy: "Sarah Johnson",
    reviewedAt: "2024-01-11",
    comment: "Enjoy your time off!",
  },
  {
    id: "3",
    type: "Sick",
    startDate: "2024-01-10",
    endDate: "2024-01-10",
    days: 1,
    status: "approved" as const,
    reason: "Doctor appointment",
    submittedAt: "2024-01-09",
    reviewedBy: "Sarah Johnson",
    reviewedAt: "2024-01-09",
    comment: null,
  },
  {
    id: "4",
    type: "Annual",
    startDate: "2023-12-25",
    endDate: "2023-12-29",
    days: 5,
    status: "approved" as const,
    reason: "Christmas holidays",
    submittedAt: "2023-12-01",
    reviewedBy: "Sarah Johnson",
    reviewedAt: "2023-12-02",
    comment: "Happy holidays!",
  },
  {
    id: "5",
    type: "Casual",
    startDate: "2023-11-15",
    endDate: "2023-11-15",
    days: 1,
    status: "rejected" as const,
    reason: "Personal errand",
    submittedAt: "2023-11-13",
    reviewedBy: "Sarah Johnson",
    reviewedAt: "2023-11-14",
    comment: "Unfortunately we have a critical deadline that day. Could you reschedule?",
  },
  {
    id: "6",
    type: "Sick",
    startDate: "2023-10-05",
    endDate: "2023-10-06",
    days: 2,
    status: "approved" as const,
    reason: "Feeling unwell",
    submittedAt: "2023-10-05",
    reviewedBy: "Sarah Johnson",
    reviewedAt: "2023-10-05",
    comment: "Get well soon!",
  },
];

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const typeFilters = [
  { value: "all", label: "All Types" },
  { value: "Annual", label: "Annual" },
  { value: "Sick", label: "Sick" },
  { value: "Casual", label: "Casual" },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Annual":
      return <Palmtree className="h-4 w-4" />;
    case "Sick":
      return <Stethoscope className="h-4 w-4" />;
    case "Casual":
      return <Coffee className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Annual":
      return "text-primary bg-primary-muted";
    case "Sick":
      return "text-warning bg-warning-muted";
    case "Casual":
      return "text-accent bg-accent-muted";
    default:
      return "text-foreground-muted bg-secondary";
  }
};

export default function LeaveHistoryPage() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Filter leaves
  const filteredLeaves = leaveHistory.filter((leave) => {
    const matchesStatus = statusFilter === "all" || leave.status === statusFilter;
    const matchesType = typeFilter === "all" || leave.type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Group by year
  const groupedByYear = filteredLeaves.reduce((acc, leave) => {
    const year = new Date(leave.startDate).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(leave);
    return acc;
  }, {} as Record<number, typeof leaveHistory>);

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-4xl mx-auto">
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/leaves">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Leave History
                </h1>
                <p className="text-sm text-foreground-muted">
                  Your personal leave record
                </p>
              </div>
            </div>

            <Link href="/leaves/apply">
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Apply for Leave
              </Button>
            </Link>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-wrap gap-2">
            {/* Status filters */}
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    statusFilter === filter.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex gap-1">
              {typeFilters.slice(1).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(typeFilter === filter.value ? "all" : filter.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200",
                    typeFilter === filter.value
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border bg-card text-foreground-muted hover:text-foreground hover:border-border-hover"
                  )}
                >
                  {getTypeIcon(filter.value)}
                  {filter.label}
                  {typeFilter === filter.value && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Leave List */}
        <StaggerItem>
          <div className="space-y-8">
            {years.map((year) => (
              <div key={year} className="space-y-4">
                {/* Year header */}
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                    {year}
                  </h2>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-foreground-subtle">
                    {groupedByYear[Number(year)].length} {groupedByYear[Number(year)].length === 1 ? "request" : "requests"}
                  </span>
                </div>

                {/* Leave cards */}
                <div className="space-y-3">
                  {groupedByYear[Number(year)].map((leave, index) => {
                    const isExpanded = expandedId === leave.id;

                    return (
                      <motion.div
                        key={leave.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={cn(
                          "overflow-hidden transition-all duration-200",
                          isExpanded && "ring-2 ring-primary/20"
                        )}>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                            className="w-full text-left"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Type icon */}
                                <div className={cn("p-2.5 rounded-lg", getTypeColor(leave.type))}>
                                  {getTypeIcon(leave.type)}
                                </div>

                                {/* Main content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-foreground">
                                          {formatDate(new Date(leave.startDate))}
                                          {leave.startDate !== leave.endDate && (
                                            <> — {formatDate(new Date(leave.endDate))}</>
                                          )}
                                        </p>
                                        <Badge variant="muted" className="text-xs">
                                          {leave.days} {leave.days === 1 ? "day" : "days"}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-foreground-muted mt-1">
                                        {leave.type} Leave
                                        {leave.reason && ` · ${leave.reason}`}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <LeaveStatusBadge status={leave.status} />
                                      <ChevronDown
                                        className={cn(
                                          "h-4 w-4 text-foreground-muted transition-transform",
                                          isExpanded && "rotate-180"
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </button>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border">
                                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Submitted */}
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-secondary">
                                        <Clock className="h-4 w-4 text-foreground-muted" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-foreground-muted">Submitted</p>
                                        <p className="text-sm font-medium text-foreground">
                                          {formatDate(new Date(leave.submittedAt))}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Reviewed */}
                                    {leave.reviewedAt && (
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "p-2 rounded-lg",
                                          leave.status === "approved" ? "bg-success-muted" : "bg-destructive-muted"
                                        )}>
                                          {leave.status === "approved" ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-destructive" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-xs text-foreground-muted">
                                            {leave.status === "approved" ? "Approved" : "Rejected"} by
                                          </p>
                                          <p className="text-sm font-medium text-foreground">
                                            {leave.reviewedBy} · {formatDate(new Date(leave.reviewedAt))}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Manager comment */}
                                  {leave.comment && (
                                    <div className={cn(
                                      "p-4 rounded-xl",
                                      leave.status === "approved"
                                        ? "bg-success-muted/50 border border-success/10"
                                        : "bg-destructive-muted/50 border border-destructive/10"
                                    )}>
                                      <div className="flex items-start gap-3">
                                        <MessageSquare className={cn(
                                          "h-4 w-4 mt-0.5",
                                          leave.status === "approved" ? "text-success" : "text-destructive"
                                        )} />
                                        <div>
                                          <p className="text-xs font-medium text-foreground-muted mb-1">
                                            Manager's note
                                          </p>
                                          <p className="text-sm text-foreground">
                                            {leave.comment}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Pending state message */}
                                  {leave.status === "pending" && (
                                    <div className="p-4 rounded-xl bg-warning-muted/50 border border-warning/10">
                                      <div className="flex items-start gap-3">
                                        <Clock className="h-4 w-4 mt-0.5 text-warning" />
                                        <div>
                                          <p className="text-sm text-foreground">
                                            This request is waiting for approval from your manager.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {filteredLeaves.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-foreground-subtle mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No leaves found
                </h3>
                <p className="text-sm text-foreground-muted mb-6">
                  {statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't taken any leave yet"}
                </p>
                {statusFilter === "all" && typeFilter === "all" && (
                  <Link href="/leaves/apply">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Apply for Leave
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
