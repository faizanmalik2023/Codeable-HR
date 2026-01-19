"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  FileEdit,
  Search,
  Filter,
  ChevronDown,
  X,
  Briefcase,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StaggerContainer, StaggerItem } from "@/components/animations/fade-in";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Mock EOD data
const eodHistory = [
  {
    id: "1",
    date: "2024-01-17",
    status: "draft" as const,
    summary: "Working on the EOD reports module for CodeableHR. Implemented the submit page with autosave functionality and journal-like writing experience.",
    project: "CodeableHR",
    hours: 6.5,
    blockers: "",
    tomorrowPlan: "Complete the history page and add filtering.",
  },
  {
    id: "2",
    date: "2024-01-16",
    status: "submitted" as const,
    summary: "Completed the dashboard redesign with new status cards and quick actions. Fixed responsive issues on mobile. Had a productive sprint planning session with the team.",
    project: "CodeableHR",
    hours: 8,
    blockers: "Waiting for design feedback on the leave calendar component.",
    tomorrowPlan: "Start working on EOD reports module.",
  },
  {
    id: "3",
    date: "2024-01-15",
    status: "submitted" as const,
    summary: "Implemented the login screen with aurora background animation. Added theme switching functionality. Code review for the authentication PR.",
    project: "CodeableHR",
    hours: 7.5,
    blockers: "",
    tomorrowPlan: "Work on dashboard components.",
  },
  {
    id: "4",
    date: "2024-01-12",
    status: "submitted" as const,
    summary: "Set up the project structure and design system. Created base UI components including Button, Card, Avatar, and Badge. Configured Tailwind CSS with custom theme.",
    project: "CodeableHR",
    hours: 8,
    blockers: "Had some issues with Tailwind v4 configuration but resolved.",
    tomorrowPlan: "Implement the sidebar and main layout.",
  },
  {
    id: "5",
    date: "2024-01-11",
    status: "submitted" as const,
    summary: "Attended client meeting for the portal project. Discussed requirements for the new reporting feature. Started wireframing in Figma.",
    project: "Client Portal",
    hours: 6,
    blockers: "",
    tomorrowPlan: "Continue with CodeableHR setup.",
  },
];

// Group EODs by month
function groupByMonth(eods: typeof eodHistory) {
  const groups: { [key: string]: typeof eodHistory } = {};

  eods.forEach((eod) => {
    const date = new Date(eod.date);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(eod);
  });

  return groups;
}

