"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  FileText,
  Calendar,
  Users,
  Download,
  ExternalLink,
  BookOpen,
  Shield,
  Briefcase,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
type PolicyCategory = "HR" | "Security" | "Finance" | "General" | "Operations";

interface Policy {
  id: string;
  title: string;
  description?: string;
  category: PolicyCategory;
  currentVersion: string;
  lastUpdated: string;
  fileName: string;
  fileSize: string;
}

// Mock data - only public policies visible to employees
const employeePolicies: Policy[] = [
  {
    id: "pol1",
    title: "Employee Handbook",
    description: "Comprehensive guide covering company culture, expectations, benefits, and workplace policies.",
    category: "HR",
    currentVersion: "3.2",
    lastUpdated: "2024-01-10",
    fileName: "employee-handbook-v3.2.pdf",
    fileSize: "2.4 MB",
  },
  {
    id: "pol2",
    title: "Remote Work Policy",
    description: "Guidelines for working remotely, including expectations, equipment, and communication standards.",
    category: "HR",
    currentVersion: "2.0",
    lastUpdated: "2024-01-05",
    fileName: "remote-work-policy-v2.0.pdf",
    fileSize: "845 KB",
  },
  {
    id: "pol3",
    title: "Information Security Policy",
    description: "Security protocols, data handling procedures, and incident reporting guidelines.",
    category: "Security",
    currentVersion: "4.1",
    lastUpdated: "2023-12-20",
    fileName: "security-policy-v4.1.pdf",
    fileSize: "1.8 MB",
  },
  {
    id: "pol4",
    title: "Expense Reimbursement Guide",
    description: "Process for submitting expenses, approved categories, and reimbursement timelines.",
    category: "Finance",
    currentVersion: "1.3",
    lastUpdated: "2023-11-15",
    fileName: "expense-guide-v1.3.pdf",
    fileSize: "520 KB",
  },
  {
    id: "pol5",
    title: "Code of Conduct",
    description: "Expected behavior, ethics guidelines, and professional standards for all employees.",
    category: "General",
    currentVersion: "2.1",
    lastUpdated: "2023-10-01",
    fileName: "code-of-conduct-v2.1.pdf",
    fileSize: "680 KB",
  },
  {
    id: "pol7",
    title: "Leave & Time Off Policy",
    description: "Guidelines for requesting time off, leave types, and approval processes.",
    category: "HR",
    currentVersion: "1.5",
    lastUpdated: "2023-09-15",
    fileName: "leave-policy-v1.5.pdf",
    fileSize: "420 KB",
  },
  {
    id: "pol8",
    title: "Health & Safety Guidelines",
    description: "Workplace safety protocols, emergency procedures, and health resources.",
    category: "Operations",
    currentVersion: "2.0",
    lastUpdated: "2023-08-01",
    fileName: "health-safety-v2.0.pdf",
    fileSize: "1.2 MB",
  },
];

const categories: PolicyCategory[] = ["HR", "Security", "Finance", "General", "Operations"];

const categoryConfig: Record<PolicyCategory, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  HR: { icon: <Users className="h-4 w-4" />, color: "text-primary", bg: "bg-primary-muted", label: "People & Culture" },
  Security: { icon: <Shield className="h-4 w-4" />, color: "text-warning", bg: "bg-warning-muted", label: "Security" },
  Finance: { icon: <Briefcase className="h-4 w-4" />, color: "text-success", bg: "bg-success-muted", label: "Finance" },
  General: { icon: <BookOpen className="h-4 w-4" />, color: "text-accent", bg: "bg-accent-muted", label: "General" },
  Operations: { icon: <Building2 className="h-4 w-4" />, color: "text-foreground-muted", bg: "bg-secondary", label: "Operations" },
};

