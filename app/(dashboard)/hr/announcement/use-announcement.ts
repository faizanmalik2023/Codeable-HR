"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { announcementsApi, type AnnouncementBody } from "@/lib/api/announcements";
import { departmentsApi, toItems } from "@/lib/api/departments";
import { departmentKeys } from "../../departments/use-departments";
import { ApiRequestError } from "@/lib/api/client";

/** Composer hook — loads departments for the picker and sends the announcement. */
export function useAnnouncement() {
  const departments = useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => departmentsApi.list(),
    select: toItems,
  });

  const send = useMutation({
    mutationFn: (body: AnnouncementBody) => announcementsApi.send(body),
    onError: (e) =>
      toast.error(e instanceof ApiRequestError ? e.message : "Couldn't send announcement"),
  });

  return {
    departmentOptions: (departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    departmentsLoading: departments.isLoading,
    send,
  };
}
