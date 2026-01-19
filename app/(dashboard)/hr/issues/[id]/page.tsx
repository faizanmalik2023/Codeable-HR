"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  Lock,
  Globe,
  User,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate, cn } from "@/lib/utils";

// Types
type IssueStatus = "open" | "in_progress" | "resolved";
type MessageVisibility = "public" | "internal";

interface Message {
  id: string;
  author: {
    name: string;
    role: string;
    isHR: boolean;
  };
  content: string;
  visibility: MessageVisibility;
  createdAt: string;
}

interface IssueDetail {
  id: string;
  title: string;
  type: string;
  description: string;
  employee: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  status: IssueStatus;
  severity: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

// Mock data
const mockIssue: IssueDetail = {
  id: "1",
  title: "Workplace accommodation request",
  type: "Accommodation",
  description: "I would like to request a standing desk and ergonomic chair due to recurring back issues. My doctor has recommended these accommodations to help prevent further strain. I've attached the medical documentation for your review.",
  employee: { id: "emp1", name: "Alice Cooper", role: "Senior Developer", department: "Engineering" },
  status: "open",
  severity: "medium",
  createdAt: "2024-01-18T10:00:00",
  updatedAt: "2024-01-20T14:30:00",
  messages: [
    {
      id: "m1",
      author: { name: "Alice Cooper", role: "Senior Developer", isHR: false },
      content: "I would like to request a standing desk and ergonomic chair due to recurring back issues. My doctor has recommended these accommodations to help prevent further strain.",
      visibility: "public",
      createdAt: "2024-01-18T10:00:00",
    },
    {
      id: "m2",
      author: { name: "Emily HR", role: "HR Business Partner", isHR: true },
      content: "Hi Alice, thank you for reaching out. I'm sorry to hear about your back issues. We absolutely want to support you. Could you please share the medical documentation so we can process this request?",
      visibility: "public",
      createdAt: "2024-01-18T14:30:00",
    },
    {
      id: "m3",
      author: { name: "Emily HR", role: "HR Business Partner", isHR: true },
      content: "Internal note: Checked with facilities - we have standing desks in stock. Ergonomic chairs need to be ordered, ~2 week lead time. Budget approved under ADA accommodations.",
      visibility: "internal",
      createdAt: "2024-01-19T09:00:00",
    },
    {
      id: "m4",
      author: { name: "Alice Cooper", role: "Senior Developer", isHR: false },
      content: "I've uploaded the documentation to the secure portal. Please let me know if you need anything else.",
      visibility: "public",
      createdAt: "2024-01-20T14:30:00",
    },
  ],
};

const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-destructive", bg: "bg-destructive-muted", icon: <AlertCircle className="h-4 w-4" /> },
  in_progress: { label: "In Progress", color: "text-warning", bg: "bg-warning-muted", icon: <Clock className="h-4 w-4" /> },
  resolved: { label: "Resolved", color: "text-success", bg: "bg-success-muted", icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function IssueDetailPage() {
  const params = useParams();
  const [issue, setIssue] = React.useState<IssueDetail>(mockIssue);
  const [newMessage, setNewMessage] = React.useState("");
  const [messageVisibility, setMessageVisibility] = React.useState<MessageVisibility>("public");
  const [isSending, setIsSending] = React.useState(false);
  const [isChangingStatus, setIsChangingStatus] = React.useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    await new Promise((r) => setTimeout(r, 800));

    const message: Message = {
      id: `m${Date.now()}`,
      author: { name: "Emily HR", role: "HR Business Partner", isHR: true },
      content: newMessage,
      visibility: messageVisibility,
      createdAt: new Date().toISOString(),
    };

    setIssue((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
      updatedAt: new Date().toISOString(),
    }));

    setNewMessage("");
    setIsSending(false);
  };

  const handleStatusChange = async (newStatus: IssueStatus) => {
    setIsChangingStatus(true);
    await new Promise((r) => setTimeout(r, 500));

    setIssue((prev) => ({
      ...prev,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }));

    setIsChangingStatus(false);
  };

