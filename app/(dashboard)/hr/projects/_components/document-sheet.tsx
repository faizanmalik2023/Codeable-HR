"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, Link2, StickyNote, Upload, X } from "lucide-react";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/api/uploads";
import { ApiRequestError } from "@/lib/api/client";
import type { DocumentBody, ProjectDocumentType } from "@/lib/api/projects-mgmt";

const TYPES: { value: ProjectDocumentType; label: string; icon: React.ElementType }[] = [
  { value: "file", label: "File", icon: FileText },
  { value: "note", label: "Note", icon: StickyNote },
  { value: "link", label: "Link", icon: Link2 },
];

interface DocumentSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: DocumentBody) => void;
  isPending?: boolean;
}

export function DocumentSheet({ open, onClose, onSubmit, isPending }: DocumentSheetProps) {
  const [type, setType] = React.useState<ProjectDocumentType>("file");
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [body, setBody] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    setType("file");
    setName("");
    setUrl("");
    setBody("");
    setFile(null);
  }, [open]);

  const pickFile = (f: File | null) => {
    setFile(f);
    if (f && !name.trim()) setName(f.name);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error("Please enter a name");

    if (type === "file") {
      if (!file) return toast.error("Please choose a file");
      setUploading(true);
      try {
        const { url: fileUrl, key } = await uploadFile(file, "project-documents");
        onSubmit({ type, name: trimmedName, url: fileUrl, key });
      } catch (err) {
        toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
      return;
    }

    if (type === "link") {
      if (!url.trim()) return toast.error("Please enter a URL");
      onSubmit({ type, name: trimmedName, url: url.trim() });
      return;
    }

    // note
    if (!body.trim()) return toast.error("Please enter note content");
    onSubmit({ type, name: trimmedName, body: body.trim() });
  };

  const busy = isPending || uploading;

  return (
    <Sheet open={open} onClose={onClose} title="Add Document" size="md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label className="mb-2 block">Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radius)] border px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border text-foreground-muted hover:border-border-hover hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="mb-2 block" required>
            Name
          </Label>
          <Input placeholder="Document name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {type === "file" && (
          <div>
            <Label className="mb-2 block" required>
              File
            </Label>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-between rounded-[var(--radius)] border border-border px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                  <FileText className="h-4 w-4 shrink-0 text-foreground-muted" />
                  <span className="truncate">{file.name}</span>
                </span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
                <Upload className="h-4 w-4" /> Choose file
              </Button>
            )}
          </div>
        )}

        {type === "link" && (
          <div>
            <Label className="mb-2 block" required>
              URL
            </Label>
            <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        )}

        {type === "note" && (
          <div>
            <Label className="mb-2 block" required>
              Note
            </Label>
            <Textarea rows={5} placeholder="Write a note…" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        )}

        <SheetFooter className="-mx-6 -mb-5 mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" isLoading={busy}>
            Add
          </Button>
        </SheetFooter>
      </form>
    </Sheet>
  );
}
