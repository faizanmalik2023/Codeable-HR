"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CalendarCheck, FileText, Wallet } from "lucide-react";
import { BlurText } from "@/components/animations/blur-text";
import { FadeIn } from "@/components/animations/fade-in";
import { GoogleButton } from "@/components/auth/google-button";
import { useLogin } from "./use-login";

/* What the product actually does, in the order a new hire meets it. Kept to three —
 * a longer list reads as a feature dump and pushes the sign-in button below the fold
 * on a laptop. */
const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Leaves, attendance and holidays in one place" },
  { icon: FileText, text: "End-of-day reports your manager actually sees" },
  { icon: Wallet, text: "Payslips, claims and reimbursements without the email chase" },
];

export default function LoginPage() {
  const { signInWithGoogle, isPending } = useLogin();

  return (
    /* Split panel: the brand half carries the story, the sign-in half carries the one
     * button. Below `lg` the brand half is dropped rather than stacked — on a phone it
     * would push the button off-screen to say things nobody reads on the way to work. */
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div
        className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14"
        style={{
          backgroundImage:
            "linear-gradient(135deg, hsl(var(--hero-from)) 0%, hsl(var(--hero-to)) 100%)",
        }}
      >
        {/* Same rotated-emblem motif as the dashboard hero, so the first screen and the
            one behind it read as the same product. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 w-[34rem] max-w-none rotate-12 opacity-[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />

        <FadeIn delay={0} direction="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" alt="Codeable" className="h-8 w-auto" />
        </FadeIn>

        <div className="relative mt-auto max-w-lg">
          <h2 className="font-heading text-4xl font-bold leading-[1.1] xl:text-5xl">
            <BlurText text="Run your workday from here." delay={0.15} />
          </h2>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <FadeIn key={text} delay={0.5 + i * 0.1} direction="right" distance={16}>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[15px] leading-relaxed text-white/85">{text}</span>
                </li>
              </FadeIn>
            ))}
          </ul>
        </div>

        <p className="relative mt-auto pt-12 text-xs text-white/50">
          © {new Date().getFullYear()} Codeable
        </p>
      </div>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6 lg:min-h-0">
        {/* The watermark only earns its place on the single-column phone layout, where
            the brand panel is gone. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-blue.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-16 w-[36rem] max-w-none rotate-12 opacity-[0.04] lg:hidden dark:opacity-[0.06] dark:brightness-0 dark:invert"
        />

        {/* 20rem = the 320px Google renders its button at. Matching the column to it
            keeps one left edge down the whole panel instead of a centred button
            floating inside left-aligned copy. */}
        <div className="relative w-full max-w-[20rem]">
          <FadeIn delay={0.1} className="mb-8">
            <motion.div
              className="mb-6 inline-flex lg:hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-blue.svg"
                alt="Codeable"
                className="h-10 w-auto dark:brightness-0 dark:invert"
              />
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-2 text-foreground-muted">
              Sign in with your Codeable Google account to continue.
            </p>
          </FadeIn>

          <FadeIn delay={0.25}>
            {/* Google is the only way in — same as the mobile app. */}
            <GoogleButton onCredential={signInWithGoogle} disabled={isPending} />
            <p className="mt-4 text-sm text-foreground-subtle">
              Signing in never posts anything to your Google account.
            </p>

            <div className="my-8 h-px bg-border" />

            <p className="text-sm text-foreground-muted">
              No account yet? Your HR team creates it — ask them to add you, then sign in
              here with the same work address.
            </p>
          </FadeIn>

          <p className="mt-10 text-xs text-foreground-subtle">
            By continuing you agree to CodeableHR&apos;s Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
