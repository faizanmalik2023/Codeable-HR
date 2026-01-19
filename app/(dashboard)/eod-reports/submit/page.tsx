"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WritingArea, AutosaveIndicator, HoursInput, EODStatusBadge } from "@/components/eod";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate } from "@/lib/utils";

// Mock projects data
const projects = [
  { value: "codeablehr", label: "CodeableHR", description: "Internal HR Platform" },
  { value: "client-portal", label: "Client Portal", description: "Customer Dashboard" },
  { value: "internal", label: "Internal Work", description: "Meetings, reviews, etc." },
  { value: "other", label: "Other", description: "Miscellaneous tasks" },
];

// Initial form state
const initialFormState = {
  summary: "",
  project: "",
  hours: 8,
  blockers: "",
  tomorrowPlan: "",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function SubmitEODPage() {
  const router = useRouter();
  const today = new Date();

  // Form state
  const [formData, setFormData] = React.useState(initialFormState);
  const [showOptionalFields, setShowOptionalFields] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Determine EOD status
  const eodStatus = formData.summary.trim() ? "draft" : "not_started";

  // Track changes for autosave
  React.useEffect(() => {
    const hasAnyContent = !!(formData.summary.trim() || formData.project || formData.blockers.trim() || formData.tomorrowPlan.trim());
    setHasChanges(hasAnyContent);
  }, [formData]);

  // Autosave effect
  React.useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(async () => {
      setSaveStatus("saving");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSaveStatus("saved");
      setLastSaved(new Date());

      // Reset to idle after showing saved
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, hasChanges]);

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.summary.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Redirect to history or show success
    router.push("/eod-reports/history");
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    setSaveStatus("saving");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaveStatus("saved");
    setLastSaved(new Date());
  };

  const isValid = formData.summary.trim().length > 0 && formData.project;

  return (
    <StaggerContainer className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <StaggerItem>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/eod-reports">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  Today's EOD
                </h1>
                <EODStatusBadge status={eodStatus} size="sm" />
              </div>
              <p className="text-sm text-foreground-muted">
                {formatDate(today)} · {today.toLocaleDateString("en-US", { weekday: "long" })}
              </p>
            </div>
          </div>

          <AutosaveIndicator status={saveStatus} lastSaved={lastSaved} />
        </div>
      </StaggerItem>

      {/* Motivational prompt */}
      <StaggerItem>
        <motion.div
          className="flex items-center gap-3 p-4 rounded-xl bg-primary-muted/30 border border-primary/10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-foreground-muted">
            Take a moment to reflect on your day. What did you accomplish? What did you learn?
          </p>
        </motion.div>
      </StaggerItem>

      {/* Main Writing Area */}
      <StaggerItem>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="summary" className="text-base">
              What did you work on today?
            </Label>
            <span className="text-xs text-foreground-subtle">Required</span>
          </div>
          <WritingArea
            value={formData.summary}
            onChange={(value) => setFormData({ ...formData, summary: value })}
            placeholder="Today I worked on...

• Completed the dashboard UI components
• Fixed a critical bug in the auth flow
• Attended the sprint planning meeting

Feel free to write in your own style - bullet points, paragraphs, or however works best for you."
            minHeight={200}
            maxHeight={400}
          />
        </div>
      </StaggerItem>

      {/* Project & Hours Row */}
      <StaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Select */}
          <div className="space-y-3">
            <Label>Project / Client</Label>
            <Select
              value={formData.project}
              onChange={(value) => setFormData({ ...formData, project: value })}
              options={projects}
              placeholder="Select a project"
            />
          </div>

          {/* Hours Input */}
          <Card className="p-5">
            <Label className="mb-4 block">Hours Worked</Label>
            <HoursInput
              value={formData.hours}
              onChange={(value) => setFormData({ ...formData, hours: value })}
              min={0}
              max={12}
              step={0.5}
            />
          </Card>
        </div>
      </StaggerItem>

      {/* Optional Fields Toggle */}
      <StaggerItem>
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {showOptionalFields ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showOptionalFields ? "Hide" : "Show"} optional fields
        </button>
      </StaggerItem>

      {/* Optional Fields */}
      <AnimatePresence>
        {showOptionalFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 overflow-visible"
          >
            {/* Blockers */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="blockers">Blockers</Label>
                <span className="text-xs text-foreground-subtle px-2 py-0.5 bg-secondary rounded-full">
                  Optional
                </span>
              </div>
              <Textarea
                id="blockers"
                value={formData.blockers}
                onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                placeholder="Any blockers or challenges you faced? This helps your team understand what support you might need."
                className="min-h-[100px]"
              />
            </div>

            {/* Tomorrow's Plan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="tomorrowPlan">Tomorrow's Plan</Label>
                <span className="text-xs text-foreground-subtle px-2 py-0.5 bg-secondary rounded-full">
                  Optional
                </span>
              </div>
              <Textarea
                id="tomorrowPlan"
                value={formData.tomorrowPlan}
                onChange={(e) => setFormData({ ...formData, tomorrowPlan: e.target.value })}
                placeholder="What do you plan to work on tomorrow? This helps with continuity and planning."
                className="min-h-[100px]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!hasChanges || isSubmitting}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>

          <div className="flex items-center gap-3">
            {!isValid && formData.summary.trim() && (
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                <span>Select a project</span>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              size="lg"
              className="gap-2 min-w-[140px]"
            >
              {!isSubmitting && (
                <>
                  <Send className="h-4 w-4" />
                  Submit EOD
                </>
              )}
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* Submit warning */}
      <StaggerItem>
        <p className="text-xs text-center text-foreground-subtle">
          Once submitted, your EOD will be visible to your manager and cannot be edited.
        </p>
      </StaggerItem>
    </StaggerContainer>
  );
}
