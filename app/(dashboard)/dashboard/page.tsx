"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Sun,
  CloudSun,
  Moon,
  CalendarDays,
  MessageSquare,
  Users,
  UserCheck,
  ClipboardCheck,
  Palmtree,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { StatusCard } from "@/components/shared/status-card";
import { QuickActionCard } from "@/components/shared/quick-action-card";
import { ActivityItem } from "@/components/shared/activity-item";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { PeopleSnapshot, IssuesInboxWidget } from "@/components/hr";
import { ClockWidget } from "@/components/time";
import { getGreeting, cn } from "@/lib/utils";
import { useAuthStore, hasRole } from "@/stores/auth-store";

// Get time-based icon
function getTimeIcon() {
  const hour = new Date().getHours();
  if (hour < 12) return Sun;
  if (hour < 17) return CloudSun;
  return Moon;
}

// EOD Status - determines dashboard emphasis
const eodStatus: "not_submitted" | "draft" | "submitted" = "not_submitted";

// Mock data for different sections
const leaveBalance = {
  annual: { remaining: 18, total: 21 },
  sick: { remaining: 8, total: 10 },
  casual: { remaining: 3, total: 5 },
};

const upcomingLeaves = [
  {
    id: 1,
    startDate: "2024-12-24",
    endDate: "2024-12-26",
    type: "Annual",
    status: "approved",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "leave_approved",
    title: "Leave request approved",
    description: "Your leave request for Dec 25-27 has been approved by Sarah",
    time: "2 hours ago",
    icon: CheckCircle2,
    iconColor: "text-success",
    iconBg: "bg-success-muted",
    isNew: true,
  },
  {
    id: 2,
    type: "eod_reminder",
    title: "EOD reminder",
    description: "Don't forget to submit your EOD report today",
    time: "5 hours ago",
    icon: AlertCircle,
    iconColor: "text-warning",
    iconBg: "bg-warning-muted",
    isNew: false,
  },
  {
    id: 3,
    type: "promotion",
    title: "Team celebration",
    description: "Sarah Johnson has been promoted to Senior Engineer",
    time: "1 day ago",
    icon: TrendingUp,
    iconColor: "text-primary",
    iconBg: "bg-primary-muted",
    isNew: false,
  },
];

const teamLeaves = [
  { name: "Alice Cooper", dates: "Dec 24-26", type: "Annual", avatar: undefined },
  { name: "Bob Smith", dates: "Dec 25", type: "Casual", avatar: undefined },
  { name: "Carol White", dates: "Dec 27-29", type: "Annual", avatar: undefined },
];

// Manager mock data
const teamMembers = [
  { id: "1", name: "Alice Cooper", role: "Senior Developer", eodStatus: "submitted" as const },
  { id: "2", name: "Bob Smith", role: "Developer", eodStatus: "draft" as const },
  { id: "3", name: "Carol White", role: "Designer", eodStatus: "not_submitted" as const },
  { id: "4", name: "David Brown", role: "Developer", eodStatus: "submitted" as const },
  { id: "5", name: "Emma Wilson", role: "QA Engineer", eodStatus: "not_submitted" as const },
];

const pendingLeaveRequests = [
  {
    id: "1",
    employeeName: "Bob Smith",
    leaveType: "Annual",
    startDate: "2024-02-14",
    endDate: "2024-02-16",
    days: 3,
  },
  {
    id: "2",
    employeeName: "Carol White",
    leaveType: "Sick",
    startDate: "2024-01-20",
    endDate: "2024-01-20",
    days: 1,
  },
];

// HR mock data
const hrStats = {
  totalEmployees: 47,
  onLeaveToday: 3,
  pendingLeaves: 8,
};

const hrPendingLeaves = [
  { id: "1", name: "Bob Smith", department: "Engineering", leaveType: "Annual", days: 3 },
  { id: "2", name: "Carol White", department: "Design", leaveType: "Sick", days: 1 },
  { id: "3", name: "David Brown", department: "Engineering", leaveType: "Casual", days: 2 },
  { id: "4", name: "Emma Wilson", department: "QA", leaveType: "Annual", days: 5 },
  { id: "5", name: "Frank Miller", department: "Engineering", leaveType: "Sick", days: 1 },
];

const hrIssueCounts = {
  open: 3,
  inProgress: 2,
  resolved: 15,
};

const recentHRIssues = [
  {
    id: "1",
    title: "Workplace accommodation request",
    type: "Accommodation",
    employeeName: "Alice Cooper",
    status: "open" as const,
    severity: "medium" as const,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Team conflict resolution",
    type: "Interpersonal",
    employeeName: "Bob Smith",
    status: "in_progress" as const,
    severity: "high" as const,
    updatedAt: "1 day ago",
  },
  {
    id: "3",
    title: "Benefits inquiry",
    type: "Benefits",
    employeeName: "Carol White",
    status: "open" as const,
    severity: "low" as const,
    updatedAt: "3 days ago",
  },
];

