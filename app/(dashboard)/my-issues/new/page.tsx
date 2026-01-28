"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Lock,
  Users,
  Heart,
  Send,
  Paperclip,
  X,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { cn } from "@/lib/utils";

// Types
type IssueType = "Conflict" | "Concern" | "Policy Question" | "Other";
type IssueVisibility = "hr_only" | "hr_manager";

interface IssueTypeOption {
  value: IssueType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const issueTypes: IssueTypeOption[] = [
  {
    value: "Concern",
    label: "Share a Concern",
    description: "Something on your mind that you'd like to discuss",
    icon: <Heart className="h-5 w-5" />,
    color: "text-primary",
  },
  {
    value: "Conflict",
    label: "Workplace Conflict",
    description: "A situation with a colleague that needs support",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-warning",
  },
  {
    value: "Policy Question",
    label: "Policy Question",
    description: "Need clarification on company policies or benefits",
    icon: <HelpCircle className="h-5 w-5" />,
    color: "text-accent",
  },
  {
    value: "Other",
    label: "Something Else",
    description: "Anything else you'd like to discuss with HR",
    icon: <MessageCircle className="h-5 w-5" />,
    color: "text-foreground-muted",
  },
];

interface VisibilityOption {
  value: IssueVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const visibilityOptions: VisibilityOption[] = [
  {
    value: "hr_only",
    label: "Only HR",
    description: "This stays between you and the HR team",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "hr_manager",
    label: "HR + My Manager",
    description: "Include your manager in this conversation",
    icon: <Users className="h-4 w-4" />,
  },
];

export default function RaiseIssuePage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"type" | "form" | "success">("type");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [issueType, setIssueType] = React.useState<IssueType | null>(null);
  const [visibility, setVisibility] = React.useState<IssueVisibility>("hr_only");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: IssueType) => {
    setIssueType(type);
    setStep("form");
  };

  const handleBack = () => {
    if (step === "form") {
      setStep("type");
    } else {
      router.push("/my-issues");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setStep("success");
  };

  const canSubmit = title.trim().length >= 5 && description.trim().length >= 10;

  return (
    <StaggerContainer className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {step === "success" ? "Message Sent" : "Talk to HR"}
            </h1>
            <p className="text-sm text-foreground-muted">
              {step === "type" && "What would you like to discuss?"}
              {step === "form" && "Take your time. We're here to listen."}
              {step === "success" && "We've received your message"}
            </p>
          </div>
        </div>
      </StaggerItem>

      <AnimatePresence mode="wait">
        {/* Step 1: Choose Type */}
        {step === "type" && (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Privacy Assurance */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-muted/30 border border-primary/10">
              <div className="p-2 rounded-lg bg-primary-muted">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  This is a safe space
                </p>
                <p className="text-sm text-foreground-muted">
                  What you share here is confidential. Only you and HR will have access.
                </p>
              </div>
            </div>

            {/* Issue Type Selection */}
            <div className="space-y-3">
              {issueTypes.map((type, index) => (
                <motion.div
                  key={type.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/30 hover:bg-card-hover transition-all"
                    onClick={() => handleTypeSelect(type.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl bg-secondary",
                          type.color
                        )}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">
                            {type.label}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Supportive Message */}
            <div className="text-center pt-4">
              <p className="text-sm text-foreground-muted">
                Not sure where to start? Choose "Something Else" and just tell us what's on your mind.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 2: Form */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Type Indicator */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <span className={cn(
                  "p-2 rounded-lg bg-secondary",
                  issueTypes.find(t => t.value === issueType)?.color
                )}>
                  {issueTypes.find(t => t.value === issueType)?.icon}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {issueTypes.find(t => t.value === issueType)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="ml-auto text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Visibility Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4 text-foreground-muted" />
                  Who should see this?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisibility(option.value)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        visibility === option.value
                          ? "border-primary bg-primary-muted/30"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          visibility === option.value ? "text-primary" : "text-foreground-muted"
                        )}>
                          {option.icon}
                        </span>
                        <span className={cn(
                          "text-sm font-medium",
                          visibility === option.value ? "text-primary" : "text-foreground"
                        )}>
                          {option.label}
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A brief summary of what you'd like to discuss..."
                  className="text-base"
                />
                <p className="text-xs text-foreground-muted">
                  This helps HR understand at a glance
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Your message
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share what's on your mind. Take your time — there's no pressure to be perfect."
                  rows={6}
                  className="text-base resize-none"
                />
                <p className="text-xs text-foreground-muted">
                  Write as much or as little as you need
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-foreground-muted" />
                  Attachments
                  <span className="text-foreground-muted font-normal">(optional)</span>
                </label>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                      >
                        <FileText className="h-4 w-4 text-foreground-muted" />
                        <span className="text-sm text-foreground flex-1 truncate">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-secondary rounded"
                        >
                          <X className="h-4 w-4 text-foreground-muted" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Paperclip className="h-4 w-4" />
                  Add file
                </Button>
              </div>

              {/* Privacy Reminder */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 text-sm">
                <Shield className="h-4 w-4 text-foreground-muted mt-0.5 shrink-0" />
                <p className="text-foreground-muted">
                  {visibility === "hr_only"
                    ? "Only the HR team will see this message. Your manager will not have access."
                    : "The HR team and your manager will be able to see this message."}
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Send className="h-4 w-4" />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send to HR
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex p-4 rounded-full bg-success-muted mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-success" />
            </motion.div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
              We've received your message
            </h2>
            <p className="text-foreground-muted mb-2 max-w-sm mx-auto">
              Thank you for reaching out. Our HR team will review your message and respond as soon as possible.
            </p>
            <p className="text-sm text-foreground-subtle mb-8">
              You'll receive a notification when HR replies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/my-issues">
                <Button>
                  View My Conversations
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Reassurance */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
                <Heart className="h-4 w-4 text-primary" />
                <span>We're here for you</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StaggerContainer>
  );
}
