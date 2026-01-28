"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Lock,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  X,
  MoreHorizontal,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, cn } from "@/lib/utils";

// Types
type IssueStatus = "open" | "in_progress" | "resolved";
type IssueType = "Conflict" | "Concern" | "Policy Question" | "Other";
type IssueVisibility = "hr_only" | "hr_manager";

interface Message {
  id: string;
  sender: {
    name: string;
    role: "employee" | "hr";
    avatar?: string;
  };
  content: string;
  createdAt: string;
  attachments?: { name: string; size: string }[];
}

interface IssueDetail {
  id: string;
  title: string;
  type: IssueType;
  visibility: IssueVisibility;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

// Mock data
const mockIssue: IssueDetail = {
  id: "1",
  title: "Question about remote work policy",
  type: "Policy Question",
  visibility: "hr_only",
  status: "in_progress",
  createdAt: "2024-01-15T10:00:00",
  updatedAt: "2024-01-20T14:30:00",
  messages: [
    {
      id: "m1",
      sender: { name: "You", role: "employee" },
      content: "Hi, I wanted to ask about the remote work policy. I'm planning to work from another city for a few weeks next month to be closer to family. Is this allowed under our current policy? I want to make sure I follow the proper process.",
      createdAt: "2024-01-15T10:00:00",
    },
    {
      id: "m2",
      sender: { name: "Sarah Chen", role: "hr", avatar: "/avatars/sarah.jpg" },
      content: "Hi! Thanks for reaching out about this. Yes, our policy does allow for temporary remote work from different locations. There are a few things to keep in mind:\n\n1. Please notify your manager at least 2 weeks in advance\n2. Ensure you have reliable internet access\n3. Be available during core hours (10am-3pm in your home timezone)\n\nWould you like me to send you the full remote work guidelines document?",
      createdAt: "2024-01-16T09:30:00",
    },
    {
      id: "m3",
      sender: { name: "You", role: "employee" },
      content: "That's really helpful, thank you! Yes, please send the guidelines. Also, do I need to fill out any formal request form?",
      createdAt: "2024-01-16T14:15:00",
    },
    {
      id: "m4",
      sender: { name: "Sarah Chen", role: "hr", avatar: "/avatars/sarah.jpg" },
      content: "Thanks for clarifying. I've attached the updated policy document for your reference. For temporary relocations under 30 days, you don't need a formal request — just an email to your manager with the dates is sufficient.\n\nLet me know if you have any other questions!",
      createdAt: "2024-01-20T14:30:00",
      attachments: [
        { name: "Remote_Work_Policy_2024.pdf", size: "245 KB" },
      ],
    },
  ],
};

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: {
    label: "Waiting for response",
    color: "text-primary",
    bg: "bg-primary-muted",
    icon: <Clock className="h-4 w-4" />
  },
  in_progress: {
    label: "In conversation",
    color: "text-success",
    bg: "bg-success-muted",
    icon: <MessageSquare className="h-4 w-4" />
  },
  resolved: {
    label: "Resolved",
    color: "text-foreground-muted",
    bg: "bg-secondary",
    icon: <CheckCircle2 className="h-4 w-4" />
  },
};

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true);
  const [issue, setIssue] = React.useState<IssueDetail | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Load issue data
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIssue(mockIssue);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [params.id]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [issue?.messages, isLoading]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !issue) return;

    setIsSending(true);

    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 800));

    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: { name: "You", role: "employee" },
      content: replyText,
      createdAt: new Date().toISOString(),
    };

    setIssue({
      ...issue,
      messages: [...issue.messages, newMessage],
      status: "open", // Waiting for HR response now
    });

    setReplyText("");
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSendReply();
    }
  };

  if (isLoading) {
    return (
      <StaggerContainer className="space-y-6 max-w-3xl mx-auto">
        <StaggerItem>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-6 w-64" />
              <Skeleton variant="text" className="h-4 w-40" />
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton variant="circular" className="h-8 w-8" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="h-4 w-24" />
                  <Skeleton variant="default" className="h-24 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      </StaggerContainer>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">Issue not found</p>
        <Link href="/my-issues">
          <Button variant="ghost" className="mt-4">
            Go back
          </Button>
        </Link>
      </div>
    );
  }

  const isResolved = issue.status === "resolved";

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-border mb-4">
        <Link href="/my-issues">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground line-clamp-2">
            {issue.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm">
            <Badge variant="muted">{issue.type}</Badge>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs flex items-center gap-1",
              statusConfig[issue.status].bg,
              statusConfig[issue.status].color
            )}>
              {statusConfig[issue.status].icon}
              {statusConfig[issue.status].label}
            </span>
            <span className="text-foreground-subtle flex items-center gap-1">
              {issue.visibility === "hr_only" ? (
                <>
                  <Lock className="h-3 w-3" />
                  Only HR
                </>
              ) : (
                <>
                  <Users className="h-3 w-3" />
                  HR + Manager
                </>
              )}
            </span>
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowOptions(!showOptions)}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px] z-10"
              >
                {!isResolved && (
                  <button
                    onClick={() => {
                      setIssue({ ...issue, status: "resolved" });
                      setShowOptions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Mark as resolved
                  </button>
                )}
                <button
                  onClick={() => setShowOptions(false)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors text-foreground-muted"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Timestamp */}
        <div className="text-center">
          <span className="text-xs text-foreground-subtle bg-secondary/50 px-3 py-1 rounded-full">
            Started {formatDate(new Date(issue.createdAt))}
          </span>
        </div>

        {issue.messages.map((message, index) => {
          const isEmployee = message.sender.role === "employee";
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex gap-3",
                isEmployee && "flex-row-reverse"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "shrink-0",
                isEmployee ? "hidden sm:block" : ""
              )}>
                {isEmployee ? (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <Avatar name={message.sender.name} size="sm" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={cn(
                "flex flex-col max-w-[80%]",
                isEmployee ? "items-end" : "items-start"
              )}>
                {/* Sender info */}
                <div className={cn(
                  "flex items-center gap-2 mb-1",
                  isEmployee && "flex-row-reverse"
                )}>
                  <span className="text-sm font-medium text-foreground">
                    {message.sender.name}
                  </span>
                  {!isEmployee && (
                    <Badge variant="muted" className="text-xs py-0">
                      HR
                    </Badge>
                  )}
                  <span className="text-xs text-foreground-subtle">
                    {formatDate(new Date(message.createdAt))}
                  </span>
                </div>

                {/* Content */}
                <div className={cn(
                  "p-4 rounded-2xl whitespace-pre-wrap text-sm",
                  isEmployee
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-secondary rounded-tl-md"
                )}>
                  {message.content}
                </div>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className={cn(
                    "mt-2 space-y-1",
                    isEmployee && "items-end"
                  )}>
                    {message.attachments.map((attachment, i) => (
                      <button
                        key={i}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{attachment.name}</span>
                        <span className="text-foreground-subtle text-xs">{attachment.size}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      {!isResolved ? (
        <div className="pt-4 border-t border-border">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply..."
                rows={3}
                className="resize-none"
                disabled={isSending}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-foreground-subtle">
                  Press ⌘+Enter to send
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || isSending}
                    className="gap-2"
                  >
                    {isSending ? (
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
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-3 py-4 bg-success-muted/30 rounded-xl">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-foreground">
              This conversation has been resolved
            </span>
          </div>
          <p className="text-center text-sm text-foreground-muted mt-3">
            Need to follow up?{" "}
            <Link href="/my-issues/new" className="text-primary hover:underline">
              Start a new conversation
            </Link>
          </p>
        </div>
      )}

      {/* Privacy Footer */}
      <div className="flex items-center justify-center gap-2 py-3 mt-2 text-xs text-foreground-subtle">
        <Shield className="h-3 w-3" />
        <span>
          {issue.visibility === "hr_only"
            ? "This conversation is private between you and HR"
            : "This conversation is visible to you, HR, and your manager"}
        </span>
      </div>
    </div>
  );
}
