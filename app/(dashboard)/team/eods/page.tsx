"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate, cn } from "@/lib/utils";

// Mock team EOD data
const generateTeamEODs = (date: Date) => {
  const baseTeam = [
    { id: "1", name: "Alice Cooper", role: "Senior Developer", avatar: undefined },
    { id: "2", name: "Bob Smith", role: "Developer", avatar: undefined },
    { id: "3", name: "Carol White", role: "Designer", avatar: undefined },
    { id: "4", name: "David Brown", role: "Developer", avatar: undefined },
    { id: "5", name: "Emma Wilson", role: "QA Engineer", avatar: undefined },
  ];

  // Generate different statuses based on date
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return baseTeam.map((member) => ({
      ...member,
      eodStatus: "weekend" as const,
      eod: null,
    }));
  }

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isPast = date < today;

  return baseTeam.map((member, index) => {
    // For today, simulate some pending
    if (isToday) {
      const statuses = ["submitted", "submitted", "draft", "not_submitted", "not_submitted"];
      const status = statuses[index] as "submitted" | "draft" | "not_submitted";
      return {
        ...member,
        eodStatus: status,
        eod: status === "submitted" ? {
          summary: `Completed ${["feature implementation", "bug fixes", "design review", "code review", "testing"][index]}. Made progress on sprint goals.`,
          tasks: [
            { description: "Task 1 description", hours: 3 },
            { description: "Task 2 description", hours: 2.5 },
            { description: "Task 3 description", hours: 2 },
          ],
          totalHours: 7.5,
          submittedAt: new Date().toISOString(),
        } : null,
      };
    }

    // For past dates, all submitted
    if (isPast) {
      return {
        ...member,
        eodStatus: "submitted" as const,
        eod: {
          summary: `Worked on ${["feature implementation", "bug fixes", "design review", "code review", "testing"][index]}. Good progress made.`,
          tasks: [
            { description: "Completed assigned tasks", hours: 4 },
            { description: "Team collaboration", hours: 2 },
            { description: "Documentation", hours: 1.5 },
          ],
          totalHours: 7.5,
          submittedAt: date.toISOString(),
        },
      };
    }

    // Future dates
    return {
      ...member,
      eodStatus: "future" as const,
      eod: null,
    };
  });
};

type EODStatus = "submitted" | "draft" | "not_submitted" | "weekend" | "future";
type TeamMemberEOD = ReturnType<typeof generateTeamEODs>[0];

const statusConfig: Record<EODStatus, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: { label: "Submitted", color: "text-success bg-success-muted", icon: <CheckCircle2 className="h-4 w-4" /> },
  draft: { label: "Draft", color: "text-warning bg-warning-muted", icon: <Clock className="h-4 w-4" /> },
  not_submitted: { label: "Missing", color: "text-destructive bg-destructive-muted", icon: <AlertCircle className="h-4 w-4" /> },
  weekend: { label: "Weekend", color: "text-foreground-muted bg-secondary", icon: <Calendar className="h-4 w-4" /> },
  future: { label: "Upcoming", color: "text-foreground-subtle bg-secondary", icon: <Calendar className="h-4 w-4" /> },
};

