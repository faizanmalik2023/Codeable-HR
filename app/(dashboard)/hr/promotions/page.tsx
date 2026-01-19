"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  TrendingUp,
  Calendar,
  Building2,
  Users,
  Sparkles,
  ChevronRight,
  Filter,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
interface PromotionRecord {
  id: string;
  employee: {
    id: string;
    name: string;
    department: string;
    avatar?: string;
  };
  fromRole: string;
  toRole: string;
  effectiveDate: string;
  addedBy: string;
  addedAt: string;
  notes?: string;
}

// Mock data - company-wide promotions
const allPromotions: PromotionRecord[] = [
  {
    id: "pr1",
    employee: { id: "emp1", name: "Alice Cooper", department: "Engineering" },
    fromRole: "Developer",
    toRole: "Senior Developer",
    effectiveDate: "2024-01-15",
    addedBy: "Emily HR",
    addedAt: "2024-01-15T10:00:00",
    notes: "Exceptional technical skills and mentorship",
  },
  {
    id: "pr2",
    employee: { id: "emp3", name: "Carol White", department: "Design" },
    fromRole: "Senior Designer",
    toRole: "Lead Designer",
    effectiveDate: "2024-01-10",
    addedBy: "Sarah Manager",
    addedAt: "2024-01-10T09:00:00",
    notes: "Outstanding design leadership and team building",
  },
  {
    id: "pr3",
    employee: { id: "emp7", name: "Grace Lee", department: "Product" },
    fromRole: "Associate PM",
    toRole: "Product Manager",
    effectiveDate: "2024-01-05",
    addedBy: "Emily HR",
    addedAt: "2024-01-05T14:00:00",
  },
  {
    id: "pr4",
    employee: { id: "emp2", name: "Bob Smith", department: "Engineering" },
    fromRole: "Junior Developer",
    toRole: "Developer",
    effectiveDate: "2023-12-15",
    addedBy: "Emily HR",
    addedAt: "2023-12-15T11:00:00",
    notes: "Consistently exceeded expectations",
  },
  {
    id: "pr5",
    employee: { id: "emp5", name: "Emma Wilson", department: "Quality Assurance" },
    fromRole: "QA Engineer",
    toRole: "Senior QA Engineer",
    effectiveDate: "2023-12-01",
    addedBy: "Sarah Manager",
    addedAt: "2023-12-01T10:00:00",
    notes: "Critical role in improving test coverage",
  },
  {
    id: "pr6",
    employee: { id: "emp8", name: "Henry Chen", department: "Engineering" },
    fromRole: "DevOps Engineer",
    toRole: "Senior DevOps Engineer",
    effectiveDate: "2023-11-15",
    addedBy: "Emily HR",
    addedAt: "2023-11-15T09:00:00",
  },
  {
    id: "pr7",
    employee: { id: "emp6", name: "Frank Miller", department: "Engineering" },
    fromRole: "Junior Developer",
    toRole: "Developer",
    effectiveDate: "2023-10-01",
    addedBy: "Emily HR",
    addedAt: "2023-10-01T10:00:00",
    notes: "Strong problem-solving skills",
  },
  {
    id: "pr8",
    employee: { id: "emp4", name: "David Brown", department: "Engineering" },
    fromRole: "Intern",
    toRole: "Junior Developer",
    effectiveDate: "2023-09-15",
    addedBy: "Sarah Manager",
    addedAt: "2023-09-15T11:00:00",
    notes: "Successful completion of internship program",
  },
];

const departments = ["All", "Engineering", "Design", "Product", "Quality Assurance", "HR", "Marketing"];

// Get unique months from promotions for date range filter
const getMonthOptions = () => {
  const months = new Set<string>();
  allPromotions.forEach((p) => {
    const date = new Date(p.effectiveDate);
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  });
  return ["All", ...Array.from(months).sort().reverse()];
};

