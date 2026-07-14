"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hint, ...props }, ref) => {
    return (
      <div className="relative overflow-visible">
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-[var(--radius)] border border-transparent bg-background-secondary px-4 py-3 text-base",
            "placeholder:text-foreground-subtle",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-card",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-none",
            error && "ring-2 ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="mt-2 text-xs text-foreground-subtle">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
