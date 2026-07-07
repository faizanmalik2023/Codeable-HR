"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Target,
  Timer,
  Gauge,
  ShieldAlert,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/shared/status-card";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";
import { useTicketing } from "@/lib/ticketing/use-ticketing";
import { TicketingConnectCard } from "@/components/ticketing/connect-card";
import {
  getMyProjects,
  getVelocity,
  getFlow,
  getReliability,
  getTeamScorecards,
} from "@/lib/ticketing/client";
import { FEATURE_VELOCITY } from "@/stores/ticketing-store";

// Workflow stages use the app's semantic tokens so the bar reads
// natively in both themes (same idiom as the leave-balance bars)
const STAGE_STYLES: Record<string, { bar: string; label: string }> = {
  backlog: { bar: "bg-foreground-muted/40", label: "Backlog" },
  todo: { bar: "bg-foreground-muted/40", label: "To do" },
  in_progress: { bar: "bg-primary", label: "In progress" },
  // Note: the theme's accent === warning (same amber), so review uses a
  // lighter primary tint to stay distinguishable from QA
  review: { bar: "bg-primary/40", label: "Review" },
  qa: { bar: "bg-warning", label: "QA" },
  done: { bar: "bg-success", label: "Done" },
};
const STAGE_ORDER = ["backlog", "todo", "in_progress", "review", "qa"];

const WINDOW_OPTIONS = [
  { value: "28", label: "Last 4 weeks" },
  { value: "56", label: "Last 8 weeks" },
  { value: "84", label: "Last 12 weeks" },
  { value: "168", label: "Last 24 weeks" },
];

