"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Building2,
  Palmtree,
  Stethoscope,
  Coffee,
  ChevronDown,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton, SkeletonList, SkeletonStats } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, cn } from "@/lib/utils";

// Types
type LeaveStatus = "pending" | "approved" | "rejected";
type LeaveType = "Annual" | "Sick" | "Casual";

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    role: string;
    department: string;
    avatar?: string;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  balance: { remaining: number; total: number };
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

// Mock data
const allLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employee: { id: "emp1", name: "Bob Smith", role: "Developer", department: "Engineering" },
    leaveType: "Annual",
    startDate: "2024-02-14",
    endDate: "2024-02-16",
    days: 3,
    reason: "Family vacation - visiting relatives abroad.",
    status: "pending",
    submittedAt: "2024-01-15T10:30:00",
    balance: { remaining: 12, total: 21 },
  },
  {
    id: "2",
    employee: { id: "emp2", name: "Carol White", role: "Designer", department: "Design" },
    leaveType: "Sick",
    startDate: "2024-01-20",
    endDate: "2024-01-20",
    days: 1,
    reason: "Medical appointment",
    status: "pending",
    submittedAt: "2024-01-18T09:15:00",
    balance: { remaining: 8, total: 10 },
  },
  {
    id: "3",
    employee: { id: "emp3", name: "David Brown", role: "Developer", department: "Engineering" },
    leaveType: "Casual",
    startDate: "2024-01-25",
    endDate: "2024-01-26",
    days: 2,
    reason: "Personal errand",
    status: "pending",
    submittedAt: "2024-01-19T14:00:00",
    balance: { remaining: 3, total: 5 },
  },
  {
    id: "4",
    employee: { id: "emp4", name: "Alice Cooper", role: "Senior Developer", department: "Engineering" },
    leaveType: "Annual",
    startDate: "2024-01-10",
    endDate: "2024-01-12",
    days: 3,
    reason: "Short trip",
    status: "approved",
    submittedAt: "2024-01-05T11:00:00",
    balance: { remaining: 15, total: 21 },
    reviewedBy: "HR Manager",
    reviewedAt: "2024-01-06T09:00:00",
  },
  {
    id: "5",
    employee: { id: "emp5", name: "Emma Wilson", role: "QA Engineer", department: "Quality Assurance" },
    leaveType: "Annual",
    startDate: "2024-02-01",
    endDate: "2024-02-05",
    days: 5,
    reason: "Wedding attendance",
    status: "pending",
    submittedAt: "2024-01-20T16:00:00",
    balance: { remaining: 18, total: 21 },
  },
  {
    id: "6",
    employee: { id: "emp6", name: "Frank Miller", role: "Developer", department: "Engineering" },
    leaveType: "Sick",
    startDate: "2024-01-08",
    endDate: "2024-01-08",
    days: 1,
    reason: "Not feeling well",
    status: "rejected",
    submittedAt: "2024-01-07T08:00:00",
    balance: { remaining: 9, total: 10 },
    reviewedBy: "HR Manager",
    reviewedAt: "2024-01-07T10:00:00",
    reviewNote: "Please provide medical certificate for sick leave",
  },
];

const departments = ["All", "Engineering", "Design", "Quality Assurance", "Marketing", "HR"];
const statusOptions = ["All", "Pending", "Approved", "Rejected"];

const leaveTypeConfig: Record<LeaveType, { icon: React.ReactNode; color: string }> = {
  Annual: { icon: <Palmtree className="h-4 w-4" />, color: "text-primary" },
  Sick: { icon: <Stethoscope className="h-4 w-4" />, color: "text-warning" },
  Casual: { icon: <Coffee className="h-4 w-4" />, color: "text-accent" },
};

const statusConfig: Record<LeaveStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-warning", bg: "bg-warning-muted" },
  approved: { label: "Approved", color: "text-success", bg: "bg-success-muted" },
  rejected: { label: "Rejected", color: "text-destructive", bg: "bg-destructive-muted" },
};

