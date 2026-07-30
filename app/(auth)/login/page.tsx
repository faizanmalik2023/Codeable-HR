"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BlurText } from "@/components/animations/blur-text";
import { FadeIn } from "@/components/animations/fade-in";
import { GoogleButton } from "@/components/auth/google-button";
import { useLogin } from "./use-login";

export default function LoginPage() {
  const { signInWithGoogle, isPending } = useLogin();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Faint rotated emblem watermark (mobile BackgroundDecor motif) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-blue.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-16 w-[42rem] max-w-none rotate-12 opacity-[0.04] dark:opacity-[0.06] dark:brightness-0 dark:invert"
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <FadeIn delay={0} className="mb-8 text-center">
            <motion.div
              className="mb-6 inline-flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-blue.svg"
                alt="Codeable"
                className="h-12 w-auto dark:brightness-0 dark:invert"
              />
            </motion.div>
            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
              <BlurText text="Welcome back" delay={0.2} />
            </h1>
            <p className="text-foreground-muted">
              Your HR, leaves &amp; reports — all in one place
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-8 shadow-[var(--shadow-md)]">
              {/* Google is the only way in — same as the mobile app. */}
              <GoogleButton onCredential={signInWithGoogle} disabled={isPending} />
              <p className="mt-4 text-center text-sm text-foreground-muted">
                Sign in with your Codeable Google account
              </p>
            </div>
          </FadeIn>

          <p className="mt-6 text-center text-xs text-foreground-subtle">
            By continuing you agree to CodeableHR&apos;s Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
