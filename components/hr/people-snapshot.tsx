"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Palmtree, Clock, ArrowRight, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PeopleSnapshotProps {
  totalEmployees: number;
  onLeaveToday: number;
  pendingLeaves: number;
  recentPending?: Array<{
    id: string;
    name: string;
    department: string;
    leaveType: string;
    days: number;
  }>;
}

export function PeopleSnapshot({
  totalEmployees,
  onLeaveToday,
  pendingLeaves,
  recentPending = [],
}: PeopleSnapshotProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">People Snapshot</CardTitle>
        </div>
        <Link href="/people">
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-primary-muted/30 border border-primary/10 text-center">
            <p className="text-2xl font-bold text-primary">{totalEmployees}</p>
            <p className="text-xs text-foreground-muted">Total Employees</p>
          </div>
          <div className="p-3 rounded-xl bg-accent-muted/30 border border-accent/10 text-center">
            <p className="text-2xl font-bold text-accent">{onLeaveToday}</p>
            <p className="text-xs text-foreground-muted">On Leave Today</p>
          </div>
          <div className={cn(
            "p-3 rounded-xl text-center",
            pendingLeaves > 0
              ? "bg-warning-muted/30 border border-warning/10"
              : "bg-success-muted/30 border border-success/10"
          )}>
            <p className={cn(
              "text-2xl font-bold",
              pendingLeaves > 0 ? "text-warning" : "text-success"
            )}>
              {pendingLeaves}
            </p>
            <p className="text-xs text-foreground-muted">Pending Leaves</p>
          </div>
        </div>

        {/* Recent Pending Leaves */}
        {recentPending.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground-muted">Recent Pending Requests</p>
            <div className="space-y-2">
              {recentPending.slice(0, 3).map((request) => (
                <motion.div
                  key={request.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={request.name} size="xs" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{request.name}</p>
                      <p className="text-xs text-foreground-muted">{request.department}</p>
                    </div>
                  </div>
                  <Badge variant="muted" className="text-xs">
                    {request.days}d {request.leaveType}
                  </Badge>
                </motion.div>
              ))}
            </div>
            {pendingLeaves > 3 && (
              <Link href="/hr/leaves" className="block">
                <Button variant="ghost" size="sm" className="w-full text-primary">
                  View all {pendingLeaves} requests
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Link href="/people" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Users className="h-4 w-4" />
              View People
            </Button>
          </Link>
          <Link href="/hr/leaves" className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Clock className="h-4 w-4" />
              Manage Leaves
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
