"use client";

import * as React from "react";
import { useTheme } from "next-themes";

/* Minimal typing for Google Identity Services. */
interface GoogleId {
  initialize: (config: {
    client_id: string;
    callback: (res: { credential: string }) => void;
  }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

interface GoogleButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

/**
 * Renders the official Google Sign-In button. Requires
 * `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (a Web-type OAuth client authorized for this
 * origin). Without it, shows a configuration hint instead.
 */
export function GoogleButton({ onCredential, disabled }: GoogleButtonProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [error, setError] = React.useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const cbRef = React.useRef(onCredential);
  React.useEffect(() => {
    cbRef.current = onCredential;
  }, [onCredential]);

  React.useEffect(() => {
    if (!clientId) {
      setError("Google sign-in isn't configured yet (missing Web client ID).");
      return;
    }
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => cbRef.current(res.credential),
        });
        ref.current.innerHTML = "";
        window.google.accounts.id.renderButton(ref.current, {
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
      })
      .catch(() => setError("Couldn't load Google sign-in. Check your connection."));
    return () => {
      cancelled = true;
    };
  }, [clientId, resolvedTheme]);

  if (error) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-secondary/40 px-4 py-3 text-center text-sm text-foreground-muted">
        {error}
      </div>
    );
  }

  return (
    <div
      className="flex justify-center"
      style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}
    >
      {/* Google renders its button in an iframe that it deliberately overflows past
          its own wrapper (`margin: -2px -10px`), expecting the wrapper to clip it —
          but it never sets `overflow`, so the iframe's white page shows as a hard
          rectangle around the pill. Invisible on a white page; on the dark theme it's
          a white border round the button. Clip it here, matched to the pill's radius.
          Targeted as "the child Google renders" rather than by its class, which is
          minified and not ours to depend on. */}
      <div ref={ref} className="[&>div]:overflow-hidden [&>div]:rounded-full" />
    </div>
  );
}
