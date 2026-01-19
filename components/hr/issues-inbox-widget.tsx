"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IssuePreview {
  id: string;
  title: string;
  type: string;
  employeeName: string;
  status: "open" | "in_progress" | "resolved";
  severity?: "low" | "medium" | "high";
  updatedAt: string;
}

interface IssuesInboxWidgetProps {
  counts: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  recentIssues?: IssuePreview[];
}

const statusConfig = {
  open: { label: "Open", color: "text-destructive", bg: "bg-destructive-muted" },
  in_progress: { label: "In Progress", color: "text-warning", bg: "bg-warning-muted" },
  resolved: { label: "Resolved", color: "text-success", bg: "bg-success-muted" },
};

const severityConfig = {
  low: { label: "Low", color: "text-foreground-muted" },
  medium: { label: "Medium", color: "text-warning" },
  high: { label: "High", color: "text-destructive" },
};

export function IssuesInboxWidget({ counts, recentIssues = [] }: IssuesInboxWidgetProps) {
  const totalActive = counts.open + counts.inProgress;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-warning" />
          <CardTitle className="text-lg">HR Issues</CardTitle>
          {totalActive > 0 && (
            <Badge variant="warning" className="text-xs">
              {totalActive} active
            </Badge>
          )}
        </div>
        <Link href="/hr/issues">
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Counts */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{counts.open}</span>
              <span className="text-foreground-muted"> Open</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{counts.inProgress}</span>
              <span className="text-foreground-muted"> In Progress</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{counts.resolved}</span>
              <span className="text-foreground-muted"> Resolved</span>
            </span>
          </div>
        </div>

        {/* Recent Issues */}
        {recentIssues.length > 0 ? (
          <div className="space-y-2">
            {recentIssues.slice(0, 3).map((issue) => (
              <Link key={issue.id} href={`/hr/issues/${issue.id}`}>
                <motion.div
                  className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {issue.title}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {issue.employeeName} · {issue.type}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs shrink-0",
                        statusConfig[issue.status].bg,
                        statusConfig[issue.status].color
                      )}
                    >
                      {statusConfig[issue.status].label}
                    </Badge>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-sm text-foreground-muted">No active issues</p>
          </div>
        )}

        {/* CTA */}
        <Link href="/hr/issues" className="block">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <MessageSquare className="h-4 w-4" />
            View All Issues
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