export default function HRLeavesPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [requests, setRequests] = React.useState<LeaveRequest[]>(allLeaveRequests);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [departmentFilter, setDepartmentFilter] = React.useState("All");
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = React.useState<"approve" | "reject" | "adjust" | null>(null);
  const [reviewNote, setReviewNote] = React.useState("");
  const [balanceAdjustment, setBalanceAdjustment] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Simulate initial loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.employee.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter.toLowerCase();
    const matchesDepartment = departmentFilter === "All" || req.employee.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Count by status
  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const handleAction = async (type: "approve" | "reject") => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: type === "approve" ? "approved" : "rejected",
              reviewedBy: "HR Manager",
              reviewedAt: new Date().toISOString(),
              reviewNote: reviewNote || undefined,
            }
          : r
      )
    );

    setIsSubmitting(false);
    setSelectedRequest(null);
    setActionType(null);
    setReviewNote("");
  };

  const handleAdjustBalance = async () => {
    if (!selectedRequest || balanceAdjustment === 0) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              balance: {
                ...r.balance,
                remaining: Math.max(0, r.balance.remaining + balanceAdjustment),
              },
            }
          : r
      )
    );

    setIsSubmitting(false);
    setSelectedRequest(null);
    setActionType(null);
    setBalanceAdjustment(0);
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
              Leave Management
            </h1>
            <p className="text-sm text-foreground-muted">
              Company-wide leave requests and balances
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Stats Overview */}
      <StaggerItem>
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "Pending"
                ? "bg-warning-muted border-2 border-warning"
                : "bg-warning-muted/30 border border-warning/10 hover:border-warning/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "Pending" ? "All" : "Pending")}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-foreground-muted">Pending</span>
            </div>
            <p className="text-2xl font-bold text-warning">{counts.pending}</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "Approved"
                ? "bg-success-muted border-2 border-success"
                : "bg-success-muted/30 border border-success/10 hover:border-success/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "Approved" ? "All" : "Approved")}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm text-foreground-muted">Approved</span>
            </div>
            <p className="text-2xl font-bold text-success">{counts.approved}</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl cursor-pointer transition-all",
              statusFilter === "Rejected"
                ? "bg-destructive-muted border-2 border-destructive"
                : "bg-destructive-muted/30 border border-destructive/10 hover:border-destructive/30"
            )}
            onClick={() => setStatusFilter(statusFilter === "Rejected" ? "All" : "Rejected")}
          >
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-foreground-muted">Rejected</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{counts.rejected}</p>
          </div>
        </div>
      </StaggerItem>

      {/* Filters */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search by name or department..."
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
          </div>
        </div>
      </StaggerItem>

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <StaggerItem>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-[var(--radius-lg)] border border-border bg-card">
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" className="h-4 w-32" />
                      <Skeleton variant="text" className="h-3 w-48" />
                    </div>
                    <Skeleton variant="default" className="h-6 w-16 rounded-full" />
                    <Skeleton variant="default" className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </StaggerItem>
        ) : filteredRequests.length === 0 ? (
          <StaggerItem>
            <EmptyState
              icon={Calendar}
              title="No leave requests found"
              description={
                searchQuery || statusFilter !== "All" || departmentFilter !== "All"
                  ? "Try adjusting your filters to see more results."
                  : "There are no leave requests to display."
              }
              variant={searchQuery ? "search" : "default"}
            />
          </StaggerItem>
        ) : (
          filteredRequests.map((request, index) => (
            <StaggerItem key={request.id} index={index}>
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => {
                    setSelectedRequest(request);
                    setActionType(null);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Employee Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={request.employee.name} size="md" />
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {request.employee.name}
                          </h3>
                          <p className="text-sm text-foreground-muted truncate">
                            {request.employee.role} · {request.employee.department}
                          </p>
                        </div>
                      </div>

                      {/* Leave Details */}
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-lg bg-secondary", leaveTypeConfig[request.leaveType].color)}>
                            {leaveTypeConfig[request.leaveType].icon}
                          </span>
                          <span className="text-sm font-medium">{request.leaveType}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-foreground-muted">
                          <Calendar className="h-4 w-4" />
                          {formatDate(new Date(request.startDate))}
                          {request.startDate !== request.endDate && (
                            <> - {formatDate(new Date(request.endDate))}</>
                          )}
                        </div>
                        <Badge variant="muted">{request.days}d</Badge>
                        <Badge className={cn(statusConfig[request.status].bg, statusConfig[request.status].color)}>
                          {statusConfig[request.status].label}
                        </Badge>
                      </div>

                      {/* Quick Actions for pending */}
                      {request.status === "pending" && (
                        <div className="hidden lg:flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setActionType("reject");
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-success-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setActionType("approve");
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
            </StaggerItem>
          ))
        )}
      </div>

      {/* Request Detail Modal */}
      <Modal
        open={!!selectedRequest && !actionType}
        onClose={() => setSelectedRequest(null)}
        title="Leave Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <Avatar name={selectedRequest.employee.name} size="lg" />
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {selectedRequest.employee.name}
                </h3>
                <p className="text-sm text-foreground-muted">
                  {selectedRequest.employee.role} · {selectedRequest.employee.department}
                </p>
              </div>
              <Badge
                className={cn(
                  "ml-auto",
                  statusConfig[selectedRequest.status].bg,
                  statusConfig[selectedRequest.status].color
                )}
              >
                {statusConfig[selectedRequest.status].label}
              </Badge>
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-foreground-muted mb-1">Leave Type</p>
                <div className="flex items-center gap-2">
                  <span className={leaveTypeConfig[selectedRequest.leaveType].color}>
                    {leaveTypeConfig[selectedRequest.leaveType].icon}
                  </span>
                  <span className="font-medium">{selectedRequest.leaveType} Leave</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-foreground-muted mb-1">Duration</p>
                <p className="font-medium">{selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"}</p>
              </div>
              <div className="col-span-2 p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-foreground-muted mb-1">Dates</p>
                <p className="font-medium">
                  {formatDate(new Date(selectedRequest.startDate))}
                  {selectedRequest.startDate !== selectedRequest.endDate && (
                    <> — {formatDate(new Date(selectedRequest.endDate))}</>
                  )}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="text-sm text-foreground-muted mb-2">Reason</p>
              <p className="text-foreground">{selectedRequest.reason}</p>
            </div>

            {/* Balance */}
            <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">
                    {selectedRequest.leaveType} Leave Balance
                  </p>
                  <p className="text-foreground">
                    <span className="font-semibold text-primary text-xl">
                      {selectedRequest.balance.remaining}
                    </span>
                    <span className="text-foreground-muted"> / {selectedRequest.balance.total} days</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionType("adjust")}
                >
                  Adjust Balance
                </Button>
              </div>
            </div>

            {/* Review Info (if reviewed) */}
            {selectedRequest.reviewedBy && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <p className="text-sm text-foreground-muted mb-2">Review Information</p>
                <p className="text-sm text-foreground">
                  {selectedRequest.status === "approved" ? "Approved" : "Rejected"} by{" "}
                  <span className="font-medium">{selectedRequest.reviewedBy}</span>
                  {selectedRequest.reviewedAt && (
                    <> on {formatDate(new Date(selectedRequest.reviewedAt))}</>
                  )}
                </p>
                {selectedRequest.reviewNote && (
                  <p className="text-sm text-foreground-muted mt-2 italic">
                    "{selectedRequest.reviewNote}"
                  </p>
                )}
              </div>
            )}

            {/* Actions for pending */}
            {selectedRequest.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive-muted"
                  onClick={() => setActionType("reject")}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => setActionType("approve")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal
        open={actionType === "approve" || actionType === "reject"}
        onClose={() => {
          setActionType(null);
          setReviewNote("");
        }}
        title={actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
        size="sm"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p className="text-foreground-muted">
              {actionType === "approve" ? (
                <>
                  Approve <span className="font-medium text-foreground">{selectedRequest.employee.name}</span>'s
                  request for {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"} of {selectedRequest.leaveType.toLowerCase()} leave?
                </>
              ) : (
                <>
                  Reject <span className="font-medium text-foreground">{selectedRequest.employee.name}</span>'s
                  leave request?
                </>
              )}
            </p>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {actionType === "approve" ? "Note (optional)" : "Reason for rejection"}
              </label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Add a note if needed..."
                    : "Please provide a reason..."
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setActionType(null);
                  setReviewNote("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  actionType === "approve"
                    ? "bg-success hover:bg-success/90 text-success-foreground"
                    : "bg-destructive hover:bg-destructive/90"
                )}
                onClick={() => handleAction(actionType as "approve" | "reject")}
                isLoading={isSubmitting}
                disabled={actionType === "reject" && !reviewNote.trim()}
              >
                {!isSubmitting && (actionType === "approve" ? "Approve" : "Reject")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        open={actionType === "adjust"}
        onClose={() => {
          setActionType(null);
          setBalanceAdjustment(0);
        }}
        title="Adjust Leave Balance"
        size="sm"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-sm text-foreground-muted mb-1">Current Balance</p>
              <p className="text-xl font-bold text-foreground">
                {selectedRequest.balance.remaining} / {selectedRequest.balance.total} days
              </p>
              <p className="text-sm text-foreground-muted">{selectedRequest.leaveType} Leave</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Adjustment
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBalanceAdjustment((prev) => prev - 1)}
                  disabled={selectedRequest.balance.remaining + balanceAdjustment <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">
                  <p className={cn(
                    "text-3xl font-bold",
                    balanceAdjustment > 0 ? "text-success" : balanceAdjustment < 0 ? "text-destructive" : "text-foreground"
                  )}>
                    {balanceAdjustment > 0 ? "+" : ""}{balanceAdjustment}
                  </p>
                  <p className="text-sm text-foreground-muted">days</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setBalanceAdjustment((prev) => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {balanceAdjustment !== 0 && (
              <div className="p-3 rounded-lg bg-primary-muted/30 border border-primary/10">
                <p className="text-sm text-foreground">
                  New balance: <span className="font-semibold text-primary">
                    {selectedRequest.balance.remaining + balanceAdjustment}
                  </span> / {selectedRequest.balance.total} days
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setActionType(null);
                  setBalanceAdjustment(0);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdjustBalance}
                isLoading={isSubmitting}
                disabled={balanceAdjustment === 0}
              >
                {!isSubmitting && "Save Adjustment"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </StaggerContainer>
  );
}
