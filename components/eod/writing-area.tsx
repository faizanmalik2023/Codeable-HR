"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WritingAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  className?: string;
}

export function WritingArea({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 200,
  maxHeight = 500,
  disabled,
  className,
}: WritingAreaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [value, minHeight, maxHeight]);

  // Character count
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className={cn("relative", className)}>
      {/* Writing container with subtle border */}
      <motion.div
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden",
          "bg-card/50",
          isFocused
            ? "border-primary/30 shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]"
            : "border-border/50 hover:border-border shadow-none"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent px-6 py-5 text-base leading-relaxed",
            "placeholder:text-foreground-subtle/60",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-none",
            "font-normal tracking-normal"
          )}
          style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
        />

        {/* Bottom bar with word count */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/30">
          <div className="flex items-center gap-4 text-xs text-foreground-subtle">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>

          {/* Focus indicator */}
          <div className="flex items-center gap-2">
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-foreground-subtle">Writing</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
