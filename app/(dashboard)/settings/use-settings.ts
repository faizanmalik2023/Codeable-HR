"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileApi, type PreferencesUpdateBody } from "@/lib/api/profile";
import { qk } from "@/lib/query/keys";
import { ApiRequestError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { NotificationPreferences } from "@/types";

const errMsg = (e: unknown, fallback: string) =>
  e instanceof ApiRequestError ? e.message : fallback;

/** Settings page hook — preferences + account deletion. */
export function useSettings() {
  const qc = useQueryClient();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  const query = useQuery({
    queryKey: qk.preferences,
    queryFn: () => profileApi.getPreferences(),
  });

  const updatePreferences = useMutation({
    mutationFn: (body: PreferencesUpdateBody) => profileApi.updatePreferences(body),
    onSuccess: (data) => {
      qc.setQueryData<NotificationPreferences>(qk.preferences, (prev) =>
        prev ? { ...prev, ...data } : data
      );
      toast.success("Preferences saved");
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: qk.preferences });
      toast.error(errMsg(e, "Couldn't save your preferences"));
    },
  });

  const deleteAccount = useMutation({
    mutationFn: () => profileApi.deleteAccount(),
    onSuccess: () => {
      toast.success("Your account has been deleted");
      clear();
      router.replace("/login");
    },
    onError: (e) => toast.error(errMsg(e, "Couldn't delete your account")),
  });

  return {
    query,
    preferences: query.data,
    updatePreferences,
    deleteAccount,
  };
}
