"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  Clock,
  Coffee,
  Sun,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClockWidgetProps {
  variant?: "compact" | "full";
  className?: string;
  onClockOut?: () => void;
}

// Mock EOD status - in real app, this would come from a store or API
const mockEodSubmitted = false;

export function ClockWidget({ variant = "full", className, onClockOut }: ClockWidgetProps) {
  const router = useRouter();
  const [isClockedIn, setIsClockedIn] = React.useState(false);
  const [clockInTime, setClockInTime] = React.useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [showClockOutPrompt, setShowClockOutPrompt] = React.useState(false);

  // Update elapsed time every second when clocked in
  React.useEffect(() => {
    if (!isClockedIn || !clockInTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockIn = () => {
    const now = new Date();
    setClockInTime(now);
    setIsClockedIn(true);
    setElapsedTime(0);
  };

  const handleClockOut = () => {
    if (!mockEodSubmitted) {
      setShowClockOutPrompt(true);
    } else {
      completeClockOut();
    }
  };

  const completeClockOut = () => {
    setIsClockedIn(false);
    setClockInTime(null);
    setElapsedTime(0);
    setShowClockOutPrompt(false);
    onClockOut?.();
  };

  const handleEodRedirect = () => {
    completeClockOut();
    router.push("/eod-reports/submit");
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
    }
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  };

  const formatClockInTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeOfDayIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return Sun;
    if (hour < 17) return Coffee;
    return Sunset;
  };

  const TimeIcon = getTimeOfDayIcon();

  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <AnimatePresence mode="wait">
          {isClockedIn ? (
            <motion.div
              key="clocked-in"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-success"
                />
                <span className="text-sm font-medium text-foreground">
                  {formatElapsedTime(elapsedTime)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClockOut}
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive-muted"
              >
                <Square className="h-3 w-3" />
                End
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="clocked-out"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                size="sm"
                onClick={handleClockIn}
                className="gap-1.5"
              >
                <Play className="h-3 w-3" />
                Start Day
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clock Out Prompt Modal */}
        <AnimatePresence>
          {showClockOutPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowClockOutPrompt(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
              >
                <div className="text-center">
                  <div className="inline-flex p-3 rounded-full bg-warning-muted mb-4">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Before you go...
                  </h3>
                  <p className="text-sm text-foreground-muted mb-6">
                    Please add today's EOD report to wrap up your day.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleEodRedirect} className="w-full">
                      Submit EOD
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={completeClockOut}
                      className="w-full text-foreground-muted"
                    >
                      Skip for now
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn("relative", className)}>
      <div className="p-6 rounded-2xl border border-border bg-card">
        <AnimatePresence mode="wait">
          {isClockedIn ? (
            <motion.div
              key="clocked-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="h-3 w-3 rounded-full bg-success"
                />
                <span className="text-sm font-medium text-success">Working</span>
              </div>

              {/* Timer */}
              <motion.div
                key={elapsedTime}
                initial={{ scale: 1.02 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold text-foreground mb-2 font-mono"
              >
                {formatElapsedTime(elapsedTime)}
              </motion.div>

              {/* Clock in time */}
              <p className="text-sm text-foreground-muted mb-6">
                Started at {clockInTime && formatClockInTime(clockInTime)}
              </p>

              {/* Clock out button */}
              <Button
                onClick={handleClockOut}
                variant="outline"
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive-muted"
              >
                <Square className="h-4 w-4" />
                End My Day
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="clocked-out"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Greeting */}
              <div className="inline-flex p-3 rounded-full bg-primary-muted mb-4">
                <TimeIcon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1">
                Ready to start?
              </h3>
              <p className="text-sm text-foreground-muted mb-6">
                Clock in to begin tracking your day
              </p>

              {/* Clock in button */}
              <Button onClick={handleClockIn} size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                Start My Day
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clock Out Prompt Modal */}
      <AnimatePresence>
        {showClockOutPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowClockOutPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="text-center">
                <div className="inline-flex p-3 rounded-full bg-warning-muted mb-4">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Before you go...
                </h3>
                <p className="text-sm text-foreground-muted mb-6">
                  Please add today's EOD report to wrap up your day.
                </p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleEodRedirect} className="w-full">
                    Submit EOD
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={completeClockOut}
                    className="w-full text-foreground-muted"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
