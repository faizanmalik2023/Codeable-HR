/**
 * Projects management API — HR feature.
 *
 * Kept separate from the existing `lib/api/projects.ts` (which only exposes the
 * lightweight `projectsApi.options` picker). This module owns the full CRUD
 * surface: projects, members, tasks, milestones, documents, analytics and the
 * per-project EOD feed. Query keys and wire types are defined locally so the
 * shared `lib/query/keys.ts` and `types/index.ts` stay untouched.
 */

import { api } from "@/lib/api/client";
import type { EmployeeRef, EodReportModel, Paginated } from "@/types";

/* ------------------------------------------------------------------ */
/* Local enums                                                         */
/* ------------------------------------------------------------------ */
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "critical";
export type ProjectTaskStatus = "todo" | "in_progress" | "done";
export type ProjectMilestoneStatus = "pending" | "in_progress" | "completed";
export type ProjectDocumentType = "file" | "note" | "link";

/* ------------------------------------------------------------------ */
/* Wire types                                                          */
/* ------------------------------------------------------------------ */
export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  color?: string | null;
  client_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  progress?: number;
  lead?: EmployeeRef | null;
  member_count?: number;
  members_preview?: EmployeeRef[];
  open_task_count?: number;
  milestone_count?: number;
  completed_milestone_count?: number;
}

/** `formatMember` wire shape: employee nested, `project_role`, membership `id`. */
export interface ProjectMember {
  /** Membership subdoc id (NOT the user id). */
  id?: string;
  employee?: EmployeeRef | null;
  project_role?: string;
  allocation?: number | null;
  hours_logged?: number;
  eod_count?: number;
  last_eod_at?: string | null;
  joined_at?: string | null;
}

/** The employee/user id behind a project member (used for member sub-routes). */
export const memberUserId = (m: ProjectMember): string => m.employee?.id ?? "";

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectMilestoneStatus;
  due_date?: string | null;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  assignee?: EmployeeRef | null;
  milestone_id?: string | null;
  due_date?: string | null;
}

export interface ProjectDocument {
  id: string;
  type: ProjectDocumentType;
  name: string;
  url?: string | null;
  key?: string | null;
  body?: string | null;
  created_at?: string;
}

/**
 * `GET /projects/:id` returns a FLAT detail — the summary fields spread at the
 * top level, plus `members` and `milestones` (no `.summary` wrapper).
 */
export interface ProjectDetail extends ProjectSummary {
  members: ProjectMember[];
  milestones: ProjectMilestone[];
}

export interface ProjectEodEntry {
  id: string;
  date: string;
  summary: string;
  hours?: number;
  /** `formatEod` emits the reporter as `employee` (EmployeeRef). */
  employee?: EmployeeRef | null;
}

/** `formatAnalytics` nests the headline metrics under `summary`. */
export interface ProjectAnalyticsSummary {
  total_hours?: number;
  member_count?: number;
  eod_count?: number;
  active_days?: number;
  avg_hours_per_active_day?: number;
  open_tasks?: number;
  completed_tasks?: number;
  total_tasks?: number;
  milestones_completed?: number;
  milestones_total?: number;
  progress?: number;
  days_remaining?: number | null;
  is_overdue?: boolean;
}

export interface HoursByMemberRow {
  employee?: EmployeeRef | null;
  hours?: number;
  eod_count?: number;
  percentage?: number;
}

