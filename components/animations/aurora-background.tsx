"use client";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({ className, children }: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-background",
        className
      )}
    >
      {/* Aurora gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary blob */}
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-30 blur-[100px] animate-aurora-1"
          style={{
            background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
          }}
        />
        {/* Secondary blob */}
        <div
          className="absolute top-1/4 -right-20 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px] animate-aurora-2"
          style={{
            background: "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)",
          }}
        />
        {/* Tertiary blob */}
        <div
          className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full opacity-25 blur-[100px] animate-aurora-3"
          style={{
            background: "linear-gradient(180deg, hsl(var(--primary) / 0.8) 0%, hsl(var(--success) / 0.5) 100%)",
          }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
