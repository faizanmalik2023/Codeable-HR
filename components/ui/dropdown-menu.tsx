"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: () => void;
  close: () => void;
}

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string): DropdownMenuContextValue {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(`<${component}> must be used within <DropdownMenu>`);
  }
  return context;
}

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

function DropdownMenu({ className, children, ...props }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setOpen(false), []);
  const toggle = React.useCallback(() => setOpen((prev) => !prev), []);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const contextValue = React.useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, toggle, close }),
    [open, toggle, close]
  );

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative inline-block", className)}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactElement;
}

function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const { toggle, open } = useDropdownMenuContext("DropdownMenuTrigger");

  const child = children as React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    "aria-expanded"?: boolean;
    "aria-haspopup"?: boolean | "menu";
  }>;

  return React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      toggle();
    },
    "aria-expanded": open,
    "aria-haspopup": "menu",
  });
}

interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
  children?: React.ReactNode;
}

function DropdownMenuContent({
  align = "start",
  className,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenuContext("DropdownMenuContent");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-[10rem] rounded-[var(--radius)] border border-border bg-card p-1.5 shadow-lg",
            align === "start" ? "left-0" : "right-0",
            className
          )}
          {...(props as React.ComponentProps<typeof motion.div>)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropdownMenuItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  destructive?: boolean;
  disabled?: boolean;
  closeOnClick?: boolean;
  children?: React.ReactNode;
}

function DropdownMenuItem({
  className,
  destructive,
  disabled,
  closeOnClick = true,
  onClick,
  children,
  ...props
}: DropdownMenuItemProps) {
  const { close } = useDropdownMenuContext("DropdownMenuItem");

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? undefined : -1}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        if (closeOnClick) close();
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-100 [&_svg]:size-4 [&_svg]:shrink-0",
        destructive
          ? "text-destructive hover:bg-destructive-muted"
          : "text-foreground hover:bg-secondary",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 text-xs font-medium text-foreground-muted",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
