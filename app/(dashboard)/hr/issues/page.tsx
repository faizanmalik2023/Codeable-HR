"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
type IssueStatus = "open" | "in_progress" | "resolved";
type IssueSeverity = "low" | "medium" | "high";
type IssueType = "Workplace" | "Interpersonal" | "Benefits" | "Policy" | "Accommodation" | "Other";

interface HRIssue {
  id: string;
  title: string;
  type: IssueType;
  employee: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  status: IssueStatus;
  severity: IssueSeverity;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  hasUnread: boolean;
}

// Mock data
const allIssues: HRIssue[] = [
  {
    id: "1",
    title: "Workplace accommodation request",
    type: "Accommodation",
    employee: { id: "emp1", name: "Alice Cooper", role: "Senior Developer", department: "Engineering" },
    status: "open",
    severity: "medium",
    createdAt: "2024-01-18T10:00:00",
    updatedAt: "2024-01-20T14:30:00",
    messageCount: 3,
    hasUnread: true,
  },
  {
    id: "2",
    title: "Team conflict resolution needed",
    type: "Interpersonal",
    employee: { id: "emp2", name: "Bob Smith", role: "Developer", department: "Engineering" },
    status: "in_progress",
    severity: "high",
    createdAt: "2024-01-15T09:00:00",
    updatedAt: "2024-01-19T16:00:00",
    messageCount: 8,
    hasUnread: false,
  },
  {
    id: "3",
    title: "Benefits enrollment question",
    type: "Benefits",
    employee: { id: "emp3", name: "Carol White", role: "Designer", department: "Design" },
    status: "open",
    severity: "low",
    createdAt: "2024-01-19T11:30:00",
    updatedAt: "2024-01-19T11:30:00",
    messageCount: 1,
    hasUnread: true,
  },
  {
    id: "4",
    title: "Remote work policy clarification",
    type: "Policy",
    employee: { id: "emp4", name: "David Brown", role: "Developer", department: "Engineering" },
    status: "resolved",
    severity: "low",
    createdAt: "2024-01-10T08:00:00",
    updatedAt: "2024-01-12T10:00:00",
    messageCount: 5,
    hasUnread: false,
  },
  {
    id: "5",
    title: "Concerns about workload distribution",
    type: "Workplace",
    employee: { id: "emp5", name: "Emma Wilson", role: "QA Engineer", department: "Quality Assurance" },
    status: "open",
    severity: "medium",
    createdAt: "2024-01-20T09:00:00",
    updatedAt: "2024-01-20T09:00:00",
    messageCount: 1,
    hasUnread: true,
  },
  {
    id: "6",
    title: "Feedback on recent policy changes",
    type: "Policy",
    employee: { id: "emp6", name: "Frank Miller", role: "Developer", department: "Engineering" },
    status: "resolved",
    severity: "low",
    createdAt: "2024-01-05T14:00:00",
    updatedAt: "2024-01-08T11:00:00",
    messageCount: 4,
    hasUnread: false,
  },
];

const statusOptions = ["All", "Open", "In Progress", "Resolved"];
const typeOptions = ["All", "Workplace", "Interpersonal", "Benefits", "Policy", "Accommodation", "Other"];

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-destructive", bg: "bg-destructive-muted", icon: <AlertCircle className="h-4 w-4" /> },
  in_progress: { label: "In Progress", color: "text-warning", bg: "bg-warning-muted", icon: <Clock className="h-4 w-4" /> },
  resolved: { label: "Resolved", color: "text-success", bg: "bg-success-muted", icon: <CheckCircle2 className="h-4 w-4" /> },
};

const severityConfig: Record<IssueSeverity, { label: string; color: string }> = {
  low: { label: "Low", color: "text-foreground-muted" },
  medium: { label: "Medium", color: "text-warning" },
  high: { label: "High", color: "text-destructive" },
};

