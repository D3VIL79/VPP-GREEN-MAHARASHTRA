"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, ShieldAlert, Sparkles, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/use-api";
import { plantationApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

export default function StudentMonitoring() {
  const { user } = useAuthStore();
  const { data: trees, isLoading, execute: fetchTrees } = useApi(() => plantationApi.list({ userId: user?.id }));

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  // Derive audit schedule from trees
  const auditSchedule = trees?.map(tree => {
    const isDue = tree.status === 'PLANTED' || tree.status === 'MONITORING_DUE';
    const isCompleted = tree.status === 'VERIFIED';
    const status = isCompleted ? "Completed" : isDue ? "Upcoming" : tree.status === 'WILTING' ? "Water Alert Active" : tree.status;
    
    // Calculate simple due date (e.g. 3 months after creation for first audit)
    const createdAt = new Date(tree.createdAt);
    createdAt.setMonth(createdAt.getMonth() + 3);

    return {
      id: tree.id,
      species: tree.speciesName || "Unknown Species",
      stage: "Survival Audit",
      dueDate: createdAt.toLocaleDateString(),
      status: status,
      pointsReward: "50 Carbon Points",
    };
  }) || [];

  if (isLoading && !trees) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">My Monitoring Schedule</h1>
        <p className="text-muted-foreground mt-1">Track verification requirements, survival audits, and upcoming monitoring targets for your trees.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monitoring Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">100%</span>
              <span className="text-xs text-success font-medium">Excellent</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">All audit photos uploaded on-time.</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trees Monitored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">{trees?.length || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total active plantations tracked</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Carbon Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading text-primary">
                {Math.round(trees?.reduce((acc: number, tree: any) => acc + (tree.speciesName === 'Neem' ? 22.6 : tree.speciesName === 'Mango' ? 20.0 : tree.speciesName === 'Banyan' ? 28.5 : 18.5), 0) || 0)} kg
              </span>
              <span className="text-xs text-muted-foreground">CO2 Offset</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimated annual offset</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule List */}
        <Card className="lg:col-span-2 border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle>Survival Audit Calendar</CardTitle>
            <CardDescription>Upload photos at 3, 6, and 12 months to satisfy government carbon accounting guidelines.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditSchedule.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground bg-background/50 rounded-lg border border-dashed">
                  No monitoring schedules found. Plant a tree first!
                </div>
              ) : (
                auditSchedule.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">{item.species} ({item.id})</h4>
                        <Badge className={
                          item.status === "Completed" || item.status === "VERIFIED" ? "bg-success text-white" :
                          item.status === "Upcoming" || item.status === "HEALTHY" ? "bg-primary text-white" :
                          item.status === "Water Alert Active" ? "bg-warning text-warning-foreground" :
                          "bg-destructive text-white"
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.stage} • Target Due: {item.dueDate}</p>
                      <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Reward: {item.pointsReward}
                      </p>
                    </div>
                    {item.status !== "Completed" && item.status !== "VERIFIED" && (
                      <Link href="/student/trees">
                        <Button size="sm" className="bg-primary hover:bg-primary/95 text-white">
                          Log Update
                        </Button>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audit Guidelines */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Clock className="h-5 w-5 text-accent" /> Audit Requirements</CardTitle>
            <CardDescription>Follow these rules to ensure coordinates match and avoid rejection flags from coordinators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Enable GPS Location:</strong> Photos must contain camera metadata indicating precise coordinates within campus rings.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Clear Visual Fit:</strong> The tree trunk, leaves, and surrounding ground must be visible. Avoid blurry or night photography.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Add Growth Tag:</strong> Place the official physical barcode tag visible on a branch if applicable.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p><strong className="text-foreground">Self-watering alerts:</strong> If a tree status changes to "Wilting", you will receive a notification and must water it within 24 hours.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
