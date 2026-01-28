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
  Building2,
  Filter,
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

interface EmployeeTime {
  id: string;
  name: string;
  role: string;
  department: string;
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

// Generate mock company data
function generateCompanyData(): EmployeeTime[] {
  const employees = [
    { id: "1", name: "Alice Cooper", role: "Senior Developer", department: "Engineering" },
    { id: "2", name: "Bob Smith", role: "Developer", department: "Engineering" },
    { id: "3", name: "Carol White", role: "Designer", department: "Design" },
    { id: "4", name: "David Brown", role: "Developer", department: "Engineering" },
    { id: "5", name: "Emma Wilson", role: "QA Engineer", department: "Quality Assurance" },
    { id: "6", name: "Frank Miller", role: "Product Manager", department: "Product" },
    { id: "7", name: "Grace Lee", role: "UX Designer", department: "Design" },
    { id: "8", name: "Henry Chen", role: "DevOps Engineer", department: "Engineering" },
    { id: "9", name: "Isabel Garcia", role: "Marketing Lead", department: "Marketing" },
    { id: "10", name: "James Taylor", role: "Data Analyst", department: "Analytics" },
    { id: "11", name: "Karen Johnson", role: "HR Specialist", department: "Human Resources" },
    { id: "12", name: "Liam Williams", role: "Backend Developer", department: "Engineering" },
  ];

  return employees.map((employee) => {
    const dailyBreakdown: { date: string; hours: number }[] = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Random chance of no work
      if (Math.random() < 0.08) continue;

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

    const monthlyHours = dailyBreakdown
      .filter((d) => {
        const date = new Date(d.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      })
      .reduce((sum, d) => sum + d.hours, 0);

    return {
      ...employee,
      weeklyHours: roundToQuarter(weeklyHours),
      monthlyHours: roundToQuarter(monthlyHours),
      avgDaily: dailyBreakdown.length > 0 ? roundToQuarter(dailyBreakdown.reduce((sum, d) => sum + d.hours, 0) / dailyBreakdown.length) : 0,
      daysWorked: dailyBreakdown.filter((d) => {
        const date = new Date(d.date);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      }).length,
      dailyBreakdown,
    };
  });
}

const companyData = generateCompanyData();
const departments = [...new Set(companyData.map((e) => e.department))];

export default function HRTimePage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  const [expandedEmployee, setExpandedEmployee] = React.useState<string | null>(null);

  // Filter employees
  const filteredEmployees = companyData.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === "All" || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

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

  // Calculate company stats
  const companyStats = {
    totalHours: filteredEmployees.reduce((sum, e) => sum + (viewMode === "week" ? e.weeklyHours : e.monthlyHours), 0),
    avgPerPerson: filteredEmployees.length > 0
      ? filteredEmployees.reduce((sum, e) => sum + (viewMode === "week" ? e.weeklyHours : e.monthlyHours), 0) / filteredEmployees.length
      : 0,
    avgDaily: filteredEmployees.length > 0
      ? filteredEmployees.reduce((sum, e) => sum + e.avgDaily, 0) / filteredEmployees.length
      : 0,
    employeeCount: filteredEmployees.length,
  };

  // Department stats
  const departmentStats = departments.map((dept) => {
    const deptEmployees = filteredEmployees.filter((e) => e.department === dept);
    const totalHours = deptEmployees.reduce((sum, e) => sum + (viewMode === "week" ? e.weeklyHours : e.monthlyHours), 0);
    return {
      name: dept,
      employees: deptEmployees.length,
      totalHours,
      avgHours: deptEmployees.length > 0 ? totalHours / deptEmployees.length : 0,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

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
              Company Time
            </h1>
            <p className="text-sm text-foreground-muted">
              Overview of company-wide working hours
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Company Stats */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Total Hours</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(companyStats.totalHours)}
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
                {formatHours(roundToQuarter(companyStats.avgPerPerson))}
              </p>
              <p className="text-xs text-foreground-muted">
                per person
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-foreground-muted mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Daily Avg</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {formatHours(roundToQuarter(companyStats.avgDaily))}
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
                <span className="text-sm">Employees</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {companyStats.employeeCount}
              </p>
              <p className="text-xs text-foreground-muted">
                tracked
              </p>
            </CardContent>
          </Card>
        </div>
      </StaggerItem>

      {/* Department Overview */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-foreground-muted" />
              By Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {departmentStats.map((dept, index) => (
                <motion.button
                  key={dept.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setDepartmentFilter(departmentFilter === dept.name ? "All" : dept.name)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all",
                    departmentFilter === dept.name
                      ? "bg-primary-muted border-2 border-primary"
                      : "bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent"
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {dept.name}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatHours(dept.totalHours)}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {dept.employees} {dept.employees === 1 ? "person" : "people"}
                  </p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Employee List */}
      <StaggerItem>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Employee Hours</CardTitle>

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

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-3 rounded-full bg-secondary mb-4">
                  <Users className="h-6 w-6 text-foreground-muted" />
                </div>
                <p className="text-foreground-muted">
                  No employees found
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmployees
                  .sort((a, b) => (viewMode === "week" ? b.weeklyHours - a.weeklyHours : b.monthlyHours - a.monthlyHours))
                  .map((employee, index) => {
                    const hours = viewMode === "week" ? employee.weeklyHours : employee.monthlyHours;
                    const maxHours = viewMode === "week" ? 50 : 200;
                    const barWidth = (hours / maxHours) * 100;
                    const isExpanded = expandedEmployee === employee.id;

                    return (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div
                          onClick={() => setExpandedEmployee(isExpanded ? null : employee.id)}
                          className={cn(
                            "p-4 rounded-xl cursor-pointer transition-colors",
                            isExpanded ? "bg-primary-muted/20" : "hover:bg-secondary/50"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <Avatar name={employee.name} size="sm" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground">
                                  {employee.name}
                                </p>
                                <Badge variant="muted" className="text-xs">
                                  {employee.department}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground-muted">
                                {employee.role}
                              </p>

                              {/* Progress bar */}
                              <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(barWidth, 100)}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.03 }}
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
                                avg {formatHours(employee.avgDaily)}/day
                              </p>
                            </div>

                            <ChevronDown className={cn(
                              "h-5 w-5 text-foreground-muted transition-transform shrink-0",
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
                                Daily Breakdown ({employee.daysWorked} days worked)
                              </p>
                              {employee.dailyBreakdown
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
          Data available for the past 3 months · All times rounded to quarter hours
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
