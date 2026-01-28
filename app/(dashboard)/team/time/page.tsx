"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Users,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";

// Types
type ViewMode = "week" | "month";

interface TeamMemberTime {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  weeklyHours: number;
  monthlyHours: number;
  avgDaily: number;
  daysWorked: number;
  dailyBreakdown: { date: string; hours: number }[];
}

// Helper functions
function roundToQuarter(hours: number): number {
  return Math.round(hours * 4) / 4;
}

function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Generate mock team data
function generateTeamData(): TeamMemberTime[] {
  const members = [
    { id: "1", name: "Alice Cooper", role: "Senior Developer" },
    { id: "2", name: "Bob Smith", role: "Developer" },
    { id: "3", name: "Carol White", role: "Designer" },
    { id: "4", name: "David Brown", role: "Developer" },
    { id: "5", name: "Emma Wilson", role: "QA Engineer" },
  ];

  return members.map((member) => {
    const dailyBreakdown: { date: string; hours: number }[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Random hours (6-10)
      const hours = roundToQuarter(6 + Math.random() * 4);
      dailyBreakdown.push({
        date: date.toISOString().split("T")[0],
        hours,
      });
    }

    const weeklyHours = dailyBreakdown
      .filter((d) => {
        const date = new Date(d.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      })
      .reduce((sum, d) => sum + d.hours, 0);

    const monthlyHours = dailyBreakdown.reduce((sum, d) => sum + d.hours, 0);

    return {
      ...member,
      weeklyHours: roundToQuarter(weeklyHours),
      monthlyHours: roundToQuarter(monthlyHours),
      avgDaily: roundToQuarter(monthlyHours / dailyBreakdown.length),
      daysWorked: dailyBreakdown.length,
      dailyBreakdown,
    };
  });
}

const teamData = generateTeamData();

export default function TeamTimePage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
  const [expandedMember, setExpandedMember] = React.useState<string | null>(null);

  // Filter team members by search
  const filteredMembers = teamData.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get date range
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(start.getDate() + 6);
    } else {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Navigate date
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (newDate < threeMonthsAgo) return;
    if (newDate > new Date()) return;

    setSelectedDate(newDate);
  };

  // Format date range label
  const getDateRangeLabel = () => {
    if (viewMode === "week") {
      return `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Calculate team stats
  const teamStats = {
    totalHours: filteredMembers.reduce((sum, m) => sum + (viewMode === "week" ? m.weeklyHours : m.monthlyHours), 0),
    avgPerPerson: filteredMembers.length > 0
      ? filteredMembers.reduce((sum, m) => sum + (viewMode === "week" ? m.weeklyHours : m.monthlyHours), 0) / filteredMembers.length
      : 0,
    teamSize: filteredMembers.length,
  };

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
              Team Time
            </h1>
            <p className="text-sm text-foreground-muted">
              Overview of your team's working hours
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Team Stats */}
      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Team Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(teamStats.totalHours)}
              </p>
              <p className="text-xs text-foreground-muted">
                this {viewMode}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Average</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(roundToQuarter(teamStats.avgPerPerson))}
              </p>
              <p className="text-xs text-foreground-muted">
                per person
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Team Size</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {teamStats.teamSize}
              </p>
              <p className="text-xs text-foreground-muted">
                members
              </p>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>

      {/* Controls */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Team Hours</CardTitle>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
                {(["week", "month"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                      viewMode === mode
                        ? "bg-card text-foreground shadow-sm"
                        : "text-foreground-muted hover:text-foreground"
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate("prev")}
                className="rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm font-medium text-foreground">
                {getDateRangeLabel()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate("next")}
                className="rounded-full"
                disabled={rangeEnd >= new Date()}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-3 rounded-full bg-secondary mb-4">
                  <Users className="h-6 w-6 text-foreground-muted" />
                </div>
                <p className="text-foreground-muted">
                  No team members found
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMembers.map((member, index) => {
                  const hours = viewMode === "week" ? member.weeklyHours : member.monthlyHours;
                  const maxHours = viewMode === "week" ? 50 : 200;
                  const barWidth = (hours / maxHours) * 100;
                  const isExpanded = expandedMember === member.id;

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer transition-colors",
                          isExpanded ? "bg-primary-muted/20" : "hover:bg-secondary/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar name={member.name} size="sm" />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {member.name}
                              </p>
                              <Badge variant="muted" className="text-xs hidden sm:inline-flex">
                                {member.role}
                              </Badge>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(barWidth, 100)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={cn(
                                  "h-full rounded-full",
                                  hours >= (viewMode === "week" ? 40 : 160)
                                    ? "bg-success"
                                    : hours >= (viewMode === "week" ? 30 : 120)
                                    ? "bg-primary"
                                    : "bg-warning"
                                )}
                              />
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground">
                              {formatHours(hours)}
                            </p>
                            <p className="text-xs text-foreground-muted">
                              avg {formatHours(member.avgDaily)}/day
                            </p>
                          </div>

                          <ChevronDown className={cn(
                            "h-5 w-5 text-foreground-muted transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </div>

                      {/* Expanded daily breakdown */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-4 pb-4"
                        >
                          <div className="pt-4 border-t border-border mt-2 space-y-2">
                            <p className="text-sm font-medium text-foreground-muted mb-3">
                              Daily Breakdown
                            </p>
                            {member.dailyBreakdown
                              .filter((d) => {
                                const date = new Date(d.date);
                                return date >= rangeStart && date <= rangeEnd;
                              })
                              .slice(0, viewMode === "week" ? 7 : 10)
                              .map((day) => {
                                const date = new Date(day.date);
                                return (
                                  <div
                                    key={day.date}
                                    className="flex items-center justify-between py-1"
                                  >
                                    <span className="text-sm text-foreground-muted">
                                      {date.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                      {formatHours(day.hours)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Note */}
      <StaggerItem>
        <p className="text-center text-sm text-foreground-muted">
          View up to 3 months of team time data
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