export default function VelocityPage() {
  const ticketing = useTicketing();

  const [projects, setProjects] = React.useState<{ _id: string; title: string }[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const [windowDays, setWindowDays] = React.useState("84");
  const [metric, setMetric] = React.useState<"points" | "tickets">("points");

  const [velocity, setVelocity] = React.useState<any | null>(null);
  const [flow, setFlow] = React.useState<any | null>(null);
  const [reliability, setReliability] = React.useState<any | null>(null);
  const [team, setTeam] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);

  const hasAccess = ticketing.features.includes(FEATURE_VELOCITY);

  React.useEffect(() => {
    if (!ticketing.pat || !hasAccess) return;
    getMyProjects(ticketing.pat)
      .then((list) => {
        setProjects(list.map((p) => ({ _id: p._id, title: p.title })));
        if (list.length > 0) setProjectId((prev) => prev || list[0]._id);
      })
      .catch((err) => console.error("Failed to load projects:", err));
  }, [ticketing.pat, hasAccess]);

  React.useEffect(() => {
    if (!ticketing.pat || !projectId) return;
    let cancelled = false;
    setLoading(true);
    const from = new Date(
      Date.now() - Number(windowDays) * 24 * 60 * 60 * 1000
    ).toISOString();
    const pat = ticketing.pat;
    Promise.all([
      getVelocity(pat, projectId, { from, interval: "week" }).catch(() => null),
      getFlow(pat, projectId, { from }).catch(() => null),
      getReliability(pat, projectId, { from }).catch(() => null),
      getTeamScorecards(pat, projectId, { from }).catch(() => null),
    ]).then(([v, f, r, t]) => {
      if (cancelled) return;
      setVelocity(v);
      setFlow(f);
      setReliability(r);
      setTeam(t);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ticketing.pat, projectId, windowDays]);

  const buckets: any[] = velocity?.buckets || [];
  const maxValue = Math.max(
    1,
    ...buckets.map((b) => (metric === "points" ? b.points : b.completed))
  );

  const stageShares = React.useMemo(() => {
    const tis = flow?.timeInStatus;
    if (!tis) return [] as { key: string; share: number; days: number | null }[];
    return STAGE_ORDER.filter((s) => tis[s]?.share > 0).map((s) => ({
      key: s,
      share: tis[s].share as number,
      days: (tis[s].avgDaysPerIssue as number) ?? null,
    }));
  }, [flow]);

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
            title="Admins only"
            description="Velocity analytics are restricted to ticketing workspace admins."
          />
        </StaggerItem>
      </StaggerContainer>
    );
  }

  const trend = velocity?.trend;
  const firstPass = reliability?.firstPass;
  const onTime = reliability?.onTimeDelivery;

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div className="flex flex-wrap items-center gap-4">
          <PageHeader />
          <div className="ml-auto flex gap-2">
            <div className="w-52">
              <Select
                value={projectId}
                onChange={setProjectId}
                options={projects.map((p) => ({ value: p._id, label: p.title }))}
                placeholder="Project"
              />
            </div>
            <div className="w-40">
              <Select
                value={windowDays}
                onChange={setWindowDays}
                options={WINDOW_OPTIONS}
              />
            </div>
          </div>
        </div>
      </StaggerItem>

      {loading && !velocity ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI tiles */}
          <StaggerItem>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatusCard
                title="Tickets Completed"
                value={String(velocity?.totals?.completed ?? "—")}
                subtitle={`${trend?.avgThroughputPerInterval ?? 0}/week average`}
                icon={CheckCircle2}
                variant="primary"
              />
              <StatusCard
                title="Story Points"
                value={String(velocity?.totals?.points ?? "—")}
                subtitle={
                  velocity?.totals?.estimationCoverage != null
                    ? `${Math.round(velocity.totals.estimationCoverage * 100)}% of tickets estimated`
                    : "no estimates yet"
                }
                icon={Target}
                variant="accent"
              />
              <StatusCard
                title="Cycle Time (median)"
                value={
                  flow?.cycleTime?.p50Days != null ? `${flow.cycleTime.p50Days}d` : "—"
                }
                subtitle={
                  flow?.cycleTime?.p90Days != null
                    ? `p90 ${flow.cycleTime.p90Days}d · ${flow.cycleTime.count} tickets`
                    : "no completions in window"
                }
                icon={Timer}
                variant="default"
              />
              <StatusCard
                title="First-Pass Rate"
                value={
                  firstPass?.rate != null ? `${Math.round(firstPass.rate * 100)}%` : "—"
                }
                subtitle={
                  reliability
                    ? `${reliability.rework?.reopens ?? 0} reopens · ${reliability.rework?.qaRejections ?? 0} QA bounces`
                    : undefined
                }
                icon={Gauge}
                variant="success"
              />
            </div>
          </StaggerItem>

          {/* Weekly bars — same hand-built motion-bar idiom as the dashboard */}
          <StaggerItem>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {metric === "points"
                        ? "Story points completed per week"
                        : "Tickets completed per week"}
                    </CardTitle>
                    <CardDescription>
                      {trend?.variabilityCoefficient != null &&
                        `Delivery variability ${Math.round(trend.variabilityCoefficient * 100)}% — lower is more predictable`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-border p-1">
                    <Button
                      size="sm"
                      variant={metric === "points" ? "secondary" : "ghost"}
                      onClick={() => setMetric("points")}
                    >
                      Points
                    </Button>
                    <Button
                      size="sm"
                      variant={metric === "tickets" ? "secondary" : "ghost"}
                      onClick={() => setMetric("tickets")}
                    >
                      Tickets
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {buckets.length === 0 ? (
                  <EmptyState
                    title="No completions in this window"
                    description="Velocity appears once tickets start reaching Done."
                  />
                ) : (
                  <div className="flex h-48 items-end gap-2 sm:gap-3">
                    {buckets.map((b, i) => {
                      const value = metric === "points" ? b.points : b.completed;
                      return (
                        <div
                          key={b.start}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                          title={`${format(new Date(b.start), "MMM d")}: ${value} ${metric}`}
                        >
                          <span className="text-xs font-semibold tabular-nums text-foreground">
                            {value}
                          </span>
                          <motion.div
                            className="w-full max-w-10 rounded-t-md bg-primary"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((value / maxValue) * 100, 2)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.04 }}
                          />
                          <span className="text-[10px] text-foreground-muted">
                            {format(new Date(b.start), "MMM d")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Where time goes */}
            <StaggerItem>
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Where time goes</CardTitle>
                  <CardDescription>
                    Share of a completed ticket’s life in each stage
                    {flow?.flowEfficiency != null &&
                      ` · flow efficiency ${Math.round(flow.flowEfficiency * 100)}%`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stageShares.length === 0 ? (
                    <EmptyState title="No completed tickets in this window yet" />
                  ) : (
                    <>
                      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
                        {stageShares.map((s) => (
                          <motion.div
                            key={s.key}
                            className={cn("h-full", STAGE_STYLES[s.key].bar)}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(s.share * 100, 2)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            title={`${STAGE_STYLES[s.key].label}: ${Math.round(s.share * 100)}%${s.days != null ? ` (${s.days}d avg)` : ""}`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {stageShares.map((s) => (
                          <span key={s.key} className="flex items-center gap-1.5 text-xs">
                            <span className={cn("h-2 w-2 rounded-full", STAGE_STYLES[s.key].bar)} />
                            <span className="text-foreground-muted">
                              {STAGE_STYLES[s.key].label}
                            </span>
                            <span className="font-semibold tabular-nums text-foreground">
                              {Math.round(s.share * 100)}%
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {flow?.wip?.stale?.length > 0 && (
                    <div className="rounded-xl bg-warning-muted/50 border border-warning/10 p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        <CircleDot className="h-3 w-3 text-warning" />
                        Stale work ({flow.wip.staleDays}+ days idle)
                      </p>
                      {flow.wip.stale.slice(0, 4).map((s: any) => (
                        <p key={s.id} className="truncate text-xs text-foreground-muted">
                          <span className="font-mono">{s.code}</span> · {s.title} —{" "}
                          <span className="text-warning">{s.idleDays}d idle</span>
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Reliability */}
            <StaggerItem>
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Reliability</CardTitle>
                  <CardDescription>Quality of delivery over the same window</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-success-muted/50 border border-success/10 p-4">
                      <p className="text-sm font-medium text-foreground">On-time delivery</p>
                      <p className="mt-1 text-3xl font-bold text-success">
                        {onTime?.rate != null ? `${Math.round(onTime.rate * 100)}%` : "—"}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {onTime?.withEstimate
                          ? `${onTime.onTime}/${onTime.withEstimate} with due dates`
                          : "no due dates set"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-destructive-muted/50 border border-destructive/10 p-4">
                      <p className="text-sm font-medium text-foreground">Bugs per delivery</p>
                      <p className="mt-1 text-3xl font-bold text-destructive">
                        {reliability?.defects?.bugsPerDelivery ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {reliability?.defects?.bugsCreated ?? 0} bugs raised in window
                      </p>
                    </div>
                  </div>
                  {reliability?.rework?.byAssignee?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        Rework by developer
                      </p>
                      <div className="space-y-1.5">
                        {reliability.rework.byAssignee.slice(0, 5).map((r: any) => (
                          <div
                            key={r.uid}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="truncate text-foreground">{r.name || r.uid}</span>
                            <span className="shrink-0 text-xs tabular-nums text-foreground-muted">
                              {r.reopens} reopen{r.reopens === 1 ? "" : "s"} ·{" "}
                              {r.qaRejections} QA bounce{r.qaRejections === 1 ? "" : "s"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          </div>

          {/* Team scorecards — card-row list, matching the People page idiom */}
          <StaggerItem>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Team scorecards</CardTitle>
                <CardDescription>
                  Read pace together with quality — high throughput with low
                  first-pass is rework, not speed. Small samples move these
                  numbers a lot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(team?.members || [])
                  .filter((m: any) => m.throughput.completed > 0 || m.engagement.wip > 0)
                  .map((m: any) => (
                    <div
                      key={m.uid}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <Avatar name={m.name || m.uid} size="sm" />
                      <div className="min-w-[140px]">
                        <p className="text-sm font-medium text-foreground">
                          {m.name || m.uid}
                        </p>
                        {m.role && (
                          <p className="text-xs capitalize text-foreground-muted">{m.role}</p>
                        )}
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1">
                        <Metric label="Done" value={m.throughput.completed} />
                        <Metric label="Points" value={m.throughput.points} />
                        <Metric
                          label="Cycle p50"
                          value={
                            m.cycleTime.p50Days != null ? `${m.cycleTime.p50Days}d` : "—"
                          }
                        />
                        <Metric
                          label="First-pass"
                          value={
                            m.quality.firstPassRate != null
                              ? `${Math.round(m.quality.firstPassRate * 100)}%`
                              : "—"
                          }
                          warn={
                            m.quality.firstPassRate != null &&
                            m.quality.firstPassRate < 0.7
                          }
                        />
                        <Metric
                          label="On-time"
                          value={
                            m.quality.onTimeRate != null
                              ? `${Math.round(m.quality.onTimeRate * 100)}%`
                              : "—"
                          }
                        />
                        <Metric label="WIP" value={m.engagement.wip} />
                      </div>
                    </div>
                  ))}
                {(team?.members || []).filter(
                  (m: any) => m.throughput.completed > 0 || m.engagement.wip > 0
                ).length === 0 && (
                  <EmptyState title="No activity in this window yet" />
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </>
      )}
    </StaggerContainer>
  );
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          warn ? "text-warning" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
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
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Velocity</h1>
        <p className="text-sm text-foreground-muted">
          Delivery pace, flow health, and per-developer effectiveness
        </p>
      </div>
    </div>
  );
}
