"use client";

import * as React from "react";
import { KeyRound, Plug } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTicketingStore } from "@/stores/ticketing-store";
import { getMyFeatures } from "@/lib/ticketing/client";

// Shown on ticketing pages when no PAT is connected yet. The token is
// verified against the ticketing backend before being stored.
export function TicketingConnectCard() {
  const { connect, setFeatures } = useTicketingStore();
  const [token, setToken] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConnect = async () => {
    const pat = token.trim();
    if (!pat) return;
    setChecking(true);
    setError(null);
    try {
      const data = await getMyFeatures(pat);
      connect(pat);
      setFeatures({
        features: data.features || [],
        isFeatureAdmin: !!data.isFeatureAdmin,
        email: data.email || null,
      });
    } catch (err: any) {
      setError(
        err?.status === 401
          ? "That token was rejected — check it hasn't been revoked."
          : err?.message || "Could not reach the ticketing server."
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          Connect to Codeable Tickets
        </CardTitle>
        <CardDescription>
          Paste your ticketing access token to use engineering tools here. Ask
          an admin to mint one for you (<code className="text-xs">npm run create-token</code>{" "}
          on the ticketing server).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          placeholder="cdbl_pat_…"
          icon={<KeyRound className="h-4 w-4" />}
          error={error || undefined}
        />
        <div className="flex justify-end">
          <Button onClick={handleConnect} disabled={checking || !token.trim()}>
            {checking ? "Verifying…" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
