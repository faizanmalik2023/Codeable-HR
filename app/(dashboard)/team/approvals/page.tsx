"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Briefcase,
  Palmtree,
  Stethoscope,
  Coffee,
  Info,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate, cn } from "@/lib/utils";

// Mock pending requests data
const pendingRequests = [
  {
    id: "1",
    employee: {
      id: "emp1",
      name: "Bob Smith",
      role: "Developer",
      avatar: undefined,
      department: "Engineering",
    },
    leaveType: "Annual",
    startDate: "2024-02-14",
    endDate: "2024-02-16",
    days: 3,
    reason: "Family vacation - visiting relatives abroad. Have coordinated with team for handover.",
    submittedAt: "2024-01-15T10:30:00",
    balance: { remaining: 12, total: 21 },
  },
  {
    id: "2",
    employee: {
      id: "emp2",
      name: "Carol White",
      role: "Designer",
      avatar: undefined,
      department: "Design",
    },
    leaveType: "Sick",
    startDate: "2024-01-20",
    endDate: "2024-01-20",
    days: 1,
    reason: "Medical appointment",
    submittedAt: "2024-01-18T09:15:00",
    balance: { remaining: 8, total: 10 },
  },
  {
    id: "3",
    employee: {
      id: "emp3",
      name: "David Brown",
      role: "Developer",
      avatar: undefined,
      department: "Engineering",
    },
    leaveType: "Casual",
    startDate: "2024-01-25",
    endDate: "2024-01-25",
    days: 1,
    reason: "Personal errand",
    submittedAt: "2024-01-19T14:00:00",
    balance: { remaining: 3, total: 5 },
  },
];

const leaveTypeIcons: Record<string, React.ReactNode> = {
  Annual: <Palmtree className="h-4 w-4" />,
  Sick: <Stethoscope className="h-4 w-4" />,
  Casual: <Coffee className="h-4 w-4" />,
};

const leaveTypeColors: Record<string, string> = {
  Annual: "text-primary",
  Sick: "text-warning",
  Casual: "text-accent",
};

type LeaveRequest = (typeof pendingRequests)[0];

export default function ManagerApprovalsPage() {
  const [requests, setRequests] = React.useState(pendingRequests);
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = React.useState<"approve" | "reject" | null>(null);
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");

  const handleAction = async (type: "approve" | "reject") => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Remove from list
    setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));

    // Show success
    setSuccessMessage(
      type === "approve"
        ? `${selectedRequest.employee.name}'s leave has been approved`
        : `${selectedRequest.employee.name}'s leave has been declined`
    );
    setShowSuccess(true);

    // Reset
    setIsSubmitting(false);
    setSelectedRequest(null);
    setActionType(null);
    setMessage("");

    // Hide success after a moment
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openRequestDetail = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setActionType(null);
    setMessage("");
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
              Leave Approvals
            </h1>
            <p className="text-sm text-foreground-muted">
              {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting your review
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-success text-success-foreground shadow-lg"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <StaggerItem key={request.id}>
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => openRequestDetail(request)}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Employee Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar name={request.employee.name} size="lg" />
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {request.employee.name}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            {request.employee.role} · {request.employee.department}
                          </p>
                        </div>
                      </div>

                      {/* Leave Details */}
                      <div className="flex flex-wrap items-center gap-3 md:gap-6">
                        <div className="flex items-center gap-2">
                          <span className={cn("p-1.5 rounded-lg bg-secondary", leaveTypeColors[request.leaveType])}>
                            {leaveTypeIcons[request.leaveType]}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {request.leaveType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(new Date(request.startDate))}
                            {request.startDate !== request.endDate && (
                              <> - {formatDate(new Date(request.endDate))}</>
                            )}
                          </span>
                        </div>

                        <Badge variant="muted">
                          {request.days} {request.days === 1 ? "day" : "days"}
                        </Badge>
                      </div>

                      {/* Quick Actions (shown on larger screens) */}
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
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
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
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>

                    {/* Submitted time */}
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-foreground-subtle">
                      <Clock className="h-3 w-3" />
                      Submitted {formatDate(new Date(request.submittedAt))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </StaggerItem>
          ))}
        </div>
      ) : (
        <StaggerItem>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">All caught up!</h2>
            <p className="text-foreground-muted max-w-sm">
              You've reviewed all pending leave requests. Great job staying on top of things.
            </p>
            <Link href="/manager" className="mt-6">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </StaggerItem>
      )}

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
            </div>

            {/* Leave Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1">
                  <span className={leaveTypeColors[selectedRequest.leaveType]}>
                    {leaveTypeIcons[selectedRequest.leaveType]}
                  </span>
                  Leave Type
                </div>
                <p className="font-medium text-foreground">{selectedRequest.leaveType} Leave</p>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Duration
                </div>
                <p className="font-medium text-foreground">
                  {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"}
                </p>
              </div>

              <div className="col-span-2 p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Dates
                </div>
                <p className="font-medium text-foreground">
                  {formatDate(new Date(selectedRequest.startDate))}
                  {selectedRequest.startDate !== selectedRequest.endDate && (
                    <> — {formatDate(new Date(selectedRequest.endDate))}</>
                  )}
                </p>
              </div>
            </div>

            {/* Reason */}
            {selectedRequest.reason && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 text-foreground-muted text-sm mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Reason
                </div>
                <p className="text-foreground">{selectedRequest.reason}</p>
              </div>
            )}

            {/* Balance Info */}
            <div className="p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-foreground-muted text-sm mb-1">
                    <Info className="h-4 w-4 text-primary" />
                    Current Balance
                  </div>
                  <p className="text-foreground">
                    <span className="font-semibold text-primary">
                      {selectedRequest.balance.remaining}
                    </span>
                    <span className="text-foreground-muted">
                      {" "}/ {selectedRequest.balance.total} days remaining
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground-muted">After approval</p>
                  <p className="font-semibold text-foreground">
                    {selectedRequest.balance.remaining - selectedRequest.days} days
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive-muted"
                onClick={() => setActionType("reject")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button
                className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => setActionType("approve")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve/Reject Confirmation Modal */}
      <Modal
        open={!!actionType}
        onClose={() => setActionType(null)}
        title={actionType === "approve" ? "Approve Leave Request" : "Decline Leave Request"}
        size="sm"
      >
        {selectedRequest && actionType && (
          <div className="space-y-4">
            <p className="text-foreground-muted">
              {actionType === "approve" ? (
                <>
                  You're about to approve <span className="font-medium text-foreground">{selectedRequest.employee.name}</span>'s
                  request for {selectedRequest.days} {selectedRequest.days === 1 ? "day" : "days"} of {selectedRequest.leaveType.toLowerCase()} leave.
                </>
              ) : (
                <>
                  You're about to decline <span className="font-medium text-foreground">{selectedRequest.employee.name}</span>'s
                  leave request. Please provide a reason.
                </>
              )}
            </p>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {actionType === "approve" ? "Add a note (optional)" : "Reason for declining"}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "E.g., Enjoy your time off!"
                    : "E.g., Team deadline conflict, please discuss alternative dates"
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionType(null)}
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
                onClick={() => handleAction(actionType)}
                isLoading={isSubmitting}
                disabled={actionType === "reject" && !message.trim()}
              >
                {!isSubmitting && (
                  actionType === "approve" ? "Confirm Approval" : "Confirm Decline"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </StaggerContainer>
  );
}
