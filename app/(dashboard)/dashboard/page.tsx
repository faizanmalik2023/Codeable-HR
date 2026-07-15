"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  CalendarPlus,
  Clock,
  MessageSquare,
  ArrowRight,
  Cake,
  Palmtree,
  Wallet,
  CalendarCheck,
  Users,
  UserCheck,
  ClipboardList,
  Building2,
  XCircle,
  Bell,
  Receipt,
  FileCheck2,
  Megaphone,
  Shield,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatusCard } from "@/components/shared/status-card";
import { QuickActionCard } from "@/components/shared/quick-action-card";
import { SkeletonStats, SkeletonCard, Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/empty-state";
import { formatOrdinalDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CHECK_IN_LABELS } from "@/lib/enums";
import { hasRole } from "@/stores/auth-store";
import { TodayWorkCard } from "@/components/dashboard/today-work-card";
import { useDashboard } from "./use-dashboard";
import type { ActivityItemModel } from "@/types";

/* A warmer, daypart-aware greeting that rotates by day so it doesn't read the same
 * every login. Seeded off the server's date + greeting (not the client clock) so it
 * renders identically on server and client — no hydration flicker. */
function creativeGreeting(base: string, firstName: string, seed: string): string {
  const key = (base ?? "").toLowerCase();
  const morning = [`Good morning, ${firstName}`, `Morning, ${firstName} ☀️`, `Rise and shine, ${firstName}`];
  const afternoon = [`Good afternoon, ${firstName}`, `Afternoon, ${firstName}`, `Keep it rolling, ${firstName}`];
  const evening = [`Good evening, ${firstName}`, `Evening, ${firstName} 🌙`, `Winding down, ${firstName}?`];
  const set = key.includes("morning") ? morning : key.includes("afternoon") ? afternoon : evening;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return set[h % set.length];
}

/* Activity type → icon + tone mapping. */
function activityVisual(type: string): { icon: typeof FileText; className: string } {
  const t = (type ?? "").toLowerCase();
  if (t.includes("leave") && t.includes("reject"))
    return { icon: XCircle, className: "bg-destructive-muted text-destructive" };
  if (t.includes("leave")) return { icon: CalendarCheck, className: "bg-success-muted text-success" };
  if (t.includes("eod")) return { icon: FileText, className: "bg-primary-muted text-primary" };
  if (t.includes("payslip") || t.includes("salary"))
    return { icon: Wallet, className: "bg-success-muted text-success" };
  if (t.includes("claim")) return { icon: FileCheck2, className: "bg-warning-muted text-warning" };
  if (t.includes("expense")) return { icon: Receipt, className: "bg-warning-muted text-warning" };
  if (t.includes("ticket")) return { icon: MessageSquare, className: "bg-primary-muted text-primary" };
  if (t.includes("policy")) return { icon: FileCheck2, className: "bg-secondary text-foreground-muted" };
  if (t.includes("announce")) return { icon: Megaphone, className: "bg-accent-muted text-accent" };
  return { icon: Bell, className: "bg-secondary text-foreground-muted" };
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, user, isManager, role } = useDashboard();
  const isHrPlus = hasRole(role, "hr");

  if (isLoading && !data) return <DashboardSkeleton />;
  if (isError && !data)
    return <ErrorState message="We couldn't load your dashboard." onRetry={() => refetch()} />;
  if (!data) return null;

  const glance = data.at_a_glance;
  const firstName = (user?.full_name ?? "").split(" ")[0] || "there";
  const greeting = creativeGreeting(data.greeting, firstName, data.current_date ?? data.greeting ?? "");

  // The EOD quick-action mirrors today's EOD state so it never invites a duplicate
  // submission. Pending → submit (blank form); already submitted but awaiting review
  // → update (backend allows editing a pending EOD); reviewed → view only (backend
  // rejects re-submitting a reviewed EOD). It only earns the primary highlight while
  // an EOD is actually pending — otherwise it sits quietly with the other actions.
  const eodAction = data.eod_pending
    ? { title: "Submit EOD", description: "Log your day", href: "/eod-reports/submit" }
    : data.eod_status === "pending"
      ? { title: "Update EOD", description: "Edit today's report", href: "/eod-reports" }
      : data.eod_status === "submitted"
        ? { title: "View EOD", description: "Reviewed by manager", href: "/eod-reports" }
        : { title: "Submit EOD", description: "Log your day", href: "/eod-reports/submit" };

  return (
    <div className="space-y-6">
      {/* EOD status banner — reflects the actual state of today's EOD */}
      {(() => {
        const banner = data.eod_pending
          ? {
              href: "/eod-reports/submit",
              title: "Your EOD is pending",
              desc: "Submit today's end-of-day report.",
              tone: "warning" as const,
            }
          : data.eod_status === "pending"
            ? {
                href: "/eod-reports",
                title: "EOD submitted",
                desc: "Awaiting your manager's review.",
                tone: "success" as const,
              }
            : data.eod_status === "submitted"
              ? {
                  href: "/eod-reports",
                  title: "EOD reviewed",
                  desc: "Your manager reviewed today's report.",
                  tone: "success" as const,
                }
              : null;
        if (!banner) return null;
        const tones =
          banner.tone === "warning"
            ? { card: "border-warning/30 bg-warning-muted/40", icon: "bg-warning text-warning-foreground" }
            : { card: "border-success/30 bg-success-muted/40", icon: "bg-success text-success-foreground" };
        return (
          <Link href={banner.href} className="block">
            <Card hover className={cn("flex items-center justify-between gap-4 p-4", tones.card)}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", tones.icon)}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{banner.title}</p>
                  <p className="text-sm text-foreground-muted">{banner.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-foreground-muted" />
            </Card>
          </Link>
        );
      })()}

      {/* Greeting — navy→blue gradient hero with rotated emblem watermark */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] p-6 text-white md:p-8"
        style={{
          backgroundImage:
            "linear-gradient(135deg, hsl(var(--hero-from)) 0%, hsl(var(--hero-to)) 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 w-56 max-w-none rotate-12 opacity-[0.12]"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold md:text-3xl">{greeting}</h1>
            {data.current_date && (
              <p className="mt-1 text-sm text-white/70">{formatOrdinalDate(data.current_date)}</p>
            )}
          </div>
          {/* Attendance pill — only employees/managers clock in */}
          {!isHrPlus && glance?.attendance_status && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white" />
              {CHECK_IN_LABELS[glance.attendance_status]}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isHrPlus ? (
          <>
            <QuickActionCard title="People" description="Browse employees" icon={Users} onClick={() => router.push("/people")} />
            <QuickActionCard title="Leave Requests" description="Review & approve" icon={UserCheck} onClick={() => router.push("/hr/leaves")} />
            <QuickActionCard title="Attendance" description="Company logs" icon={Clock} onClick={() => router.push("/hr/time")} />
            <QuickActionCard title="Departments" description="Manage org" icon={Building2} onClick={() => router.push("/departments")} />
          </>
        ) : (
          <>
            <QuickActionCard title={eodAction.title} description={eodAction.description} icon={FileText} variant={data.eod_pending ? "primary" : undefined} onClick={() => router.push(eodAction.href)} />
            <QuickActionCard title="Apply Leave" description="Request time off" icon={CalendarPlus} onClick={() => router.push("/leaves/apply")} />
            <QuickActionCard title="View Salary" description="Slips & breakdown" icon={Wallet} onClick={() => router.push("/salary-details")} />
            <QuickActionCard title="Attendance" description="View your logs" icon={Clock} onClick={() => router.push("/time")} />
            <QuickActionCard title="Insurance Claim" description="Submit a claim" icon={Shield} onClick={() => router.push("/insurance-claims/submit")} />
            <QuickActionCard title="Expense Claim" description="Get reimbursed" icon={Receipt} onClick={() => router.push("/expense-claims/submit")} />
            <QuickActionCard title="HR Help" description="Raise an issue" icon={MessageSquare} onClick={() => router.push("/my-issues/new")} />
            <QuickActionCard title="Policies" description="Company handbook" icon={BookOpen} onClick={() => router.push("/policies")} />
          </>
        )}
      </div>

      {/* Live work timer + today's sessions — only for roles that clock in. */}
      {!isHrPlus && <TodayWorkCard />}

      {/* Payroll entry (HR/Admin). Kept calm by default — a neutral card with a
          contained CTA rather than an always-on blue slab, so it doesn't manufacture
          daily urgency for a once-a-month action. Follow-up: promote to a prominent
          state only when the current month's payroll is still unreleased (needs a
          `payroll_pending` signal from the dashboard API). */}
      {isHrPlus && (
        <Link href="/hr/payroll" className="block">
          <Card hover className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold leading-tight text-foreground">Payroll</p>
                <p className="text-sm text-foreground-muted">
                  Generate and release this month&apos;s payslips.
                </p>
              </div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Run payroll
              <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>
      )}

      {/* Admin org stats */}
      {data.org_stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatusCard title="Headcount" value={String(data.org_stats.total_employees ?? 0)} icon={Users} variant="primary" />
          <StatusCard title="Present today" value={String(data.org_stats.present_today ?? 0)} icon={UserCheck} variant="success" />
          <StatusCard title="On leave today" value={String(data.org_stats.on_leave ?? 0)} icon={Palmtree} variant="warning" />
          <StatusCard title="Pending leaves" value={String(data.pending_leaves?.length ?? 0)} icon={ClipboardList} variant="accent" />
        </div>
      )}

      {/* At a glance — hours worked now lives in the live work card above. */}
      {glance && !data.org_stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatusCard title="Next salary" value={glance.next_salary?.date ? formatOrdinalDate(glance.next_salary.date) : "—"} icon={Wallet} variant="accent" />
          <StatusCard title="Next holiday" value={glance.next_holiday?.date ? formatOrdinalDate(glance.next_holiday.date) : "—"} icon={Palmtree} variant="warning" />
        </div>
      )}

      {/* Manager band */}
      {isManager && (data.team_eod_updates?.length || data.team_leave_requests?.length) ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Team EOD Updates" href="/eod-reports/team" icon={ClipboardList}>
            {(data.team_eod_updates ?? []).slice(0, 4).map((m, i) => (
              <div key={m.employee?.employee_code ?? m.employee?.id ?? i} className="flex items-center gap-3 py-2">
                <Avatar name={m.employee?.full_name} src={m.employee?.avatar ?? undefined} size="sm" />
                <span className="flex-1 text-sm font-medium text-foreground">{m.employee?.full_name}</span>
                {typeof m.unread_eod_count === "number" && m.unread_eod_count > 0 && (
                  <Badge variant="warning">{m.unread_eod_count} new</Badge>
                )}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Team Leave Requests" href="/leaves/team" icon={UserCheck}>
            {(data.team_leave_requests ?? []).slice(0, 4).map((l, i) => (
              <div key={l.id ?? l.employee?.employee_code ?? i} className="flex items-center gap-3 py-2">
                <Avatar name={l.employee?.full_name ?? l.employee?.name} size="sm" />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {l.employee?.full_name ?? l.employee?.name ?? "Team member"}
                </span>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </SectionCard>
        </div>
      ) : null}

      {/* Two-column content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: leave balance + pending leaves + activity */}
        <div className="space-y-6 lg:col-span-2">
          {data.leave_balance?.length ? (
            <SectionCard title="Leave Balance" href="/leaves" icon={CalendarCheck}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.leave_balance.map((b, i) => (
                  <div key={b.leave_type ?? i} className="rounded-[var(--radius-lg)] border border-border bg-secondary/30 p-3">
                    <p className="text-xs font-medium text-foreground-muted">{b.name}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {b.remaining}
                      <span className="text-sm font-normal text-foreground-subtle"> / {b.quota}</span>
                    </p>
                    <p className="text-[11px] text-foreground-subtle">{b.used} used</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {isHrPlus && data.pending_leaves?.length ? (
            <SectionCard title="Pending Leaves" href="/hr/leaves" icon={ClipboardList}>
              {data.pending_leaves.slice(0, 5).map((l, i) => (
                <div key={l.id ?? l.employee?.employee_code ?? i} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                  <Avatar name={l.employee?.full_name ?? l.employee?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {l.employee?.full_name ?? l.employee?.name}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {l.leave_type_name ?? l.leave_type} · {l.days ?? 1}d
                    </p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </SectionCard>
          ) : null}

          <SectionCard title="Recent Activity" href="/recent-activity" icon={Bell}>
            {data.recent_activity?.length ? (
              <div className="space-y-1">
                {data.recent_activity.slice(0, 5).map((a, i) => (
                  <ActivityRow key={a.id ?? i} activity={a} />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-foreground-muted">No recent activity.</p>
            )}
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {data.upcoming_holidays?.length ? (
            <SectionCard title="Upcoming Holidays" href="/all-holidays" icon={Palmtree}>
              {data.upcoming_holidays.slice(0, 4).map((h, i) => (
                <div key={h.id ?? h.name ?? i} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{h.name}</p>
                    <p className="text-xs text-foreground-muted">{formatOrdinalDate(h.date)}</p>
                  </div>
                  {typeof h.days_left === "number" && <Badge variant="muted">{h.days_left}d</Badge>}
                </div>
              ))}
            </SectionCard>
          ) : null}

          {data.birthdays?.length ? (
            <SectionCard title="Birthdays" icon={Cake}>
              {data.birthdays.slice(0, 4).map((b, i) => (
                <div key={b.employee?.employee_code ?? b.employee?.id ?? i} className="flex items-center gap-3 py-2">
                  <Avatar name={b.employee?.full_name} src={b.employee?.avatar ?? undefined} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{b.employee?.full_name}</p>
                    <p className="text-xs text-foreground-muted">{formatOrdinalDate(b.date)}</p>
                  </div>
                  <Cake className="h-4 w-4 text-accent" />
                </div>
              ))}
            </SectionCard>
          ) : null}

          {data.on_leave_today?.length ? (
            <SectionCard title="On Leave Today" icon={Palmtree}>
              {data.on_leave_today.slice(0, 5).map((e, i) => (
                <div key={e.employee?.employee_code ?? e.employee?.id ?? i} className="flex items-center gap-3 py-2">
                  <Avatar name={e.employee?.full_name} src={e.employee?.avatar ?? undefined} size="sm" />
                  <span className="text-sm font-medium text-foreground">{e.employee?.full_name}</span>
                </div>
              ))}
            </SectionCard>
          ) : null}

          {data.open_tickets?.length ? (
            <SectionCard title="Open Tickets" href={isHrPlus ? "/hr/issues" : "/my-issues"} icon={MessageSquare}>
              {data.open_tickets.slice(0, 4).map((t, i) => (
                <div key={t.id ?? i} className="flex items-center gap-2 border-b border-border py-2.5 last:border-0">
                  <span className="flex-1 truncate text-sm font-medium text-foreground">{t.title}</span>
                  <Badge variant="secondary">{t.status}</Badge>
                </div>
              ))}
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityItemModel }) {
  const { icon: Icon, className } = activityVisual(activity.type);
  return (
    <div className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-secondary/50">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{activity.title}</p>
        {(activity.body ?? activity.subtitle) && (
          <p className="truncate text-xs text-foreground-muted">{activity.body ?? activity.subtitle}</p>
        )}
      </div>
      <span className="whitespace-nowrap text-xs text-foreground-subtle">
        {timeAgo(activity.timestamp, activity.time_ago)}
      </span>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: typeof FileText;
  href?: string;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, href, children }: SectionCardProps) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors hover:text-primary"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <SkeletonStats count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}