// Motivational messages
const motivationalMessages = [
  "Building amazing things together",
  "Your growth is our priority",
  "Making work feel like home",
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const userName = user?.name?.split(" ")[0] || "there";
  const userRole = user?.role || "employee";

  const TimeIcon = getTimeIcon();
  const greeting = getGreeting();
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  // Check if user is specifically a manager (not HR or admin who happen to have manager privileges)
  // HR manages all personnel company-wide, not a specific team
  const isManager = userRole === "manager";
  const isHR = userRole === "hr";
  const isAdmin = userRole === "admin";

  // Calculate team stats for managers
  const teamEodStats = {
    submitted: teamMembers.filter((m) => m.eodStatus === "submitted").length,
    pending: teamMembers.filter((m) => m.eodStatus !== "submitted").length,
    total: teamMembers.length,
  };

  return (
    <StaggerContainer className="space-y-8" staggerDelay={0.08}>
      {/* Welcome Header */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover p-6 md:p-8 text-primary-foreground">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/80 mb-2">
                <TimeIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{greeting}</span>
                {isManager && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 text-xs">
                    Manager
                  </Badge>
                )}
                {isHR && !isManager && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 text-xs">
                    HR
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-white/20 text-primary-foreground border-0 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome back, {userName}!
              </h1>
              <p className="text-primary-foreground/70 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {randomMessage}
              </p>
            </div>

            {/* Today's date */}
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <CalendarDays className="h-10 w-10 text-primary-foreground/80" />
              <div>
                <p className="text-2xl font-bold">{new Date().getDate()}</p>
                <p className="text-sm text-primary-foreground/70">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Clock In/Out Widget - Shows for all employees */}
      <StaggerItem>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-muted">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Time Tracking</h3>
                <p className="text-sm text-foreground-muted">Track your working hours</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClockWidget variant="compact" />
              <Link href="/time">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View Hours
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Manager Section - Team Overview (shown only to managers+) */}
      {isManager && (
        <StaggerItem>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Team Overview</h2>
              </div>
              <span className="text-sm text-foreground-muted">Today's status</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Team Size"
                value={teamMembers.length.toString()}
                subtitle="Active members"
                icon={Users}
                variant="default"
              />
              <StatusCard
                title="EODs Submitted"
                value={`${teamEodStats.submitted}/${teamEodStats.total}`}
                subtitle={teamEodStats.pending === 0 ? "All done!" : `${teamEodStats.pending} pending`}
                icon={ClipboardCheck}
                variant={teamEodStats.pending === 0 ? "success" : "warning"}
              />
              <Link href="/team/approvals" className="block">
                <StatusCard
                  title="Pending Approvals"
                  value={pendingLeaveRequests.length.toString()}
                  subtitle={pendingLeaveRequests.length > 0 ? "Needs attention" : "All clear"}
                  icon={UserCheck}
                  variant={pendingLeaveRequests.length > 0 ? "warning" : "success"}
                />
              </Link>
              <StatusCard
                title="On Leave Today"
                value="1"
                subtitle="Frank Miller"
                icon={Palmtree}
                variant="default"
              />
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Manager Quick Actions */}
      {isManager && (
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/team/eods">
              <motion.div
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
                whileHover={{ y: -2 }}
              >
                <div className={cn(
                  "p-3 rounded-lg transition-colors",
                  teamEodStats.pending > 0 ? "bg-warning-muted" : "bg-success-muted"
                )}>
                  <ClipboardCheck className={cn(
                    "h-5 w-5",
                    teamEodStats.pending > 0 ? "text-warning" : "text-success"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Review Team EODs</h3>
                    {teamEodStats.pending > 0 && (
                      <Badge variant="warning" className="text-xs">
                        {teamEodStats.pending} pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted">View your team's daily reports</p>
                </div>
                <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
              </motion.div>
            </Link>

            <Link href="/team/approvals">
              <motion.div
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card-hover transition-all cursor-pointer group"
                whileHover={{ y: -2 }}
              >
                <div className={cn(
                  "p-3 rounded-lg transition-colors",
                  pendingLeaveRequests.length > 0 ? "bg-warning-muted" : "bg-secondary"
                )}>
                  <UserCheck className={cn(
                    "h-5 w-5",
                    pendingLeaveRequests.length > 0 ? "text-warning" : "text-foreground-muted"
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Approve Leaves</h3>
                    {pendingLeaveRequests.length > 0 && (
                      <Badge variant="warning" className="text-xs">
                        {pendingLeaveRequests.length} requests
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted">Review leave requests</p>
                </div>
                <ArrowRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors" />
              </motion.div>
            </Link>
          </div>
        </StaggerItem>
      )}

      {/* HR Section - People Ops Workspace (shown only to HR+) */}
      {isHR && (
        <StaggerItem>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold text-foreground">People Operations</h2>
              </div>
              <span className="text-sm text-foreground-muted">Company-wide overview</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PeopleSnapshot
                totalEmployees={hrStats.totalEmployees}
                onLeaveToday={hrStats.onLeaveToday}
                pendingLeaves={hrStats.pendingLeaves}
                recentPending={hrPendingLeaves}
              />
              <IssuesInboxWidget
                counts={hrIssueCounts}
                recentIssues={recentHRIssues}
              />
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Personal Status Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatusCard
            title="Today's EOD"
            value={eodStatus === "submitted" ? "Submitted" : eodStatus === "draft" ? "Draft" : "Pending"}
            subtitle={eodStatus === "submitted" ? "Great job!" : "Submit before 6 PM"}
            icon={FileText}
            variant={eodStatus === "submitted" ? "success" : eodStatus === "draft" ? "warning" : "primary"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Leave Balance"
            value={`${leaveBalance.annual.remaining} days`}
            subtitle={`${leaveBalance.annual.total - leaveBalance.annual.remaining} used this year`}
            icon={Calendar}
            variant="accent"
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Hours Today"
            value="6.5h"
            subtitle="On track for 8h"
            icon={Clock}
            variant="default"
            trend={{ value: "12% vs last week", positive: true }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatusCard
            title="Upcoming Leave"
            value={upcomingLeaves.length > 0 ? "Dec 24-26" : "None"}
            subtitle={upcomingLeaves.length > 0 ? "Annual leave approved" : "No leaves scheduled"}
            icon={CalendarDays}
            variant="success"
          />
        </StaggerItem>
      </div>

      {/* Quick Actions Section */}
      <StaggerItem>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <span className="text-sm text-foreground-muted">What would you like to do?</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/eod-reports/submit">
              <QuickActionCard
                title="Submit EOD"
                description="Record today's work and accomplishments"
                icon={FileText}
                variant={eodStatus !== "submitted" ? "primary" : "default"}
                badge={eodStatus !== "submitted" ? "Due today" : undefined}
              />
            </Link>
            <Link href="/leaves/apply">
              <QuickActionCard
                title="Apply for Leave"
                description="Request time off from work"
                icon={Calendar}
              />
            </Link>
            <Link href="/my-issues/new">
              <QuickActionCard
                title="Talk to HR"
                description="Share a concern or ask a question"
                icon={MessageSquare}
              />
            </Link>
          </div>
        </div>
      </StaggerItem>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <StaggerItem className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  icon={activity.icon}
                  iconColor={activity.iconColor}
                  iconBg={activity.iconBg}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  isNew={activity.isNew}
                />
              ))}

              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-foreground-muted">
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Team Leaves - Takes 1 column */}
        <StaggerItem>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">Team Leaves</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                Calendar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {teamLeaves.map((leave, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={leave.name} src={leave.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{leave.name}</p>
                      <p className="text-xs text-foreground-muted">{leave.dates}</p>
                    </div>
                  </div>
                  <Badge variant="muted" className="text-xs">
                    {leave.type}
                  </Badge>
                </motion.div>
              ))}

              {/* More indicator */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <AvatarGroup size="xs" max={4}>
                    <Avatar name="Team Member 1" />
                    <Avatar name="Team Member 2" />
                    <Avatar name="Team Member 3" />
                    <Avatar name="Team Member 4" />
                    <Avatar name="Team Member 5" />
                    <Avatar name="Team Member 6" />
                  </AvatarGroup>
                  <span className="text-sm text-foreground-muted">
                    +3 more this month
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>

      {/* Leave Balance Detail */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Leave Balance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Annual Leave */}
              <div className="p-4 rounded-xl bg-primary-muted/50 border border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Annual Leave</span>
                  <span className="text-xs text-foreground-muted">{leaveBalance.annual.total} total</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-bold text-primary">{leaveBalance.annual.remaining}</span>
                  <span className="text-sm text-foreground-muted mb-1">days left</span>
                </div>
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(leaveBalance.annual.remaining / leaveBalance.annual.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Sick Leave */}
              <div className="p-4 rounded-xl bg-warning-muted/50 border border-warning/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Sick Leave</span>
                  <span className="text-xs text-foreground-muted">{leaveBalance.sick.total} total</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-bold text-warning">{leaveBalance.sick.remaining}</span>
                  <span className="text-sm text-foreground-muted mb-1">days left</span>
                </div>
                <div className="h-2 bg-warning/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-warning rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(leaveBalance.sick.remaining / leaveBalance.sick.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                  />
                </div>
              </div>

              {/* Casual Leave */}
              <div className="p-4 rounded-xl bg-accent-muted/50 border border-accent/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Casual Leave</span>
                  <span className="text-xs text-foreground-muted">{leaveBalance.casual.total} total</span>
                </div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-3xl font-bold text-accent">{leaveBalance.casual.remaining}</span>
                  <span className="text-sm text-foreground-muted mb-1">days left</span>
                </div>
                <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(leaveBalance.casual.remaining / leaveBalance.casual.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
