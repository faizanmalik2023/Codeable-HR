"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { BlurText } from "@/components/animations/blur-text";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/google-button";
import { useLogin } from "./use-login";

export default function LoginPage() {
  const { signInWithGoogle, signInWithPassword, isPending } = useLogin();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) signInWithPassword(email, password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Faint rotated emblem watermark (mobile BackgroundDecor motif) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/codeable-emblem.svg"
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
                src="/codeable-emblem.svg"
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      className="pr-11"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
                  Sign in
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-foreground-muted">or</span>
                </div>
              </div>

              {/* Google sign-in (matches the mobile app's Google-only login) */}
              <GoogleButton onCredential={signInWithGoogle} disabled={isPending} />
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
