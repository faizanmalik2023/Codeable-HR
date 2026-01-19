"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  History,
  Calendar,
  ArrowRight,
  Palmtree,
  Stethoscope,
  Coffee,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaveBalanceCard, LeaveStatusBadge } from "@/components/leave";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate } from "@/lib/utils";

// Mock data
const leaveBalances = [
  { type: "Annual Leave", icon: <Palmtree className="h-5 w-5" />, remaining: 18, total: 21, color: "primary" as const },
  { type: "Sick Leave", icon: <Stethoscope className="h-5 w-5" />, remaining: 8, total: 10, color: "warning" as const },
  { type: "Casual Leave", icon: <Coffee className="h-5 w-5" />, remaining: 3, total: 5, color: "accent" as const },
];

const pendingRequests = [
  {
    id: "1",
    type: "Annual",
    startDate: "2024-02-14",
    endDate: "2024-02-16",
    days: 3,
    status: "pending" as const,
    submittedAt: "2024-01-15",
  },
];

const upcomingLeaves = [
  {
    id: "2",
    type: "Annual",
    startDate: "2024-01-24",
    endDate: "2024-01-26",
    days: 3,
    status: "approved" as const,
  },
];

const recentLeaves = [
  {
    id: "3",
    type: "Sick",
    startDate: "2024-01-10",
    endDate: "2024-01-10",
    days: 1,
    status: "approved" as const,
  },
  {
    id: "4",
    type: "Annual",
    startDate: "2023-12-25",
    endDate: "2023-12-29",
    days: 5,
    status: "approved" as const,
  },
];

export default function LeavesPage() {
  return (
    <StaggerContainer className="space-y-8">
      {/* Header */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Leaves
            </h1>
            <p className="text-foreground-muted mt-1">
              Manage your time off and view balances
            </p>
          </div>
          <Link href="/leaves/apply">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Apply for Leave
            </Button>
          </Link>
        </div>
      </StaggerItem>

      {/* Leave Balances */}
      <StaggerItem>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Your Balance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveBalances.map((balance) => (
              <LeaveBalanceCard key={balance.type} {...balance} />
            ))}
          </div>
        </div>
      </StaggerItem>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <CardTitle className="text-lg">Pending Requests</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((request) => (
                <motion.div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-warning-muted/30 border border-warning/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-warning-muted">
                      <Calendar className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {formatDate(new Date(request.startDate))}
                          {request.startDate !== request.endDate && (
                            <> — {formatDate(new Date(request.endDate))}</>
                          )}
                        </p>
                        <Badge variant="muted" className="text-xs">
                          {request.days} {request.days === 1 ? "day" : "days"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {request.type} Leave · Submitted {formatDate(new Date(request.submittedAt))}
                      </p>
                    </div>
                  </div>
                  <LeaveStatusBadge status={request.status} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {/* Upcoming Leaves */}
      {upcomingLeaves.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle className="text-lg">Upcoming Time Off</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingLeaves.map((leave) => (
                <motion.div
                  key={leave.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-success-muted/30 border border-success/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-success-muted">
                      <Palmtree className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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
                      <p className="text-sm text-foreground-muted">{leave.type} Leave</p>
                    </div>
                  </div>
                  <LeaveStatusBadge status={leave.status} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {/* Quick Links */}
      <StaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/leaves/apply">
            <motion.div
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
              whileHover={{ y: -2 }}
            >
              <div className="p-3 rounded-lg bg-primary-muted group-hover:bg-primary/20 transition-colors">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Apply for Leave</h3>
                <p className="text-sm text-foreground-muted">Request time off</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>

          <Link href="/leaves/history">
            <motion.div
              className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
              whileHover={{ y: -2 }}
            >
              <div className="p-3 rounded-lg bg-secondary group-hover:bg-secondary-hover transition-colors">
                <History className="h-5 w-5 text-foreground-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">View History</h3>
                <p className="text-sm text-foreground-muted">All your leave requests</p>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>
        </div>
      </StaggerItem>

      {/* Recent Leaves */}
      <StaggerItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Leaves</CardTitle>
            <Link href="/leaves/history">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeaves.map((leave, index) => (
              <motion.div
                key={leave.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                    {leave.type === "Annual" ? (
                      <Palmtree className="h-4 w-4 text-primary" />
                    ) : leave.type === "Sick" ? (
                      <Stethoscope className="h-4 w-4 text-warning" />
                    ) : (
                      <Coffee className="h-4 w-4 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(new Date(leave.startDate))}
                      {leave.startDate !== leave.endDate && (
                        <> — {formatDate(new Date(leave.endDate))}</>
                      )}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {leave.type} · {leave.days} {leave.days === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
                <LeaveStatusBadge status={leave.status} size="sm" />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
