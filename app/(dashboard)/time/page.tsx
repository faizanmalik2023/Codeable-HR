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
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { ClockWidget } from "@/components/time";
import { cn } from "@/lib/utils";

// Types
type ViewMode = "day" | "week" | "month";

interface TimeSession {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string;
  duration: number; // in hours (rounded to quarter)
}

interface DayEntry {
  date: string;
  dayName: string;
  sessions: TimeSession[];
  totalHours: number;
}

// Helper to round to nearest quarter hour
function roundToQuarter(hours: number): number {
  return Math.round(hours * 4) / 4;
}

// Format hours nicely
function formatHours(hours: number): string {
  if (hours === 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Generate mock data for the past 3 months
function generateMockData(): DayEntry[] {
  const entries: DayEntry[] = [];
  const today = new Date();

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Random chance of no work (10%)
    if (Math.random() < 0.1) continue;

    const clockInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
    const clockInMinute = Math.floor(Math.random() * 60);
    const duration = 7 + Math.random() * 3; // 7-10 hours

    const sessions: TimeSession[] = [
      {
        id: `session-${i}`,
        date: date.toISOString().split("T")[0],
        clockIn: `${clockInHour.toString().padStart(2, "0")}:${clockInMinute.toString().padStart(2, "0")}`,
        clockOut: (() => {
          const endHour = clockInHour + Math.floor(duration);
          const endMinute = Math.floor((duration % 1) * 60);
          return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
        })(),
        duration: roundToQuarter(duration),
      },
    ];

    entries.push({
      date: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      sessions,
      totalHours: roundToQuarter(duration),
    });
  }

  return entries;
}

const mockData = generateMockData();

export default function TimePage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Calculate date range based on view mode
  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (viewMode === "day") {
      // Single day
    } else if (viewMode === "week") {
      // Get start of week (Sunday)
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(start.getDate() + 6);
    } else {
      // Month
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filter entries for selected range
  const filteredEntries = mockData.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate >= rangeStart && entryDate <= rangeEnd;
  });

  // Calculate stats
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.totalHours, 0);
  const avgHours = filteredEntries.length > 0 ? totalHours / filteredEntries.length : 0;

  // Navigate date
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }

    // Don't go more than 3 months back
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    if (newDate < threeMonthsAgo) return;

    // Don't go into the future
    if (newDate > new Date()) return;

    setSelectedDate(newDate);
  };

  // Format date range label
  const getDateRangeLabel = () => {
    if (viewMode === "day") {
      return selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } else if (viewMode === "week") {
      return `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${rangeEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else {
      return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
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
              My Time
            </h1>
            <p className="text-sm text-foreground-muted">
              Track your working hours
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Clock Widget */}
      <StaggerItem>
        <ClockWidget variant="full" />
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(totalHours)}
              </p>
              <p className="text-xs text-foreground-muted">
                in selected period
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
                {formatHours(roundToQuarter(avgHours))}
              </p>
              <p className="text-xs text-foreground-muted">
                per day
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Days Worked</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {filteredEntries.length}
              </p>
              <p className="text-xs text-foreground-muted">
                days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">This Week</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(
                  mockData
                    .filter((e) => {
                      const d = new Date(e.date);
                      const now = new Date();
                      const weekStart = new Date(now);
                      weekStart.setDate(now.getDate() - now.getDay());
                      return d >= weekStart;
                    })
                    .reduce((sum, e) => sum + e.totalHours, 0)
                )}
              </p>
              <p className="text-xs text-foreground-muted">
                so far
              </p>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>

      {/* View Controls */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Hours Overview</CardTitle>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
                {(["day", "week", "month"] as ViewMode[]).map((mode) => (
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
          </CardHeader>

          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-3 rounded-full bg-secondary mb-4">
                  <Clock className="h-6 w-6 text-foreground-muted" />
                </div>
                <p className="text-foreground-muted">
                  No hours tracked for this period
                </p>
              </div>
            ) : viewMode === "day" ? (
              // Day View - Show sessions
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div key={entry.date}>
                    {entry.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-1 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium text-foreground">
                              {session.clockIn} — {session.clockOut}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              Session
                            </p>
                          </div>
                        </div>
                        <Badge variant="muted" className="text-base font-semibold">
                          {formatHours(session.duration)}
                        </Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-foreground-muted">Total for the day</span>
                      <span className="font-bold text-foreground">{formatHours(entry.totalHours)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Week/Month View - Show day breakdown
              <div className="space-y-2">
                {filteredEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, index) => {
                    const date = new Date(entry.date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const maxHours = 10;
                    const barWidth = (entry.totalHours / maxHours) * 100;

                    return (
                      <motion.div
                        key={entry.date}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl transition-colors",
                          isToday ? "bg-primary-muted/30" : "hover:bg-secondary/50"
                        )}
                      >
                        {/* Date */}
                        <div className="w-16 shrink-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isToday ? "text-primary" : "text-foreground"
                          )}>
                            {entry.dayName}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {date.getDate()}
                          </p>
                        </div>

                        {/* Bar */}
                        <div className="flex-1 h-8 bg-secondary/50 rounded-lg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(barWidth, 100)}%` }}
                            transition={{ duration: 0.5, delay: index * 0.03 }}
                            className={cn(
                              "h-full rounded-lg flex items-center justify-end pr-3",
                              entry.totalHours >= 8
                                ? "bg-success/20"
                                : entry.totalHours >= 6
                                ? "bg-primary/20"
                                : "bg-warning/20"
                            )}
                          >
                            {barWidth > 30 && (
                              <span className={cn(
                                "text-xs font-medium",
                                entry.totalHours >= 8
                                  ? "text-success"
                                  : entry.totalHours >= 6
                                  ? "text-primary"
                                  : "text-warning"
                              )}>
                                {formatHours(entry.totalHours)}
                              </span>
                            )}
                          </motion.div>
                        </div>

                        {/* Hours (shown when bar is short) */}
                        {barWidth <= 30 && (
                          <span className="text-sm font-medium text-foreground w-16 text-right">
                            {formatHours(entry.totalHours)}
                          </span>
                        )}

                        {/* Today indicator */}
                        {isToday && (
                          <Badge variant="default" className="text-xs">
                            Today
                          </Badge>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Helpful note */}
      <StaggerItem>
        <p className="text-center text-sm text-foreground-muted">
          All times are rounded to the nearest quarter hour (15 minutes)
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
