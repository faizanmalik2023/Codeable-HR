"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, landingForRole, type UserRole } from "@/stores/auth-store";
import { profileApi } from "@/lib/api/profile";
import { canAccessRoute } from "@/lib/access";
import type { ProfileModel, UserModel } from "@/types";

/** Map the `/profile` response onto the auth store's UserModel (keeps role fresh). */
function profileToUser(p: ProfileModel, prev: UserModel | null): UserModel {
  return {
    id: p.id ?? prev?.id ?? "",
    email: p.email ?? prev?.email ?? "",
    full_name: p.full_name ?? prev?.full_name ?? "",
    role: (typeof p.role === "string" ? p.role : prev?.role ?? "employee") as UserRole,
    avatar: p.avatar ?? null,
    status: p.status,
    employee_code: p.employee_code ?? undefined,
    is_manager: p.is_manager,
    employment: p.employment,
    phone: p.phone ?? undefined,
    dob: p.dob ?? undefined,
    cnic: p.cnic ?? undefined,
    emergency_contact: p.emergency_contact ?? undefined,
  };
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

/**
 * Client-side guard for the dashboard shell:
 *  1. Waits for the persisted auth store to hydrate; redirects to /login if not authed.
 *  2. Refreshes the user's role/permissions from `/profile` on load so a stale
 *     persisted role (e.g. a since-demoted admin) can't unlock pages.
 *  3. Enforces per-route role access — an employee opening an HR/admin route is
 *     bounced to their landing page instead of seeing the shell.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // 1. Auth gate.
  React.useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/login");
  }, [hydrated, isAuthenticated, router]);

  // 2. Refresh the profile once we're authenticated (keeps role current).
  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.get(),
    enabled: hydrated && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  React.useEffect(() => {
    if (profileQuery.data) setUser(profileToUser(profileQuery.data, user));
    // Only react to freshly-fetched data; `user` is read fresh inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  const profileSettled = profileQuery.isFetched || profileQuery.isError;
  const allowed = canAccessRoute(pathname, user);

  // 3. Enforce route access once the (refreshed) role is settled.
  React.useEffect(() => {
    if (hydrated && isAuthenticated && profileSettled && user && !canAccessRoute(pathname, user)) {
      router.replace(landingForRole(user.role));
    }
  }, [hydrated, isAuthenticated, profileSettled, user, pathname, router]);

  // Hold the shell until we're hydrated, authed, and the role is confirmed —
  // prevents flashing an unauthorized page with a stale role.
  if (!hydrated || !isAuthenticated || !profileSettled) return <FullScreenLoader />;
  if (!allowed) return <FullScreenLoader />;

  return <>{children}</>;
}
