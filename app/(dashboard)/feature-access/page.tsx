"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Shield, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { useTicketing } from "@/lib/ticketing/use-ticketing";
import { TicketingConnectCard } from "@/components/ticketing/connect-card";
import { getGrants, grantAccess, revokeAccess } from "@/lib/ticketing/client";

interface Grant {
  id: string;
  email: string;
  feature: string;
  grantedBy: string;
  grantedAt: string;
  user: { uid: string; name: string; avatar?: string } | null;
}

export default function FeatureAccessPage() {
  const ticketing = useTicketing();

  const [admins, setAdmins] = React.useState<string[]>([]);
  const [grants, setGrants] = React.useState<Grant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [granting, setGranting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<Grant | null>(null);
  const [revoking, setRevoking] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!ticketing.pat) return;
    try {
      const data = await getGrants(ticketing.pat);
      setAdmins(data.admins || []);
      setGrants(data.grants || []);
    } catch (err) {
      console.error("Failed to load grants:", err);
    } finally {
      setLoading(false);
    }
  }, [ticketing.pat]);

  React.useEffect(() => {
    if (ticketing.isFeatureAdmin) load();
  }, [ticketing.isFeatureAdmin, load]);

  const handleGrant = async () => {
    if (!ticketing.pat || !email.includes("@")) return;
    setGranting(true);
    setError(null);
    try {
      await grantAccess(ticketing.pat, email.trim());
      setEmail("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to grant access.");
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async () => {
    if (!ticketing.pat || !revokeTarget) return;
    setRevoking(true);
    try {
      await revokeAccess(ticketing.pat, revokeTarget.id);
      setGrants((prev) => prev.filter((g) => g.id !== revokeTarget.id));
      setRevokeTarget(null);
    } catch (err: any) {
      setError(err?.message || "Failed to revoke access.");
    } finally {
      setRevoking(false);
    }
  };

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
  if (!ticketing.featuresLoaded || (ticketing.isFeatureAdmin && loading)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }
  if (!ticketing.isFeatureAdmin) {
    return (
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <PageHeader />
        </StaggerItem>
        <StaggerItem>
          <EmptyState
            icon={ShieldAlert}
            title="Admins only"
            description="Feature access is managed by ticketing workspace admins."
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

      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admins · full access
            </CardTitle>
            <CardDescription>
              Fixed allowlist — always see ticket generation and velocity stats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {admins.map((adminEmail) => (
                <Badge key={adminEmail} variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {adminEmail}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card>
          <CardHeader>
            <CardTitle>Ticket generation access</CardTitle>
            <CardDescription>
              People granted here see “Generate Tickets” in their sidebar.
              Velocity stats stay admin-only and can’t be granted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex max-w-md gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGrant()}
                placeholder="teammate@gocodeable.com"
                error={error || undefined}
              />
              <Button
                onClick={handleGrant}
                disabled={granting || !email.includes("@")}
                className="shrink-0 gap-2"
              >
                <Plus className="h-4 w-4" />
                {granting ? "Granting…" : "Grant"}
              </Button>
            </div>

            {grants.length === 0 ? (
              <EmptyState
                title="No one has been granted access yet"
                description="Add a teammate’s email above — they’ll see Generate Tickets next time they load the app."
              />
            ) : (
              <div className="space-y-2">
                {grants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <Avatar
                      name={grant.user?.name || grant.email}
                      src={grant.user?.avatar}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {grant.user?.name || grant.email}
                      </p>
                      <p className="truncate text-xs text-foreground-muted">
                        {grant.email} · granted by {grant.grantedBy}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTarget(grant)}
                      className="gap-1.5 text-foreground-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </StaggerItem>

      <ConfirmModal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke access?"
        description={`${revokeTarget?.email} will no longer see Generate Tickets.`}
        confirmLabel="Revoke"
        variant="destructive"
        isLoading={revoking}
      />
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
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Feature Access</h1>
        <p className="text-sm text-foreground-muted">
          Control who can generate tickets from SRS documents
        </p>
      </div>
    </div>
  );
}
