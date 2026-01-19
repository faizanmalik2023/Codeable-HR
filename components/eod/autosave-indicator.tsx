"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  className?: string;
}

export function AutosaveIndicator({
  status,
  lastSaved,
  className,
}: AutosaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = React.useState<string>("");

  // Update time ago every 10 seconds
  React.useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastSaved) {
        setTimeAgo("");
        return;
      }

      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

      if (seconds < 5) {
        setTimeAgo("just now");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusContent = () => {
    switch (status) {
      case "saving":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-foreground-muted"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Saving...</span>
          </motion.div>
        );
      case "saved":
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-success"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Saved {timeAgo}</span>
          </motion.div>
        );
      case "error":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-destructive"
          >
            <CloudOff className="h-3.5 w-3.5" />
            <span>Failed to save</span>
          </motion.div>
        );
      default:
        return lastSaved ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-foreground-subtle"
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Draft saved {timeAgo}</span>
          </motion.div>
        ) : null;
    }
  };

  return (
    <div className={cn("text-xs font-medium", className)}>
      <AnimatePresence mode="wait">{getStatusContent()}</AnimatePresence>
    </div>
  );
}
