"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Show a back button that pops the router. */
  back?: boolean | (() => void);
  actions?: React.ReactNode;
  className?: string;
}

/** Consistent page title row with optional back button + right-aligned actions. */
export function PageHeader({ title, description, back, actions, className }: PageHeaderProps) {
  const router = useRouter();
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3">
        {back && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (typeof back === "function" ? back() : router.back())}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-foreground-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
