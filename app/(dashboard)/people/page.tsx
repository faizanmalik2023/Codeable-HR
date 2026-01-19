"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Grid3X3,
  List,
  ChevronRight,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// Types
type EmployeeStatus = "active" | "on_leave" | "remote";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  location: string;
  status: EmployeeStatus;
  avatar?: string;
  joinDate: string;
  manager?: string;
}

// Mock data
const employees: Employee[] = [
  {
    id: "emp1",
    name: "Alice Cooper",
    email: "alice.cooper@codeable.com",
    phone: "+1 234 567 8901",
    role: "Senior Developer",
    department: "Engineering",
    location: "San Francisco",
    status: "active",
    joinDate: "2021-03-15",
    manager: "Sarah Manager",
  },
  {
    id: "emp2",
    name: "Bob Smith",
    email: "bob.smith@codeable.com",
    phone: "+1 234 567 8902",
    role: "Developer",
    department: "Engineering",
    location: "Remote",
    status: "remote",
    joinDate: "2022-06-01",
    manager: "Sarah Manager",
  },
  {
    id: "emp3",
    name: "Carol White",
    email: "carol.white@codeable.com",
    role: "Lead Designer",
    department: "Design",
    location: "New York",
    status: "active",
    joinDate: "2020-09-10",
    manager: "Design Lead",
  },
  {
    id: "emp4",
    name: "David Brown",
    email: "david.brown@codeable.com",
    phone: "+1 234 567 8904",
    role: "Developer",
    department: "Engineering",
    location: "San Francisco",
    status: "on_leave",
    joinDate: "2023-01-20",
    manager: "Sarah Manager",
  },
  {
    id: "emp5",
    name: "Emma Wilson",
    email: "emma.wilson@codeable.com",
    role: "QA Engineer",
    department: "Quality Assurance",
    location: "Remote",
    status: "remote",
    joinDate: "2022-11-05",
    manager: "QA Lead",
  },
  {
    id: "emp6",
    name: "Frank Miller",
    email: "frank.miller@codeable.com",
    phone: "+1 234 567 8906",
    role: "Developer",
    department: "Engineering",
    location: "San Francisco",
    status: "active",
    joinDate: "2021-07-12",
    manager: "Sarah Manager",
  },
  {
    id: "emp7",
    name: "Grace Lee",
    email: "grace.lee@codeable.com",
    role: "Product Manager",
    department: "Product",
    location: "New York",
    status: "active",
    joinDate: "2020-04-01",
  },
  {
    id: "emp8",
    name: "Henry Chen",
    email: "henry.chen@codeable.com",
    phone: "+1 234 567 8908",
    role: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    status: "remote",
    joinDate: "2022-08-15",
    manager: "Sarah Manager",
  },
];

const departments = ["All", "Engineering", "Design", "Quality Assurance", "Product", "HR", "Marketing"];

const statusConfig: Record<EmployeeStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-success", bg: "bg-success" },
  on_leave: { label: "On Leave", color: "text-warning", bg: "bg-warning" },
  remote: { label: "Remote", color: "text-primary", bg: "bg-primary" },
};

const allEmployees: Employee[] = employees;

export default function PeoplePage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [employeeList, setEmployeeList] = React.useState<Employee[]>(allEmployees);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  // Simulate initial loading state
  React.useEffect(() => {
    // Short delay to show loading skeleton for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter employees
  const filteredEmployees = employeeList.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === "All" || emp.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Group by department for stats
  const departmentCounts = employeeList.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              People Directory
            </h1>
            <p className="text-sm text-foreground-muted">
              {employeeList.length} team members across the organization
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </StaggerItem>

      {/* Stats */}
      <StaggerItem>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground-muted">Total</span>
            </div>
            <p className="text-2xl font-bold text-primary">{employeeList.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-success-muted/30 border border-success/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm text-foreground-muted">Active</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {employeeList.filter((e) => e.status === "active").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-accent-muted/30 border border-accent/10">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground-muted">Remote</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {employeeList.filter((e) => e.status === "remote").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-warning-muted/30 border border-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-warning" />
              <span className="text-sm text-foreground-muted">On Leave</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {employeeList.filter((e) => e.status === "on_leave").length}
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Filters */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "All" ? "All Departments" : dept}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Employee Grid/List */}
      {isLoading ? (
        <StaggerItem>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 rounded-[var(--radius-lg)] border border-border bg-card">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton variant="circular" className="h-16 w-16 mb-3" />
                    <Skeleton variant="text" className="h-5 w-24 mb-1" />
                    <Skeleton variant="text" className="h-4 w-20 mb-2" />
                    <Skeleton variant="default" className="h-5 w-16 rounded-full mb-3" />
                    <Skeleton variant="text" className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 rounded-[var(--radius-lg)] border border-border bg-card">
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-32" />
                      <Skeleton variant="text" className="h-4 w-48" />
                    </div>
                    <Skeleton variant="text" className="h-4 w-32 hidden md:block" />
                    <Skeleton variant="text" className="h-4 w-24 hidden md:block" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </StaggerItem>
      ) : filteredEmployees.length === 0 ? (
        <StaggerItem>
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Try adjusting your search or filters to find team members."
            variant={searchQuery ? "search" : "default"}
          />
        </StaggerItem>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee, index) => (
            <StaggerItem key={employee.id} index={index}>
              <Link href={`/people/${employee.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                          <Avatar name={employee.name} size="xl" />
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card",
                              statusConfig[employee.status].bg
                            )}
                          />
                        </div>
                        <h3 className="font-semibold text-foreground">{employee.name}</h3>
                        <p className="text-sm text-foreground-muted mb-2">{employee.role}</p>
                        <Badge variant="muted" className="text-xs mb-3">
                          {employee.department}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-foreground-subtle">
                          <MapPin className="h-3 w-3" />
                          {employee.location}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              </Link>
            </StaggerItem>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEmployees.map((employee, index) => (
            <StaggerItem key={employee.id} index={index}>
              <Link href={`/people/${employee.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar name={employee.name} size="md" />
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card",
                              statusConfig[employee.status].bg
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{employee.name}</h3>
                            <Badge
                              className={cn(
                                "text-xs",
                                statusConfig[employee.status].color,
                                `${statusConfig[employee.status].bg}/20`
                              )}
                            >
                              {statusConfig[employee.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground-muted">
                            {employee.role} · {employee.department}
                          </p>
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-sm text-foreground-muted">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {employee.location}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-foreground-subtle" />
                      </div>
                    </CardContent>
                  </Card>
              </Link>
            </StaggerItem>
          ))}
        </div>
      )}
    </StaggerContainer>
  );
}
