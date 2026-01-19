"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Palmtree,
  Stethoscope,
  Coffee,
  Calendar,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ToggleGroup } from "@/components/ui/radio-group";
import { LeaveBalanceCard } from "@/components/leave";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";

// Mock leave balances
const leaveTypes = [
  {
    id: "annual",
    type: "Annual Leave",
    icon: <Palmtree className="h-5 w-5" />,
    remaining: 18,
    total: 21,
    color: "primary" as const,
    description: "For vacations and personal time",
  },
  {
    id: "sick",
    type: "Sick Leave",
    icon: <Stethoscope className="h-5 w-5" />,
    remaining: 8,
    total: 10,
    color: "warning" as const,
    description: "For medical appointments and illness",
  },
  {
    id: "casual",
    type: "Casual Leave",
    icon: <Coffee className="h-5 w-5" />,
    remaining: 3,
    total: 5,
    color: "accent" as const,
    description: "For short personal matters",
  },
];

const dayTypeOptions = [
  { value: "full", label: "Full Day" },
  { value: "half-am", label: "Half Day (AM)" },
  { value: "half-pm", label: "Half Day (PM)" },
];

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function ApplyLeavePage() {
  const router = useRouter();

  // Form state
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [dayType, setDayType] = React.useState("full");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  // Derived values
  const selectedLeave = leaveTypes.find((l) => l.id === selectedType);
  const daysRequested = dateRange.start && dateRange.end
    ? dayType === "full"
      ? countBusinessDays(dateRange.start, dateRange.end)
      : 0.5
    : 0;

  const hasInsufficientBalance = selectedLeave && daysRequested > selectedLeave.remaining;
  const isValid = selectedType && dateRange.start && dateRange.end && !hasInsufficientBalance;

  // Calculate the new balance after this request
  const newBalance = selectedLeave ? selectedLeave.remaining - daysRequested : 0;

  // Handle form submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowSuccess(true);

    // Redirect after success animation
    setTimeout(() => {
      router.push("/leaves");
    }, 2000);
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-success-muted flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="h-10 w-10 text-success" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Request Submitted
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-foreground-muted"
        >
          Your leave request has been sent to your manager for approval.
        </motion.p>
      </div>
    );
  }

  return (
    <StaggerContainer className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Link href="/leaves">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Apply for Leave
            </h1>
            <p className="text-sm text-foreground-muted">
              Let your team know you'll be away
            </p>
          </div>
        </div>
      </StaggerItem>

      {/* Step 1: Select Leave Type */}
      <StaggerItem>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              1
            </div>
            <Label className="text-base">What type of leave?</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {leaveTypes.map((leave) => (
              <LeaveBalanceCard
                key={leave.id}
                type={leave.type}
                icon={leave.icon}
                remaining={leave.remaining}
                total={leave.total}
                color={leave.color}
                isSelected={selectedType === leave.id}
                onClick={() => setSelectedType(leave.id)}
              />
            ))}
          </div>
          {selectedLeave && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-foreground-muted flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              {selectedLeave.description}
            </motion.p>
          )}
        </div>
      </StaggerItem>

      {/* Step 2: Select Dates */}
      <StaggerItem>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                selectedType
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground-muted"
              )}
            >
              2
            </div>
            <Label className="text-base">When do you need off?</Label>
          </div>

          <Card className={cn(!selectedType && "opacity-50 pointer-events-none")}>
            <CardContent className="p-4 space-y-4">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select your dates"
                minDate={new Date()}
              />

              {/* Day type selector (show only for single day) */}
              {dateRange.start && dateRange.end && dateRange.start.getTime() === dateRange.end.getTime() && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-2"
                >
                  <Label className="text-sm mb-2 block">Duration</Label>
                  <ToggleGroup
                    value={dayType}
                    onChange={setDayType}
                    options={dayTypeOptions}
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Days summary */}
          <AnimatePresence>
            {daysRequested > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl",
                  hasInsufficientBalance
                    ? "bg-destructive-muted border border-destructive/20"
                    : "bg-primary-muted/50 border border-primary/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <Calendar className={cn("h-5 w-5", hasInsufficientBalance ? "text-destructive" : "text-primary")} />
                  <div>
                    <p className="font-medium text-foreground">
                      {daysRequested} {daysRequested === 1 ? "day" : "days"} requested
                    </p>
                    {selectedLeave && (
                      <p className={cn("text-sm", hasInsufficientBalance ? "text-destructive" : "text-foreground-muted")}>
                        {hasInsufficientBalance ? (
                          <>You only have {selectedLeave.remaining} days available</>
                        ) : (
                          <>You'll have {newBalance} days remaining after this</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                {hasInsufficientBalance && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </StaggerItem>

      {/* Step 3: Reason (Optional) */}
      <StaggerItem>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                dateRange.start && dateRange.end
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground-muted"
              )}
            >
              3
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-base">Anything to note?</Label>
              <span className="text-xs text-foreground-subtle px-2 py-0.5 bg-secondary rounded-full">
                Optional
              </span>
            </div>
          </div>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a brief note if you'd like (vacation plans, medical appointment, etc.)"
            className={cn(
              "min-h-[100px]",
              !(dateRange.start && dateRange.end) && "opacity-50 pointer-events-none"
            )}
            disabled={!(dateRange.start && dateRange.end)}
          />
        </div>
      </StaggerItem>

      {/* Submit Section */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="text-sm text-foreground-muted">
            {isValid ? (
              <span className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" />
                Ready to submit
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                {!selectedType
                  ? "Select a leave type to continue"
                  : !(dateRange.start && dateRange.end)
                  ? "Select your dates"
                  : hasInsufficientBalance
                  ? "Insufficient leave balance"
                  : "Complete all required fields"}
              </span>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            size="lg"
            className="gap-2"
          >
            {!isSubmitting && (
              <>
                <Send className="h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </StaggerItem>

      {/* Gentle footer note */}
      <StaggerItem>
        <p className="text-xs text-center text-foreground-subtle">
          Your request will be sent to your manager for approval. You'll be notified once it's reviewed.
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