export default function PromotionsOverviewPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [promotions] = React.useState<PromotionRecord[]>(allPromotions);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  const [monthFilter, setMonthFilter] = React.useState("All");

  const monthOptions = React.useMemo(() => getMonthOptions(), []);

  // Simulate initial loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter promotions
  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.fromRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.toRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      departmentFilter === "All" || promo.employee.department === departmentFilter;
    const matchesMonth =
      monthFilter === "All" ||
      promo.effectiveDate.startsWith(monthFilter);
    return matchesSearch && matchesDepartment && matchesMonth;
  });

  // Group by month for display
  const groupedByMonth = filteredPromotions.reduce((acc, promo) => {
    const date = new Date(promo.effectiveDate);
    const monthKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(promo);
    return acc;
  }, {} as Record<string, PromotionRecord[]>);

  // Stats
  const stats = {
    thisMonth: promotions.filter((p) => {
      const date = new Date(p.effectiveDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    thisQuarter: promotions.filter((p) => {
      const date = new Date(p.effectiveDate);
      const now = new Date();
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return date >= quarterStart;
    }).length,
    total: promotions.length,
  };

  // Format month for display in filter
  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === "All") return "All Time";
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Retry on error
  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  if (hasError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ErrorState
          title="Couldn't load promotions"
          message="We had trouble loading the promotions data. Please try again."
          onRetry={handleRetry}
        />
      </div>
    );
  }

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
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Growth Log
            </h1>
            <p className="text-sm text-foreground-muted">
              Celebrating career milestones across the company
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-success-muted/30 border border-success/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground-muted">This Month</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats.thisMonth}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground-muted">This Quarter</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.thisQuarter}</p>
          </div>
          <div className="p-4 rounded-xl bg-accent-muted/30 border border-accent/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground-muted">All Time</span>
            </div>
            <p className="text-2xl font-bold text-accent">{stats.total}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Filters */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search by name or role..."
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
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </StaggerItem>

      {/* Promotions List */}
      {isLoading ? (
        <StaggerItem>
          <div className="space-y-6">
            <Skeleton variant="text" className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-5 w-32" />
                      <Skeleton variant="text" className="h-4 w-48" />
                    </div>
                    <Skeleton variant="text" className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StaggerItem>
      ) : filteredPromotions.length === 0 ? (
        <StaggerItem>
          {searchQuery || departmentFilter !== "All" || monthFilter !== "All" ? (
            <EmptyState
              icon={Search}
              title="No promotions found"
              description="Try adjusting your filters to see more results."
              variant="search"
            />
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No promotions yet"
              description="Career milestones will appear here as they're recorded."
            />
          )}
        </StaggerItem>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, monthPromotions], groupIndex) => (
            <StaggerItem key={month} index={groupIndex}>
              <div className="space-y-4">
                {/* Month header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{month}</h2>
                  <Badge variant="muted" className="text-xs">
                    {monthPromotions.length} {monthPromotions.length === 1 ? "promotion" : "promotions"}
                  </Badge>
                </div>

                {/* Promotions list */}
                <div className="space-y-3 pl-11">
                  {monthPromotions.map((promo, index) => (
                    <Link key={promo.id} href={`/people/${promo.employee.id}`}>
                      <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Avatar with success indicator */}
                            <div className="relative">
                              <Avatar name={promo.employee.name} size="lg" />
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success/20 flex items-center justify-center border-2 border-card">
                                <Sparkles className="h-2.5 w-2.5 text-success" />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {promo.employee.name}
                                </h3>
                                <Badge variant="muted" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {promo.employee.department}
                                </Badge>
                              </div>

                              {/* Role transition */}
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-foreground-muted">{promo.fromRole}</span>
                                <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                                <span className="font-medium text-foreground">{promo.toRole}</span>
                              </div>

                              {/* Notes preview */}
                              {promo.notes && (
                                <p className="text-xs text-foreground-subtle mt-2 line-clamp-1">
                                  "{promo.notes}"
                                </p>
                              )}
                            </div>

                            {/* Date and arrow */}
                            <div className="hidden sm:flex flex-col items-end gap-1">
                              <span className="text-sm text-foreground-muted">
                                {formatDate(new Date(promo.effectiveDate))}
                              </span>
                              <span className="text-xs text-foreground-subtle">
                                by {promo.addedBy}
                              </span>
                            </div>

                            <ChevronRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors shrink-0" />
                          </div>

                          {/* Mobile date */}
                          <div className="flex items-center justify-between mt-3 sm:hidden text-xs text-foreground-subtle">
                            <span>{formatDate(new Date(promo.effectiveDate))}</span>
                            <span>by {promo.addedBy}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      )}
    </StaggerContainer>
  );
}