export default function EODHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedEOD, setSelectedEOD] = React.useState<typeof eodHistory[0] | null>(null);
  const [filterProject, setFilterProject] = React.useState<string | null>(null);

  // Filter EODs
  const filteredEODs = eodHistory.filter((eod) => {
    const matchesSearch =
      eod.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eod.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !filterProject || eod.project === filterProject;
    return matchesSearch && matchesProject;
  });

  const groupedEODs = groupByMonth(filteredEODs);
  const projects = [...new Set(eodHistory.map((e) => e.project))];

  // Check if today's EOD can be edited (same day and draft/not submitted)
  const canEdit = (eod: typeof eodHistory[0]) => {
    const today = new Date().toISOString().split("T")[0];
    return eod.date === today && eod.status === "draft";
  };

  return (
    <div className="max-w-6xl mx-auto">
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/eod-reports">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  My EOD History
                </h1>
                <p className="text-sm text-foreground-muted">
                  Your personal work journal
                </p>
              </div>
            </div>

            <Link href="/eod-reports/submit">
              <Button className="gap-2">
                <FileEdit className="h-4 w-4" />
                Write Today's EOD
              </Button>
            </Link>
          </div>
        </StaggerItem>

        {/* Search and Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search your EODs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                className="bg-card"
              />
            </div>

            <div className="flex gap-2">
              {projects.map((project) => (
                <Button
                  key={project}
                  variant={filterProject === project ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterProject(filterProject === project ? null : project)}
                  className="gap-1.5"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  {project}
                  {filterProject === project && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* EOD List */}
          <StaggerItem className="lg:col-span-2">
            <div className="space-y-8">
              {Object.entries(groupedEODs).map(([month, eods]) => (
                <div key={month} className="space-y-4">
                  {/* Month Header */}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-foreground-muted" />
                    <h2 className="text-sm font-semibold text-foreground-muted uppercase tracking-wider">
                      {month}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-foreground-subtle">
                      {eods.length} {eods.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  {/* EOD Cards */}
                  <div className="space-y-3">
                    {eods.map((eod, index) => {
                      const eodDate = new Date(eod.date);
                      const isSelected = selectedEOD?.id === eod.id;

                      return (
                        <motion.div
                          key={eod.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <button
                            onClick={() => setSelectedEOD(eod)}
                            className={cn(
                              "w-full text-left p-4 rounded-xl border transition-all duration-200",
                              "hover:border-primary/30 hover:shadow-md",
                              isSelected
                                ? "border-primary bg-primary-muted/30 shadow-md"
                                : "border-border bg-card"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              {/* Date */}
                              <div className="flex flex-col items-center min-w-[50px]">
                                <span className="text-2xl font-bold text-foreground">
                                  {eodDate.getDate()}
                                </span>
                                <span className="text-xs text-foreground-muted">
                                  {eodDate.toLocaleDateString("en-US", { weekday: "short" })}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {eod.status === "submitted" ? (
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                  ) : (
                                    <FileEdit className="h-4 w-4 text-warning" />
                                  )}
                                  <Badge
                                    variant={eod.status === "submitted" ? "success" : "warning"}
                                    className="text-[10px] px-2"
                                  >
                                    {eod.status === "submitted" ? "Submitted" : "Draft"}
                                  </Badge>
                                  <span className="text-xs text-foreground-subtle">·</span>
                                  <span className="text-xs text-foreground-muted">{eod.project}</span>
                                  <span className="text-xs text-foreground-subtle">·</span>
                                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {eod.hours}h
                                  </span>
                                </div>
                                <p className="text-sm text-foreground line-clamp-2">
                                  {eod.summary}
                                </p>
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredEODs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-foreground-subtle mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No EODs found
                  </h3>
                  <p className="text-sm text-foreground-muted">
                    {searchQuery || filterProject
                      ? "Try adjusting your search or filters"
                      : "Start writing your first EOD to build your work journal"}
                  </p>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* EOD Detail Panel */}
          <StaggerItem className="lg:col-span-1">
            <div className="sticky top-24">
              <AnimatePresence mode="wait">
                {selectedEOD ? (
                  <motion.div
                    key={selectedEOD.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-foreground">
                              {formatDate(new Date(selectedEOD.date))}
                            </p>
                            <p className="text-sm text-foreground-muted">
                              {new Date(selectedEOD.date).toLocaleDateString("en-US", { weekday: "long" })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setSelectedEOD(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Status & Meta */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge
                            variant={selectedEOD.status === "submitted" ? "success" : "warning"}
                          >
                            {selectedEOD.status === "submitted" ? "Submitted" : "Draft"}
                          </Badge>
                          <Badge variant="outline">{selectedEOD.project}</Badge>
                          <Badge variant="muted" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {selectedEOD.hours} hours
                          </Badge>
                        </div>

                        {/* Summary */}
                        <div>
                          <h4 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Summary
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {selectedEOD.summary}
                          </p>
                        </div>

                        {/* Blockers */}
                        {selectedEOD.blockers && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              Blockers
                            </h4>
                            <p className="text-sm text-foreground leading-relaxed">
                              {selectedEOD.blockers}
                            </p>
                          </div>
                        )}

                        {/* Tomorrow's Plan */}
                        {selectedEOD.tomorrowPlan && (
                          <div>
                            <h4 className="text-sm font-medium text-foreground-muted mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              Next Day Plan
                            </h4>
                            <p className="text-sm text-foreground leading-relaxed">
                              {selectedEOD.tomorrowPlan}
                            </p>
                          </div>
                        )}

                        {/* Edit Button */}
                        {canEdit(selectedEOD) && (
                          <Link href="/eod-reports/submit">
                            <Button className="w-full gap-2">
                              <FileEdit className="h-4 w-4" />
                              Continue Editing
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed border-border rounded-xl"
                  >
                    <FileText className="h-10 w-10 text-foreground-subtle mb-3" />
                    <p className="text-sm text-foreground-muted">
                      Select an EOD to view details
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </div>
  );
}
