"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PenLine,
  History,
  Calendar,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EODStatusBadge } from "@/components/eod";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate } from "@/lib/utils";

// Mock data
const todayStatus: "not_started" | "draft" | "submitted" = "draft";
const recentEODs = [
  { date: "2024-01-16", status: "submitted", hours: 8, summary: "Worked on dashboard UI components..." },
  { date: "2024-01-15", status: "submitted", hours: 7.5, summary: "Fixed authentication bugs and..." },
  { date: "2024-01-14", status: "submitted", hours: 8, summary: "Sprint planning and code reviews..." },
];

export default function EODReportsPage() {
  const today = new Date();

  return (
    <StaggerContainer className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <StaggerItem>
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            EOD Reports
          </h1>
          <p className="text-foreground-muted">
            Track your daily work and accomplishments
          </p>
        </div>
      </StaggerItem>

      {/* Today's EOD Card */}
      <StaggerItem>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Today's EOD
                    </h2>
                    <EODStatusBadge status={todayStatus} size="sm" />
                  </div>
                  <p className="text-foreground-muted">
                    {formatDate(today)} · {today.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                </div>
              </div>

              <Link href="/eod-reports/submit">
                <Button size="lg" className="w-full md:w-auto gap-2">
                  {todayStatus === "not_started" ? (
                    <>
                      <PenLine className="h-4 w-4" />
                      Start Writing
                    </>
                  ) : todayStatus === "draft" ? (
                    <>
                      <PenLine className="h-4 w-4" />
                      Continue Writing
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      View Today's EOD
                    </>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Status message */}
          <CardContent className="p-4 md:p-6 border-t border-border/50">
            {todayStatus === "not_started" && (
              <div className="flex items-center gap-3 text-foreground-muted">
                <Clock className="h-5 w-5" />
                <span>You haven't started today's EOD yet. Take a moment to reflect on your work.</span>
              </div>
            )}
            {todayStatus === "draft" && (
              <div className="flex items-center gap-3 text-warning">
                <PenLine className="h-5 w-5" />
                <span>You have a draft saved. Don't forget to submit before end of day.</span>
              </div>
            )}
            {todayStatus === "submitted" && (
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span>Great job! Today's EOD has been submitted.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Quick Links */}
      <StaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/eod-reports/submit">
            <motion.div
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
              whileHover={{ y: -2 }}
            >
              <div className="p-3 rounded-lg bg-primary-muted group-hover:bg-primary/20 transition-colors">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Submit EOD</h3>
                <p className="text-sm text-foreground-muted">Write today's report</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>

          <Link href="/eod-reports/history">
            <motion.div
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
              whileHover={{ y: -2 }}
            >
              <div className="p-3 rounded-lg bg-secondary group-hover:bg-secondary-hover transition-colors">
                <History className="h-5 w-5 text-foreground-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">View History</h3>
                <p className="text-sm text-foreground-muted">Browse past EODs</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>
        </div>
      </StaggerItem>

      {/* Recent EODs Preview */}
      <StaggerItem>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Reports</h2>
            <Link href="/eod-reports/history">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentEODs.map((eod, index) => (
              <motion.div
                key={eod.date}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-muted">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">
                      {formatDate(new Date(eod.date))}
                    </p>
                    <span className="text-xs text-foreground-subtle">·</span>
                    <span className="text-sm text-foreground-muted">{eod.hours}h</span>
                  </div>
                  <p className="text-sm text-foreground-muted truncate">
                    {eod.summary}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground-subtle" />
              </motion.div>
            ))}
          </div>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}
