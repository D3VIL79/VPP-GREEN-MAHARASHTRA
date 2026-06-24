"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Trees, BarChart3, TrendingUp, Trophy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiAnalyticsWidget } from "@/components/ai/AiAnalyticsWidget";
import { useApi } from "@/lib/use-api";
import { plantationApi, studentApi, campaignApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export default function InstitutionDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const institutionId = user?.institutionId;

  const { data: plantations, isLoading: isLoadingPlantations, execute: fetchPlantations } = useApi(() => 
    plantationApi.list({ institutionId })
  );
  
  const { data: students, isLoading: isLoadingStudents, execute: fetchStudents } = useApi(() => 
    studentApi.list({ institutionId })
  );

  const { data: campaigns, isLoading: isLoadingCampaigns, execute: fetchCampaigns } = useApi(campaignApi.list);

  useEffect(() => {
    if (institutionId) {
      fetchPlantations();
      fetchStudents();
      fetchCampaigns();
    }
  }, [institutionId, fetchPlantations, fetchStudents, fetchCampaigns]);

  const isLoading = isLoadingPlantations || isLoadingStudents || isLoadingCampaigns;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamic calculations
  const totalStudentsCount = students?.length || 0;
  const verifiedPlantations = plantations?.filter((p: any) => p.verificationStatus === 'verified') || [];
  const totalTreesPlanted = verifiedPlantations.length;
  
  const aliveTrees = verifiedPlantations.filter((p: any) => p.is_alive).length;
  const survivalRate = totalTreesPlanted > 0 ? Math.round((aliveTrees / totalTreesPlanted) * 100) : 100;
  
  const activeCampaignsCount = campaigns?.filter((c: any) => c.status === 'active').length || 0;

  const stats = [
    { label: "Total Students", value: totalStudentsCount, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Trees Planted (Verified)", value: totalTreesPlanted, icon: Trees, color: "text-success", bg: "bg-success/10" },
    { label: "Survival Rate", value: `${survivalRate}%`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Active Campaigns", value: activeCampaignsCount, icon: BarChart3, color: "text-warning", bg: "bg-warning/10" },
  ];

  // Dynamic Department Rankings based on verified trees
  const deptGroup: Record<string, { name: string; trees: number; alive: number }> = {};
  verifiedPlantations.forEach((p: any) => {
    const dept = p.userDept || "General / Staff";
    if (!deptGroup[dept]) {
      deptGroup[dept] = { name: dept, trees: 0, alive: 0 };
    }
    deptGroup[dept].trees += 1;
    if (p.is_alive) {
      deptGroup[dept].alive += 1;
    }
  });

  const rankings = Object.values(deptGroup)
    .map((d) => ({
      dept: d.name,
      trees: d.trees,
      survival: d.trees > 0 ? `${Math.round((d.alive / d.trees) * 100)}%` : "100%",
    }))
    .sort((a, b) => b.trees - a.trees)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">VPP Educational Complex Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track plantation progress across Engineering, Arts, and Architecture colleges.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/institution/campaigns')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
          >
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold font-heading">{stat.value}</h3>
                  </div>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          className="col-span-1 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full min-h-[400px] border-border/50 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>VPP Campus Plantation Growth</CardTitle>
              <CardDescription>Visual summary of coordinates and plantation distribution.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 m-6 rounded-xl border border-dashed border-border flex items-center justify-center relative overflow-hidden min-h-[300px]">
              <div className="absolute inset-0 bg-muted/20 flex items-center justify-center text-muted-foreground text-sm font-medium">
                Overview of Verified Plantation Map Coordinates
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" /> Department Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {rankings.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-6">No plantations verified yet.</p>
                ) : (
                  rankings.map((dept, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-accent text-accent-foreground shadow-sm border border-accent/20' : 'bg-muted text-muted-foreground'}`}>
                          {dept.rank}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{dept.dept}</p>
                          <p className="text-xs text-muted-foreground">{dept.trees.toLocaleString()} Trees</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-success">{dept.survival}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <AiAnalyticsWidget title="Institution AI Engine Insights" />
      </motion.div>
    </div>
  );
}