export default function EmployeePoliciesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [policies] = React.useState<Policy[]>(employeePolicies);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<PolicyCategory | "All">("All");
  const [selectedPolicy, setSelectedPolicy] = React.useState<Policy | null>(null);

  // Simulate initial loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter policies
  const filteredPolicies = policies
    .filter((policy) => {
      const matchesSearch =
        policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || policy.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  // Group by category for display
  const groupedPolicies = categories.reduce((acc, category) => {
    const categoryPolicies = filteredPolicies.filter((p) => p.category === category);
    if (categoryPolicies.length > 0) {
      acc[category] = categoryPolicies;
    }
    return acc;
  }, {} as Record<PolicyCategory, Policy[]>);

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
          title="Couldn't load policies"
          message="We had trouble loading the company policies. Please try again."
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
              <BookOpen className="h-6 w-6 text-primary" />
              Company Policies
            </h1>
            <p className="text-sm text-foreground-muted">
              Find the information you need
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Welcome Card */}
      <StaggerItem>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-muted/50 to-accent-muted/30 border border-primary/10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Your knowledge hub
              </h2>
              <p className="text-sm text-foreground-muted">
                All company policies and guidelines in one place. Find what you need, when you need it.
              </p>
            </div>
            <Badge variant="muted" className="self-start md:self-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {policies.length} documents available
            </Badge>
          </div>
        </div>
      </StaggerItem>

      {/* Search and Filter */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PolicyCategory | "All")}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryConfig[cat].label}
              </option>
            ))}
          </select>
        </div>
      </StaggerItem>

      {/* Policies List */}
      {isLoading ? (
        <StaggerItem>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton variant="text" className="h-5 w-32" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-start gap-3">
                        <Skeleton variant="default" className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton variant="text" className="h-5 w-3/4" />
                          <Skeleton variant="text" className="h-4 w-full" />
                          <Skeleton variant="text" className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      ) : filteredPolicies.length === 0 ? (
        <StaggerItem>
          {searchQuery || categoryFilter !== "All" ? (
            <EmptyState
              icon={Search}
              title="No policies found"
              description="Try different search terms or clear your filters."
              variant="search"
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No policies available"
              description="Company policies will appear here once they're published."
            />
          )}
        </StaggerItem>
      ) : categoryFilter === "All" ? (
        // Grouped view when showing all categories
        <div className="space-y-8">
          {Object.entries(groupedPolicies).map(([category, categoryPolicies], groupIndex) => (
            <StaggerItem key={category} index={groupIndex}>
              <div className="space-y-3">
                {/* Category header */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      categoryConfig[category as PolicyCategory].bg
                    )}
                  >
                    <span className={categoryConfig[category as PolicyCategory].color}>
                      {categoryConfig[category as PolicyCategory].icon}
                    </span>
                  </div>
                  <h2 className="font-semibold text-foreground">
                    {categoryConfig[category as PolicyCategory].label}
                  </h2>
                  <Badge variant="muted" className="text-xs">
                    {categoryPolicies.length}
                  </Badge>
                </div>

                {/* Policies grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {categoryPolicies.map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      onClick={() => setSelectedPolicy(policy)}
                    />
                  ))}
                </div>
              </div>
            </StaggerItem>
          ))}
        </div>
      ) : (
        // Flat grid when filtering by category
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredPolicies.map((policy, index) => (
            <StaggerItem key={policy.id} index={index}>
              <PolicyCard
                policy={policy}
                onClick={() => setSelectedPolicy(policy)}
              />
            </StaggerItem>
          ))}
        </div>
      )}

      {/* Policy Detail Modal */}
      <Modal
        open={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        title={selectedPolicy?.title || ""}
        size="lg"
      >
        {selectedPolicy && (
          <div className="space-y-6">
            {/* Category badge and version */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "gap-1",
                  categoryConfig[selectedPolicy.category].bg,
                  categoryConfig[selectedPolicy.category].color
                )}
              >
                {categoryConfig[selectedPolicy.category].icon}
                {categoryConfig[selectedPolicy.category].label}
              </Badge>
              <Badge variant="outline">Version {selectedPolicy.currentVersion}</Badge>
            </div>

            {/* Description */}
            {selectedPolicy.description && (
              <p className="text-foreground">{selectedPolicy.description}</p>
            )}

            {/* Document card */}
            <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedPolicy.fileName}</p>
                  <p className="text-sm text-foreground-muted">{selectedPolicy.fileSize}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Document
                </Button>
                <Button className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-foreground-muted pt-2 border-t border-border">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Last updated {formatDate(new Date(selectedPolicy.lastUpdated))}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </StaggerContainer>
  );
}

// Policy card component
function PolicyCard({
  policy,
  onClick,
}: {
  policy: Policy;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              categoryConfig[policy.category].bg
            )}
          >
            <span className={categoryConfig[policy.category].color}>
              {categoryConfig[policy.category].icon}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {policy.title}
            </h3>
            {policy.description && (
              <p className="text-sm text-foreground-muted mt-0.5 line-clamp-2">
                {policy.description}
              </p>
            )}
            <p className="text-xs text-foreground-subtle mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated {formatDate(new Date(policy.lastUpdated))}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-foreground-subtle group-hover:text-primary transition-colors shrink-0 mt-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}
