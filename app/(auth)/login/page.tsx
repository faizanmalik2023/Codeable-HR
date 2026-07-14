"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { AuroraBackground } from "@/components/animations/aurora-background";
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
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) signInWithPassword(email, password);
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <FadeIn delay={0} className="mb-8 text-center">
            <motion.div
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/codeable-emblem-white.svg" alt="Codeable" className="h-8 w-auto" />
            </motion.div>
            <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
              <BlurText text="Welcome to CodeableHR" delay={0.2} />
            </h1>
            <p className="text-foreground-muted">Sign in to continue to your workspace</p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="glass-strong rounded-[var(--radius-xl)] border border-border p-6 shadow-lg">
              <div className="space-y-4">
                <GoogleButton onCredential={signInWithGoogle} disabled={isPending} />

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-foreground-subtle">
                    {showPasswordForm ? "or use email" : "or"}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {showPasswordForm ? (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      icon={<Mail className="h-4 w-4" />}
                      autoComplete="email"
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Lock className="h-4 w-4" />}
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="submit" className="w-full" isLoading={isPending}>
                      Sign in
                    </Button>
                  </form>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Sign in with email
                  </Button>
                )}
              </div>
            </div>
          </FadeIn>

          <p className="mt-6 text-center text-xs text-foreground-subtle">
            By continuing you agree to CodeableHR&apos;s Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </AuroraBackground>
  );
}
