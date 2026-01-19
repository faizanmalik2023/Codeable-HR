"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, AlertCircle, User, Shield, Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraBackground } from "@/components/animations/aurora-background";
import { BlurText } from "@/components/animations/blur-text";
import { FadeIn } from "@/components/animations/fade-in";
import { Button } from "@/components/ui/button";
import { useAuthStore, demoUsers } from "@/stores/auth-store";

// Demo accounts for different roles
const demoAccounts = [
  {
    role: "Employee",
    email: "employee@codeable.com",
    password: "password",
    description: "View personal dashboard, submit EODs, apply for leaves",
    icon: User,
    color: "text-primary",
    bgColor: "bg-primary-muted",
  },
  {
    role: "Manager",
    email: "manager@codeable.com",
    password: "password",
    description: "Manage team, approve leaves, review EODs",
    icon: Users,
    color: "text-success",
    bgColor: "bg-success-muted",
  },
  {
    role: "HR",
    email: "hr@codeable.com",
    password: "password",
    description: "Company-wide HR management and policies",
    icon: Briefcase,
    color: "text-warning",
    bgColor: "bg-warning-muted",
  },
  {
    role: "Admin",
    email: "admin@codeable.com",
    password: "password",
    description: "Full system access and configuration",
    icon: Shield,
    color: "text-accent",
    bgColor: "bg-accent-muted",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check against demo accounts
    const matchedAccount = demoAccounts.find(
      (acc) => acc.email === email && acc.password === password
    );

    if (matchedAccount) {
      // Get the user data and log them in
      const user = demoUsers[matchedAccount.email];
      if (user) {
        login(user);
      }
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Use one of the demo accounts below.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the user data and log them in
    const user = demoUsers[account.email];
    if (user) {
      login(user);
    }
    router.push("/dashboard");
  };

  return (
    <AuroraBackground>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Welcome */}
          <FadeIn delay={0} className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              <BlurText text="Welcome back" delay={0.2} />
            </h1>
            <p className="text-foreground-muted">
              <BlurText text="Sign in to your CodeableHR account" delay={0.4} />
            </p>
          </FadeIn>

          {/* Login Card */}
          <FadeIn delay={0.3}>
            <motion.div
              className="glass-strong rounded-2xl border border-border/50 p-8 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-destructive-muted border border-destructive/20"
                    >
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                        focusedField === "email"
                          ? "text-primary"
                          : "text-foreground-muted"
                      )}
                    >
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@company.com"
                      required
                      className={cn(
                        "w-full h-12 pl-12 pr-4 rounded-xl border bg-background/50 text-foreground",
                        "placeholder:text-foreground-subtle",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        focusedField === "email"
                          ? "border-primary shadow-sm"
                          : "border-border"
                      )}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={false}
                      animate={{
                        boxShadow:
                          focusedField === "email"
                            ? "0 0 0 4px hsl(var(--primary) / 0.1)"
                            : "0 0 0 0px hsl(var(--primary) / 0)",
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div
                      className={cn(
                        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                        focusedField === "password"
                          ? "text-primary"
                          : "text-foreground-muted"
                      )}
                    >
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      required
                      className={cn(
                        "w-full h-12 pl-12 pr-12 rounded-xl border bg-background/50 text-foreground",
                        "placeholder:text-foreground-subtle",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        focusedField === "password"
                          ? "border-primary shadow-sm"
                          : "border-border"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={false}
                      animate={{
                        boxShadow:
                          focusedField === "password"
                            ? "0 0 0 4px hsl(var(--primary) / 0.1)"
                            : "0 0 0 0px hsl(var(--primary) / 0)",
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="xl"
                  className="w-full relative overflow-hidden group"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {!isLoading && (
                    <>
                      <span>Sign in</span>
                      <motion.div
                        className="ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </>
                  )}
                  {/* Gradient overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary via-primary-hover to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ zIndex: -1 }}
                  />
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-foreground-muted">
                    Quick login as
                  </span>
                </div>
              </div>

              {/* Demo Account Selection */}
              <div className="grid grid-cols-2 gap-3">
                {demoAccounts.map((account, index) => {
                  const Icon = account.icon;
                  return (
                    <motion.button
                      key={account.role}
                      type="button"
                      onClick={() => handleQuickLogin(account)}
                      disabled={isLoading}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50",
                        "bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30",
                        "transition-all duration-200 text-center group",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn("p-2 rounded-lg", account.bgColor)}>
                        <Icon className={cn("w-5 h-5", account.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{account.role}</p>
                        <p className="text-xs text-foreground-muted leading-tight mt-0.5">
                          {account.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </FadeIn>

          {/* Footer */}
          <FadeIn delay={0.6} className="mt-8 text-center">
            <p className="text-sm text-foreground-muted">
              Built with care for the Codeable team
            </p>
          </FadeIn>
        </div>
      </div>
    </AuroraBackground>
  );
}