export default function HRIssuesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [issues, setIssues] = React.useState<HRIssue[]>(allIssues);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("All");

  // Simulate initial loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || issue.status === statusFilter.toLowerCase().replace(" ", "_");
    const matchesType = typeFilter === "All" || issue.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort by status (open first, then in_progress, then resolved) and then by updatedAt
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const statusOrder = { open: 0, in_progress: 1, resolved: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Count by status
  const counts = {
    open: issues.filter((i) => i.status === "open").length,
    inProgress: issues.filter((i) => i.status === "in_progress").length,
    resolved: issues.filter((i) => i.status === "resolved").length,
  };

  const totalActive = counts.open + counts.inProgress;

  return (
    <StaggerContainer className="space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              HR Issues
            </h1>
            <p className="text-sm text-foreground-muted">
              {totalActive > 0 ? `${totalActive} active issue${totalActive > 1 ? "s" : ""} require attention` : "All issues resolved"}
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "Open"
                ? "bg-destructive-muted border-2 border-destructive"
                : "bg-destructive-muted/30 border border-destructive/10 hover:border-destructive/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "Open" ? "All" : "Open")}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-foreground-muted">Open</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{counts.open}</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "In Progress"
                ? "bg-warning-muted border-2 border-warning"
                : "bg-warning-muted/30 border border-warning/10 hover:border-warning/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "In Progress" ? "All" : "In Progress")}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-foreground-muted">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-warning">{counts.inProgress}</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "Resolved"
                ? "bg-success-muted border-2 border-success"
                : "bg-success-muted/30 border border-success/10 hover:border-success/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "Resolved" ? "All" : "Resolved")}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground-muted">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-success">{counts.resolved}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Filters */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search issues or employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type}
              </option>
            ))}
          </select>
        </div>
      </StaggerItem>

      {/* Issues List */}
      <div className="space-y-3">
        {isLoading ? (
          <StaggerItem>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-[var(--radius-lg)] border border-border bg-card">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="default" className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-3/4" />
                      <div className="flex items-center gap-2">
                        <Skeleton variant="circular" className="h-5 w-5" />
                        <Skeleton variant="text" className="h-4 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton variant="default" className="h-5 w-16 rounded-full" />
                        <Skeleton variant="default" className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>
        ) : sortedIssues.length === 0 ? (
          <StaggerItem>
            <EmptyState
              icon={searchQuery || statusFilter !== "All" || typeFilter !== "All" ? Search : CheckCircle2}
              title={
                searchQuery || statusFilter !== "All" || typeFilter !== "All"
                  ? "No issues found"
                  : "All caught up!"
              }
              description={
                searchQuery || statusFilter !== "All" || typeFilter !== "All"
                  ? "Try adjusting your filters to see more results."
                  : "There are no HR issues to address."
              }
              variant={searchQuery ? "search" : "default"}
            />
          </StaggerItem>
        ) : (
          sortedIssues.map((issue, index) => (
            <StaggerItem key={issue.id} index={index}>
              <Link href={`/hr/issues/${issue.id}`}>
                  <Card className={cn(
                    "cursor-pointer hover:border-primary/30 transition-colors",
                    issue.hasUnread && "border-l-4 border-l-primary"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          statusConfig[issue.status].bg
                        )}>
                          <span className={statusConfig[issue.status].color}>
                            {statusConfig[issue.status].icon}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={cn(
                              "font-medium text-foreground",
                              issue.hasUnread && "font-semibold"
                            )}>
                              {issue.title}
                            </h3>
                            {issue.hasUnread && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-foreground-muted mb-2">
                            <Avatar name={issue.employee.name} size="xs" />
                            <span>{issue.employee.name}</span>
                            <span>·</span>
                            <span>{issue.employee.department}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="muted" className="text-xs">
                              {issue.type}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                statusConfig[issue.status].bg,
                                statusConfig[issue.status].color
                              )}
                            >
                              {statusConfig[issue.status].label}
                            </Badge>
                            {issue.severity !== "low" && (
                              <Badge
                                variant="outline"
                                className={cn("text-xs", severityConfig[issue.severity].color)}
                              >
                                {severityConfig[issue.severity].label} Priority
                              </Badge>
                            )}
                            <span className="text-xs text-foreground-subtle flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {issue.messageCount}
                            </span>
                            <span className="text-xs text-foreground-subtle">
                              Updated {formatDate(new Date(issue.updatedAt))}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-foreground-subtle shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
              </Link>
            </StaggerItem>
          ))
        )}
      </div>
    </StaggerContainer>
  );
}
