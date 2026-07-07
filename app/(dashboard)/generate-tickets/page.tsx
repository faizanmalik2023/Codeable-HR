"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Paperclip,
  X,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { useTicketing } from "@/lib/ticketing/use-ticketing";
import { TicketingConnectCard } from "@/components/ticketing/connect-card";
import {
  getMyProjects,
  srsPreview,
  srsGenerate,
  SrsProposedTicket,
} from "@/lib/ticketing/client";
import { FEATURE_SRS } from "@/stores/ticketing-store";

interface ReviewTicket extends SrsProposedTicket {
  included: boolean;
  assignee: string | null;
}

const DIFFICULTY_BADGE: Record<
  string,
  "muted" | "success" | "default" | "warning" | "destructive"
> = {
  trivial: "muted",
  easy: "success",
  medium: "default",
  hard: "warning",
  expert: "destructive",
};

const DIFFICULTY_OPTIONS = ["trivial", "easy", "medium", "hard", "expert"].map(
  (d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })
);
const POINT_OPTIONS = [1, 2, 3, 5, 8, 13].map((p) => ({
  value: String(p),
  label: `${p} pt${p > 1 ? "s" : ""}`,
}));

export default function GenerateTicketsPage() {
  const ticketing = useTicketing();

  const [projects, setProjects] = React.useState<{ _id: string; title: string }[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [pastedText, setPastedText] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [team, setTeam] = React.useState<
    { uid: string; name: string; role: string }[]
  >([]);
  const [tickets, setTickets] = React.useState<ReviewTicket[]>([]);
  const [result, setResult] = React.useState<{
    created: { code: string; title: string }[];
    failed: { title: string; error: string }[];
    statusName: string;
  } | null>(null);

  const hasAccess = ticketing.features.includes(FEATURE_SRS);

  React.useEffect(() => {
    if (!ticketing.pat || !hasAccess) return;
    getMyProjects(ticketing.pat)
      .then((list) => setProjects(list.map((p) => ({ _id: p._id, title: p.title }))))
      .catch((err) => console.error("Failed to load projects:", err));
  }, [ticketing.pat, hasAccess]);

  const canGenerate =
    !!projectId && !generating && (!!file || pastedText.trim().length > 50);

  const handleGenerate = async () => {
    if (!ticketing.pat || !canGenerate) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = { projectId };
      if (instructions.trim()) body.instructions = instructions.trim();
      if (file) {
        if (file.name.toLowerCase().endsWith(".pdf")) {
          body.pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } else {
          body.text = await file.text();
        }
      } else {
        body.text = pastedText;
      }

      const data = await srsPreview(ticketing.pat, body as any);
      setSummary(data.summary);
      setTeam(data.team || []);
      setTickets(
        (data.tickets || []).map((t) => ({
          ...t,
          included: true,
          assignee: t.suggestedAssignee?.uid || null,
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to generate tickets.");
    } finally {
      setGenerating(false);
    }
  };

  const updateTicket = (index: number, patch: Partial<ReviewTicket>) => {
    setTickets((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  const includedCount = tickets.filter((t) => t.included).length;
  const includedPoints = tickets
    .filter((t) => t.included)
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0);

  const handleCreate = async () => {
    if (!ticketing.pat || includedCount === 0) return;
    setCreating(true);
    setError(null);
    try {
      const data = await srsGenerate(ticketing.pat, {
        projectId,
        tickets: tickets
          .filter((t) => t.included)
          .map((t) => ({
            title: t.title,
            description: t.description,
            type: t.type,
            priority: t.priority,
            difficulty: t.difficulty,
            storyPoints: t.storyPoints,
            assignee: t.assignee || undefined,
          })),
      });
      setResult({
        created: data.created || [],
        failed: data.failed || [],
        statusName: data.workflowStatus?.name || "Backlog",
      });
      setTickets([]);
      setSummary(null);
    } catch (err: any) {
      setError(err?.message || "Failed to create tickets.");
    } finally {
      setCreating(false);
    }
  };

  // ---- connection / access states ----
  if (!ticketing.connected) {
    return (
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <PageHeader />
        </StaggerItem>
        <StaggerItem>
          <TicketingConnectCard />
        </StaggerItem>
      </StaggerContainer>
    );
  }
  if (!ticketing.featuresLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <PageHeader />
        </StaggerItem>
        <StaggerItem>
          <EmptyState
            icon={ShieldAlert}
            title="Ticket generation is invite-only"
            description={`Signed in to ticketing as ${ticketing.email || "unknown"} — ask an admin to grant this account access.`}
          />
        </StaggerItem>
      </StaggerContainer>
    );
  }

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <PageHeader />
      </StaggerItem>

      {/* Source */}
      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle>Source document</CardTitle>
            <CardDescription>
              Pick the project, then attach the SRS as a PDF, Markdown or text
              file — or paste it directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <Select
                  label="Project"
                  value={projectId}
                  onChange={setProjectId}
                  options={projects.map((p) => ({ value: p._id, label: p.title }))}
                  placeholder="Choose the project to fill"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Extra instructions{" "}
                    <span className="font-normal text-foreground-muted">(optional)</span>
                  </label>
                  <Input
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder='e.g. "Only phase 1", "split auth into small tickets"'
                  />
                </div>
              </div>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.md,.markdown,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate text-sm font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-foreground-muted hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach SRS file
                  </Button>
                )}
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={
                    file
                      ? "Using the attached file — remove it to paste text instead"
                      : "…or paste the SRS content here"
                  }
                  disabled={!!file}
                  rows={5}
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {generating && (
                <p className="text-sm text-foreground-muted">
                  Reading the SRS and sizing the work — large documents can take
                  a couple of minutes.
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleGenerate} disabled={!canGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {generating ? "Generating…" : "Generate tickets"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Review */}
      {summary && tickets.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Proposed backlog</CardTitle>
                  <CardDescription className="mt-1 max-w-2xl">{summary}</CardDescription>
                </div>
                <span className="text-sm text-foreground-muted">
                  <span className="font-semibold text-foreground">{includedCount}</span>{" "}
                  tickets ·{" "}
                  <span className="font-semibold text-foreground">{includedPoints}</span>{" "}
                  points selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((ticket, index) => (
                <div
                  key={index}
                  className={
                    "rounded-xl border border-border bg-card p-4 transition-opacity" +
                    (ticket.included ? "" : " opacity-40")
                  }
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={ticket.included}
                      onChange={(e) => updateTicket(index, { included: e.target.checked })}
                      className="mt-2 h-4 w-4 accent-[hsl(var(--primary))]"
                      aria-label={`Include "${ticket.title}"`}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={ticket.title}
                          onChange={(e) => updateTicket(index, { title: e.target.value })}
                          className="h-9 flex-1 min-w-[240px] font-medium"
                        />
                        <Badge variant="outline" className="capitalize">
                          {ticket.type}
                        </Badge>
                        <Badge variant={DIFFICULTY_BADGE[ticket.difficulty]} className="capitalize">
                          {ticket.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted">{ticket.rationale}</p>
                      <div className="flex flex-wrap gap-3">
                        <div className="w-32">
                          <Select
                            value={ticket.difficulty}
                            onChange={(v) => updateTicket(index, { difficulty: v as any })}
                            options={DIFFICULTY_OPTIONS}
                          />
                        </div>
                        <div className="w-28">
                          <Select
                            value={String(ticket.storyPoints)}
                            onChange={(v) => updateTicket(index, { storyPoints: Number(v) })}
                            options={POINT_OPTIONS}
                          />
                        </div>
                        <div className="w-52">
                          <Select
                            value={ticket.assignee || "unassigned"}
                            onChange={(v) =>
                              updateTicket(index, {
                                assignee: v === "unassigned" ? null : v,
                              })
                            }
                            options={[
                              { value: "unassigned", label: "Unassigned" },
                              ...team.map((m) => ({
                                value: m.uid,
                                label: `${m.name} · ${m.role}`,
                              })),
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleCreate}
                  disabled={creating || includedCount === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {creating
                    ? "Creating…"
                    : `Create ${includedCount} ticket${includedCount === 1 ? "" : "s"}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}

      {/* Result */}
      {result && (
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                {result.created.length} tickets created in “{result.statusName}”
              </CardTitle>
              {result.failed.length > 0 && (
                <CardDescription className="text-destructive">
                  {result.failed.length} failed — {result.failed[0]?.error}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.created.slice(0, 24).map((c) => (
                  <Badge key={c.code} variant="secondary" className="font-mono">
                    {c.code}
                  </Badge>
                ))}
                {result.created.length > 24 && (
                  <Badge variant="muted">+{result.created.length - 24} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      )}
    </StaggerContainer>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="icon" className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div className="flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Generate Tickets
        </h1>
        <p className="text-sm text-foreground-muted">
          Turn an SRS document into a sized, prioritized, assigned backlog —
          you review everything before it’s created.
        </p>
      </div>
    </div>
  );
}
