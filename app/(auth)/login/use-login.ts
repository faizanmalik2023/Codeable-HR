"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore, landingForRole } from "@/stores/auth-store";
import { ApiRequestError } from "@/lib/api/client";

/** Login page hook — Google is the only sign-in route (Codeable accounts only). */
export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const onSuccess = React.useCallback(
    (res: { user: Parameters<typeof setSession>[0]; tokens: Parameters<typeof setSession>[1] }) => {
      setSession(res.user, res.tokens);
      router.replace(landingForRole(res.user.role));
    },
    [router, setSession]
  );

  const google = useMutation({
    mutationFn: (idToken: string) => authApi.google(idToken),
    onSuccess,
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Google sign-in failed"),
  });

  return {
    signInWithGoogle: (idToken: string) => google.mutate(idToken),
    isPending: google.isPending,
    error: google.error as unknown,
  };
}