export interface ProjectAnalytics {
  range?: { from: string; to: string; preset: string };
  summary?: ProjectAnalyticsSummary;
  hours_by_member?: HoursByMemberRow[];
  hours_by_week?: { week_start: string; label: string; hours: number }[];
  eod_activity?: { date: string; count: number; hours: number }[];
  status_breakdown?: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Bodies                                                              */
/* ------------------------------------------------------------------ */
export interface ProjectBody {
  name: string;
  code?: string;
  client_name?: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  color?: string;
  start_date?: string;
  due_date?: string;
}

export interface MemberInput {
  userId: string;
  /** addMembersSchema key is `project_role` (→ projectRole). */
  project_role: string;
  allocation?: number;
}

export interface MemberUpdateBody {
  /** updateMemberSchema key is `project_role` (→ projectRole). */
  project_role?: string;
  allocation?: number;
}

export interface TaskBody {
  title: string;
  description?: string;
  status?: ProjectTaskStatus;
  /** create/updateTaskSchema key is `assignee_user_id` (→ assigneeUserId). */
  assignee_user_id?: string | null;
  milestone_id?: string | null;
  due_date?: string | null;
}

export interface MilestoneBody {
  title: string;
  description?: string;
  status?: ProjectMilestoneStatus;
  due_date?: string | null;
}

export interface DocumentBody {
  type: ProjectDocumentType;
  name: string;
  url?: string;
  key?: string;
  body?: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/* ------------------------------------------------------------------ */
/* Local query keys                                                    */
/* ------------------------------------------------------------------ */
export const pmKeys = {
  all: ["projects-mgmt"] as const,
  list: (search: string, status: string, page: number) =>
    ["projects-mgmt", "list", search, status, page] as const,
  detail: (id: string) => ["projects-mgmt", "detail", id] as const,
  members: (id: string) => ["projects-mgmt", id, "members"] as const,
  available: (id: string) => ["projects-mgmt", id, "available-employees"] as const,
  tasks: (id: string) => ["projects-mgmt", id, "tasks"] as const,
  milestones: (id: string) => ["projects-mgmt", id, "milestones"] as const,
  documents: (id: string) => ["projects-mgmt", id, "documents"] as const,
  analytics: (id: string) => ["projects-mgmt", id, "analytics"] as const,
  eods: (id: string, userId: string, page: number) =>
    ["projects-mgmt", id, "eods", userId, page] as const,
};

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
export const projectsMgmtApi = {
  list: (params: ProjectListParams) =>
    api.get<Paginated<ProjectSummary>>("/projects", {
      page: params.page ?? 1,
      limit: params.limit ?? 12,
      search: params.search || undefined,
      status: params.status,
    }),

  get: (id: string) => api.get<ProjectDetail>(`/projects/${id}`),

  create: (body: ProjectBody) => api.post<ProjectSummary>("/projects", body),

  update: (id: string, body: Partial<ProjectBody>) =>
    api.patch<ProjectSummary>(`/projects/${id}`, body),

  remove: (id: string) => api.delete<void>(`/projects/${id}`),

  /* members */
  members: (id: string) => api.get<ProjectMember[]>(`/projects/${id}/members`),
  addMembers: (id: string, members: MemberInput[]) =>
    api.post<void>(`/projects/${id}/members`, { members }),
  updateMember: (id: string, userId: string, body: MemberUpdateBody) =>
    api.patch<void>(`/projects/${id}/members/${userId}`, body),
  removeMember: (id: string, userId: string) =>
    api.delete<void>(`/projects/${id}/members/${userId}`),
  availableEmployees: (id: string) =>
    api.get<EmployeeRef[]>(`/projects/${id}/available-employees`),

  /* tasks */
  tasks: (id: string) =>
    api.get<{ items: ProjectTask[] }>(`/projects/${id}/tasks`).then((r) => r.items),
  createTask: (id: string, body: TaskBody) =>
    api.post<ProjectTask>(`/projects/${id}/tasks`, body),
  updateTask: (id: string, taskId: string, body: Partial<TaskBody>) =>
    api.patch<ProjectTask>(`/projects/${id}/tasks/${taskId}`, body),
  removeTask: (id: string, taskId: string) =>
    api.delete<void>(`/projects/${id}/tasks/${taskId}`),

  /* milestones */
  milestones: (id: string) =>
    api
      .get<{ items: ProjectMilestone[] }>(`/projects/${id}/milestones`)
      .then((r) => r.items),
  createMilestone: (id: string, body: MilestoneBody) =>
    api.post<ProjectMilestone>(`/projects/${id}/milestones`, body),
  updateMilestone: (id: string, milestoneId: string, body: Partial<MilestoneBody>) =>
    api.patch<ProjectMilestone>(`/projects/${id}/milestones/${milestoneId}`, body),
  removeMilestone: (id: string, milestoneId: string) =>
    api.delete<void>(`/projects/${id}/milestones/${milestoneId}`),

  /* documents */
  documents: (id: string) =>
    api
      .get<{ items: ProjectDocument[] }>(`/projects/${id}/documents`)
      .then((r) => r.items),
  addDocument: (id: string, body: DocumentBody) =>
    api.post<ProjectDocument>(`/projects/${id}/documents`, body),
  removeDocument: (id: string, docId: string) =>
    api.delete<void>(`/projects/${id}/documents/${docId}`),

  /* analytics + activity feed */
  analytics: (id: string) => api.get<ProjectAnalytics>(`/projects/${id}/analytics`),
  eods: (id: string, params: { page?: number; userId?: string }) =>
    api.get<Paginated<ProjectEodEntry>>(`/projects/${id}/eods`, {
      page: params.page ?? 1,
      userId: params.userId || undefined,
    }),
};
