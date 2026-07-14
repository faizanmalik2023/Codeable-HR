"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError } from "@/lib/api/client";
import {
  pmKeys,
  projectsMgmtApi,
  type DocumentBody,
  type MemberInput,
  type MemberUpdateBody,
  type MilestoneBody,
  type ProjectBody,
  type ProjectTask,
  type ProjectTaskStatus,
  type TaskBody,
} from "@/lib/api/projects-mgmt";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

export type ProjectTab = "overview" | "team" | "tasks" | "activity" | "analytics";

export function useProjectDetail(id: string, activeTab: ProjectTab) {
  const qc = useQueryClient();
  const router = useRouter();

  const invalidateDetail = () => qc.invalidateQueries({ queryKey: pmKeys.detail(id) });

  /* ---- core detail (summary + members + milestones) ---- */
  const detail = useQuery({
    queryKey: pmKeys.detail(id),
    queryFn: () => projectsMgmtApi.get(id),
    enabled: !!id,
  });

  /* ---- per-tab data ---- */
  const documents = useQuery({
    queryKey: pmKeys.documents(id),
    queryFn: () => projectsMgmtApi.documents(id),
    enabled: !!id && activeTab === "overview",
  });

  const tasks = useQuery({
    queryKey: pmKeys.tasks(id),
    queryFn: () => projectsMgmtApi.tasks(id),
    enabled: !!id && activeTab === "tasks",
  });

  const analytics = useQuery({
    queryKey: pmKeys.analytics(id),
    queryFn: () => projectsMgmtApi.analytics(id),
    enabled: !!id && activeTab === "analytics",
  });

  const [eodPage, setEodPage] = React.useState(1);
  const eods = useQuery({
    queryKey: pmKeys.eods(id, "", eodPage),
    queryFn: () => projectsMgmtApi.eods(id, { page: eodPage }),
    enabled: !!id && activeTab === "activity",
    placeholderData: (prev) => prev,
  });

  /* ---- project mutations ---- */
  const updateProject = useMutation({
    mutationFn: (body: Partial<ProjectBody>) => projectsMgmtApi.update(id, body),
    onSuccess: () => {
      toast.success("Project updated");
      invalidateDetail();
      qc.invalidateQueries({ queryKey: pmKeys.all });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update project")),
  });

  const removeProject = useMutation({
    mutationFn: () => projectsMgmtApi.remove(id),
    onSuccess: () => {
      toast.success("Project archived");
      qc.invalidateQueries({ queryKey: pmKeys.all });
      router.push("/hr/projects");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't archive project")),
  });

  /* ---- members ---- */
  const addMembers = useMutation({
    mutationFn: (members: MemberInput[]) => projectsMgmtApi.addMembers(id, members),
    onSuccess: () => {
      toast.success("Members added");
      invalidateDetail();
      qc.invalidateQueries({ queryKey: pmKeys.available(id) });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add members")),
  });

  const updateMember = useMutation({
    mutationFn: (v: { userId: string; body: MemberUpdateBody }) =>
      projectsMgmtApi.updateMember(id, v.userId, v.body),
    onSuccess: () => {
      toast.success("Member updated");
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update member")),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => projectsMgmtApi.removeMember(id, userId),
    onSuccess: () => {
      toast.success("Member removed");
      invalidateDetail();
      qc.invalidateQueries({ queryKey: pmKeys.available(id) });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove member")),
  });

  /* ---- milestones ---- */
  const createMilestone = useMutation({
    mutationFn: (body: MilestoneBody) => projectsMgmtApi.createMilestone(id, body),
    onSuccess: () => {
      toast.success("Milestone added");
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add milestone")),
  });

  const updateMilestone = useMutation({
    mutationFn: (v: { milestoneId: string; body: Partial<MilestoneBody> }) =>
      projectsMgmtApi.updateMilestone(id, v.milestoneId, v.body),
    onSuccess: () => {
      toast.success("Milestone updated");
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't update milestone")),
  });

  const removeMilestone = useMutation({
    mutationFn: (milestoneId: string) => projectsMgmtApi.removeMilestone(id, milestoneId),
    onSuccess: () => {
      toast.success("Milestone deleted");
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't delete milestone")),
  });

  /* ---- documents ---- */
  const addDocument = useMutation({
    mutationFn: (body: DocumentBody) => projectsMgmtApi.addDocument(id, body),
    onSuccess: () => {
      toast.success("Document added");
      qc.invalidateQueries({ queryKey: pmKeys.documents(id) });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't add document")),
  });

  const removeDocument = useMutation({
    mutationFn: (docId: string) => projectsMgmtApi.removeDocument(id, docId),
    onSuccess: () => {
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey: pmKeys.documents(id) });
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't remove document")),
  });

  /* ---- tasks ---- */
  const createTask = useMutation({
    mutationFn: (body: TaskBody) => projectsMgmtApi.createTask(id, body),
    onSuccess: () => {
      toast.success("Task created");
      qc.invalidateQueries({ queryKey: pmKeys.tasks(id) });
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't create task")),
  });

  const updateTask = useMutation({
    mutationFn: (v: { taskId: string; body: Partial<TaskBody> }) =>
      projectsMgmtApi.updateTask(id, v.taskId, v.body),
    // Optimistic status change (kanban drag).
    onMutate: async (v) => {
      if (v.body.status === undefined) return { previous: undefined };
      await qc.cancelQueries({ queryKey: pmKeys.tasks(id) });
      const previous = qc.getQueryData<ProjectTask[]>(pmKeys.tasks(id));
      qc.setQueryData<ProjectTask[]>(pmKeys.tasks(id), (old) =>
        (old ?? []).map((t) =>
          t.id === v.taskId ? { ...t, status: v.body.status as ProjectTaskStatus } : t
        )
      );
      return { previous };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(pmKeys.tasks(id), ctx.previous);
      toast.error(errMsg(e, "Couldn't update task"));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: pmKeys.tasks(id) });
      invalidateDetail();
    },
  });

  const removeTask = useMutation({
    mutationFn: (taskId: string) => projectsMgmtApi.removeTask(id, taskId),
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: pmKeys.tasks(id) });
      invalidateDetail();
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't delete task")),
  });

  return {
    detail,
    documents,
    tasks,
    analytics,
    eods,
    eodPage,
    setEodPage,
    // project
    updateProject,
    removeProject,
    // members
    addMembers,
    updateMember,
    removeMember,
    // milestones
    createMilestone,
    updateMilestone,
    removeMilestone,
    // documents
    addDocument,
    removeDocument,
    // tasks
    createTask,
    updateTask,
    removeTask,
  };
}