export default function TeamEODsPage() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<EODStatus | "all">("all");
  const [selectedMember, setSelectedMember] = React.useState<TeamMemberEOD | null>(null);
  const [expandedMembers, setExpandedMembers] = React.useState<Set<string>>(new Set());

  const teamEODs = React.useMemo(() => generateTeamEODs(selectedDate), [selectedDate]);

  // Filter team members
  const filteredTeam = teamEODs.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || member.eodStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: teamEODs.filter((m) => m.eodStatus !== "weekend" && m.eodStatus !== "future").length,
    submitted: teamEODs.filter((m) => m.eodStatus === "submitted").length,
    draft: teamEODs.filter((m) => m.eodStatus === "draft").length,
    missing: teamEODs.filter((m) => m.eodStatus === "not_submitted").length,
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleExpanded = (memberId: string) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
  const isFuture = selectedDate > new Date();

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
              Team EODs
            </h1>
            <p className="text-sm text-foreground-muted">
              Review your team's end-of-day reports
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Date Navigation */}
      <StaggerItem>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="min-w-[200px] text-center">
                  <p className="font-semibold text-foreground text-lg">
                    {formatDate(selectedDate)}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                    {isToday && " · Today"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate("next")}
                  className="rounded-full"
                  disabled={isFuture}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {!isToday && (
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Go to Today
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Stats Summary */}
      {!isWeekend && !isFuture && (
        <StaggerItem>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-success-muted/30 border border-success/10">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm text-foreground-muted">Submitted</span>
              </div>
              <p className="text-2xl font-bold text-success">
                {stats.submitted}
                <span className="text-sm font-normal text-foreground-muted">/{stats.total}</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-warning-muted/30 border border-warning/10">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-foreground-muted">Drafts</span>
              </div>
              <p className="text-2xl font-bold text-warning">{stats.draft}</p>
            </div>
            <div className="p-4 rounded-xl bg-destructive-muted/30 border border-destructive/10">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-foreground-muted">Missing</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.missing}</p>
            </div>
          </div>
        </StaggerItem>
      )}

      {/* Filters */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "submitted", "draft", "not_submitted"] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={cn(
                  filterStatus === status && status !== "all" && {
                    submitted: "bg-success hover:bg-success/90",
                    draft: "bg-warning hover:bg-warning/90 text-warning-foreground",
                    not_submitted: "bg-destructive hover:bg-destructive/90",
                  }[status]
                )}
              >
                {status === "all" ? "All" : statusConfig[status].label}
              </Button>
            ))}
          </div>
        </div>
      </StaggerItem>

      {/* Team List */}
      <div className="space-y-3">
        {isWeekend ? (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-foreground-muted" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">It's the weekend!</h2>
              <p className="text-foreground-muted">
                No EODs are expected on weekends. Select a weekday to view reports.
              </p>
            </div>
          </StaggerItem>
        ) : isFuture ? (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-foreground-muted" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Future Date</h2>
              <p className="text-foreground-muted">
                EODs for this date haven't been submitted yet.
              </p>
            </div>
          </StaggerItem>
        ) : filteredTeam.length === 0 ? (
          <StaggerItem>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-foreground-subtle mb-4" />
              <p className="text-foreground-muted">No team members match your search</p>
            </div>
          </StaggerItem>
        ) : (
          filteredTeam.map((member, index) => (
            <StaggerItem key={member.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={cn(
                    "transition-all",
                    member.eodStatus === "submitted" && "cursor-pointer hover:border-primary/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div
                      className="flex items-center gap-4"
                      onClick={() => member.eodStatus === "submitted" && toggleExpanded(member.id)}
                    >
                      <Avatar name={member.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{member.name}</h3>
                        <p className="text-sm text-foreground-muted">{member.role}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "gap-1",
                            statusConfig[member.eodStatus].color
                          )}
                        >
                          {statusConfig[member.eodStatus].icon}
                          {statusConfig[member.eodStatus].label}
                        </Badge>

                        {member.eodStatus === "submitted" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-foreground-muted"
                          >
                            {expandedMembers.has(member.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded EOD Content */}
                    <AnimatePresence>
                      {member.eodStatus === "submitted" && expandedMembers.has(member.id) && member.eod && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border space-y-4">
                            {/* Summary */}
                            <div>
                              <h4 className="text-sm font-medium text-foreground-muted mb-2">Summary</h4>
                              <p className="text-foreground">{member.eod.summary}</p>
                            </div>

                            {/* Tasks */}
                            <div>
                              <h4 className="text-sm font-medium text-foreground-muted mb-2">Tasks</h4>
                              <div className="space-y-2">
                                {member.eod.tasks.map((task, taskIndex) => (
                                  <div
                                    key={taskIndex}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                                  >
                                    <span className="text-sm text-foreground">{task.description}</span>
                                    <Badge variant="muted">{task.hours}h</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Total Hours */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary-muted/30">
                              <span className="text-sm font-medium text-foreground">Total Hours</span>
                              <span className="font-semibold text-primary">{member.eod.totalHours}h</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))
        )}
      </div>

      {/* Completion Message */}
      {!isWeekend && !isFuture && stats.submitted === stats.total && stats.total > 0 && (
        <StaggerItem>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-success-muted/30 border border-success/10"
          >
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-success">
              All team members have submitted their EODs for {isToday ? "today" : formatDate(selectedDate)}. Great work!
            </p>
          </motion.div>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
}