  const publicMessages = issue.messages.filter((m) => m.visibility === "public");
  const internalMessages = issue.messages.filter((m) => m.visibility === "internal");

  return (
    <StaggerContainer className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-start gap-4">
          <Link href="/hr/issues">
            <Button variant="ghost" size="icon" className="rounded-full mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  {issue.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{issue.type}</Badge>
                  <Badge className={cn(statusConfig[issue.status].bg, statusConfig[issue.status].color)}>
                    {statusConfig[issue.status].label}
                  </Badge>
                  <span className="text-sm text-foreground-muted">
                    Opened {formatDate(new Date(issue.createdAt))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* Employee Info & Status Controls */}
      <StaggerItem>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={issue.employee.name} size="md" />
                <div>
                  <p className="font-medium text-foreground">{issue.employee.name}</p>
                  <p className="text-sm text-foreground-muted">
                    {issue.employee.role} · {issue.employee.department}
                  </p>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-muted mr-2">Status:</span>
                {(["open", "in_progress", "resolved"] as IssueStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={issue.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    disabled={isChangingStatus || issue.status === status}
                    className={cn(
                      issue.status === status && statusConfig[status].bg,
                      issue.status === status && statusConfig[status].color
                    )}
                  >
                    {statusConfig[status].label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </StaggerItem>

      {/* Thread View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Thread (Public) */}
        <StaggerItem className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Conversation</CardTitle>
                <span className="text-xs text-foreground-muted">
                  (visible to employee)
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {publicMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl",
                      message.author.isHR ? "bg-primary-muted/30 ml-4" : "bg-secondary/50 mr-4"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={message.author.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground text-sm">
                            {message.author.name}
                          </span>
                          {message.author.isHR && (
                            <Badge variant="muted" className="text-xs">HR</Badge>
                          )}
                          <span className="text-xs text-foreground-subtle">
                            {formatDate(new Date(message.createdAt))}
                          </span>
                        </div>
                        <p className="text-foreground text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="pt-4 border-t border-border">
                <div className="space-y-3">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a reply to the employee..."
                    className="min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={messageVisibility === "public" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageVisibility("public")}
                        className="gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        Public
                      </Button>
                      <Button
                        variant={messageVisibility === "internal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageVisibility("internal")}
                        className="gap-1"
                      >
                        <Lock className="h-3 w-3" />
                        Internal
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      isLoading={isSending}
                      className="gap-2"
                    >
                      {!isSending && (
                        <>
                          <Send className="h-4 w-4" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  {messageVisibility === "internal" && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      This message will only be visible to HR team members
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Internal Notes Sidebar */}
        <StaggerItem>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-warning" />
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </div>
              <p className="text-xs text-foreground-muted">
                HR eyes only - not visible to employee
              </p>
            </CardHeader>
            <CardContent>
              {internalMessages.length > 0 ? (
                <div className="space-y-3">
                  {internalMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-lg bg-warning-muted/20 border border-warning/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar name={message.author.name} size="xs" />
                        <span className="text-xs font-medium text-foreground">
                          {message.author.name}
                        </span>
                        <span className="text-xs text-foreground-subtle">
                          {formatDate(new Date(message.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {message.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground-muted">
                  <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No internal notes yet</p>
                  <p className="text-xs">
                    Add notes that only HR can see
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution History */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="text-sm text-foreground">Issue opened</p>
                    <p className="text-xs text-foreground-muted">
                      {formatDate(new Date(issue.createdAt))}
                    </p>
                  </div>
                </div>
                {issue.status !== "open" && (
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      issue.status === "in_progress" ? "bg-warning" : "bg-success"
                    )} />
                    <div>
                      <p className="text-sm text-foreground">
                        Status changed to {statusConfig[issue.status].label}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatDate(new Date(issue.updatedAt))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </StaggerContainer>
  );
}
