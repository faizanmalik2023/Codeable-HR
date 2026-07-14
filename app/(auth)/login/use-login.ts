"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { useAuthStore, landingForRole } from "@/stores/auth-store";
import { ApiRequestError } from "@/lib/api/client";

/** Login page hook — Google + email/password, both wire to the real backend. */
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

  const password = useMutation({
    mutationFn: ({ email, pwd }: { email: string; pwd: string }) => authApi.login(email, pwd),
    onSuccess,
    onError: (e) => toast.error(e instanceof ApiRequestError ? e.message : "Sign-in failed"),
  });

  return {
    signInWithGoogle: (idToken: string) => google.mutate(idToken),
    signInWithPassword: (email: string, pwd: string) => password.mutate({ email, pwd }),
    isPending: google.isPending || password.isPending,
    error: (google.error ?? password.error) as unknown,
  };
}
