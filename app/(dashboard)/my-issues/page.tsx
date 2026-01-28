"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  Shield,
  Heart,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, cn } from "@/lib/utils";

// Types
type IssueStatus = "open" | "in_progress" | "resolved";
type IssueType = "Conflict" | "Concern" | "Policy Question" | "Other";
type IssueVisibility = "hr_only" | "hr_manager";

interface MyIssue {
  id: string;
  title: string;
  type: IssueType;
  visibility: IssueVisibility;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  hasUnreadReply: boolean;
  lastMessage?: string;
}

// Mock data - employee's own issues
const myIssues: MyIssue[] = [
  {
    id: "1",
    title: "Question about remote work policy",
    type: "Policy Question",
    visibility: "hr_only",
    status: "in_progress",
    createdAt: "2024-01-15T10:00:00",
    updatedAt: "2024-01-20T14:30:00",
    messageCount: 4,
    hasUnreadReply: true,
    lastMessage: "Thanks for clarifying. I've attached the updated policy document for your reference...",
  },
  {
    id: "2",
    title: "Concern about team dynamics",
    type: "Concern",
    visibility: "hr_only",
    status: "open",
    createdAt: "2024-01-18T09:00:00",
    updatedAt: "2024-01-18T09:00:00",
    messageCount: 1,
    hasUnreadReply: false,
  },
  {
    id: "3",
    title: "Benefits enrollment question",
    type: "Policy Question",
    visibility: "hr_manager",
    status: "resolved",
    createdAt: "2024-01-05T11:30:00",
    updatedAt: "2024-01-08T16:00:00",
    messageCount: 6,
    hasUnreadReply: false,
    lastMessage: "Glad we could help! Feel free to reach out if you have any more questions.",
  },
];

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: {
    label: "Waiting for response",
    color: "text-primary",
    bg: "bg-primary-muted",
    icon: <Clock className="h-4 w-4" />
  },
  in_progress: {
    label: "In conversation",
    color: "text-success",
    bg: "bg-success-muted",
    icon: <MessageSquare className="h-4 w-4" />
  },
  resolved: {
    label: "Resolved",
    color: "text-foreground-muted",
    bg: "bg-secondary",
    icon: <CheckCircle2 className="h-4 w-4" />
  },
};

const typeConfig: Record<IssueType, { color: string }> = {
  Conflict: { color: "text-warning" },
  Concern: { color: "text-primary" },
  "Policy Question": { color: "text-accent" },
  Other: { color: "text-foreground-muted" },
};

export default function MyIssuesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [issues, setIssues] = React.useState<MyIssue[]>(myIssues);

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Sort: unread first, then by updatedAt
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.hasUnreadReply !== b.hasUnreadReply) {
      return a.hasUnreadReply ? -1 : 1;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeCount = issues.filter(i => i.status !== "resolved").length;
  const unreadCount = issues.filter(i => i.hasUnreadReply).length;

  return (
    <StaggerContainer className="space-y-6 max-w-3xl mx-auto">
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
              My HR Conversations
            </h1>
            <p className="text-sm text-foreground-muted">
              A private space for you and HR
            </p>
          </div>
          <Link href="/my-issues/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Raise an Issue</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </StaggerItem>

      {/* Privacy Assurance */}
      <StaggerItem>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
          <div className="p-2 rounded-lg bg-primary-muted">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Your conversations are private
            </p>
            <p className="text-sm text-foreground-muted">
              Only HR (and your manager, if you choose) can see what you share here.
              We're here to help.
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Status Summary */}
      {issues.length > 0 && (
        <StaggerItem>
          <div className="flex items-center gap-4 text-sm">
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>{unreadCount} new {unreadCount === 1 ? 'reply' : 'replies'}</span>
              </div>
            )}
            {activeCount > 0 && (
              <span className="text-foreground-muted">
                {activeCount} active {activeCount === 1 ? 'conversation' : 'conversations'}
              </span>
            )}
          </div>
        </StaggerItem>
      )}

      {/* Issues List */}
      <div className="space-y-3">
        {isLoading ? (
          <StaggerItem>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <Skeleton variant="text" className="h-5 w-2/3" />
                      <Skeleton variant="default" className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton variant="text" className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton variant="default" className="h-5 w-24 rounded-full" />
                      <Skeleton variant="text" className="h-5 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>
        ) : sortedIssues.length === 0 ? (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted/30 mb-4">
                <Inbox className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No conversations yet</h3>
              <p className="text-sm text-foreground-muted max-w-sm mb-4">
                If you ever need to talk to HR about something, this is a safe place to start.
              </p>
              <Link href="/my-issues/new">
                <Button className="gap-2">
                  <Heart className="h-4 w-4" />
                  Start a Conversation
                </Button>
              </Link>
            </div>
          </StaggerItem>
        ) : (
          sortedIssues.map((issue, index) => (
            <StaggerItem key={issue.id} index={index}>
              <Link href={`/my-issues/${issue.id}`}>
                <Card className={cn(
                  "cursor-pointer transition-all hover:border-primary/30",
                  issue.hasUnreadReply && "border-l-4 border-l-primary bg-primary-muted/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Status Icon */}
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        statusConfig[issue.status].bg
                      )}>
                        <span className={statusConfig[issue.status].color}>
                          {statusConfig[issue.status].icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className={cn(
                            "font-medium text-foreground line-clamp-1",
                            issue.hasUnreadReply && "font-semibold"
                          )}>
                            {issue.title}
                          </h3>
                          {issue.hasUnreadReply && (
                            <Badge variant="default" className="shrink-0 text-xs">
                              New reply
                            </Badge>
                          )}
                        </div>

                        {/* Last message preview */}
                        {issue.lastMessage && (
                          <p className="text-sm text-foreground-muted line-clamp-1 mb-2">
                            {issue.lastMessage}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="muted" className={cn("font-normal", typeConfig[issue.type].color)}>
                            {issue.type}
                          </Badge>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full",
                            statusConfig[issue.status].bg,
                            statusConfig[issue.status].color
                          )}>
                            {statusConfig[issue.status].label}
                          </span>
                          <span className="text-foreground-subtle flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {issue.messageCount}
                          </span>
                          <span className="text-foreground-subtle">
                            · Updated {formatDate(new Date(issue.updatedAt))}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-foreground-subtle shrink-0 self-center" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))
        )}
      </div>

      {/* Supportive Footer */}
      {!isLoading && issues.length > 0 && (
        <StaggerItem>
          <div className="text-center py-6">
            <p className="text-sm text-foreground-muted">
              Need to share something new?
            </p>
            <Link href="/my-issues/new">
              <Button variant="ghost" className="mt-2 text-primary">
                Start a new conversation
              </Button>
            </Link>
          </div>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
}
