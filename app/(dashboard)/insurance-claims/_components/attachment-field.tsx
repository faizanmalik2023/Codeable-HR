"use client";

import * as React from "react";
import { Paperclip, FileText, ImageIcon, X, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,application/pdf";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface AttachmentFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reusable JPG/PNG/PDF picker. Holds a `File` in local form state — the actual
 * upload happens in the submit handler (via `uploadFile`). Shows filename +
 * remove, token-styled with a soft drop target.
 */
export function AttachmentField({ value, onChange, disabled, error }: AttachmentFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const accept = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Only JPG, PNG or PDF files are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("File must be under 10 MB");
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const shown = localError ?? error;

  if (value) {
    const isPdf = value.type === "application/pdf";
    const Icon = isPdf ? FileText : ImageIcon;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
          <p className="text-xs text-foreground-muted">{formatSize(value.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setLocalError(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          disabled={disabled}
          className="rounded-full p-1.5 text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          aria-label="Remove attachment"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          dragOver ? "border-primary bg-primary-muted/40" : "border-border hover:border-border-hover hover:bg-secondary/40",
          shown && "border-destructive"
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground-muted">
          {dragOver ? <UploadCloud className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
        </span>
        <span className="text-sm font-medium text-foreground">Add an attachment</span>
        <span className="text-xs text-foreground-muted">JPG, PNG or PDF · up to 10 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {shown && <p className="mt-2 text-xs text-destructive">{shown}</p>}
    </div>
  );
}
