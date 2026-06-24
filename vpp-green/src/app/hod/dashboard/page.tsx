"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Trees, BarChart3, TrendingUp, ShieldAlert, Award, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useApi } from "@/lib/use-api";
import { plantationApi, studentApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AiAnalyticsWidget } from "@/components/ai/AiAnalyticsWidget";

export default function HodDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const departmentId = user?.departmentId || "Computer Engineering";
  const institutionId = user?.institutionId;

  // Fetch all plantations for filtering by HOD department
  const { data: plantations, isLoading: isLoadingPlantations, execute: fetchPlantations } = useApi(() => 
    plantationApi.list({ institutionId })
  );

  // Fetch all students for filtering by HOD department
  const { data: students, isLoading: isLoadingStudents, execute: fetchStudents } = useApi(() => 
    studentApi.list({ institutionId })
  );

  useEffect(() => {
    if (institutionId) {
      fetchPlantations();
      fetchStudents();
    }
  }, [institutionId]);

  const isLoading = isLoadingPlantations || isLoadingStudents;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Scoping metrics to HOD's department
  const deptStudents = students?.filter((s: any) => s.dept?.toLowerCase().trim() === departmentId.toLowerCase().trim()) || [];
  const deptPlantations = plantations?.filter((p: any) => p.userDept?.toLowerCase().trim() === departmentId.toLowerCase().trim()) || [];
  
  const verifiedPlantations = deptPlantations.filter((p: any) => p.verificationStatus === 'verified');
  const pendingPlantations = deptPlantations.filter((p: any) => p.verificationStatus === 'pending');

  const totalTrees = verifiedPlantations.length;
  const aliveTrees = verifiedPlantations.filter((p: any) => p.is_alive).length;
  const survivalRate = totalTrees > 0 ? Math.round((aliveTrees / totalTrees) * 100) : 100;

  const stats = [
    { label: "My Dept Students", value: deptStudents.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Verified Trees", value: totalTrees, icon: Trees, color: "text-success", bg: "bg-success/10" },
    { label: "Survival Rate", value: `${survivalRate}%`, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Pending Verifications", value: pendingPlantations.length, icon: ShieldAlert, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {departmentId} HOD Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student & faculty coordinators and monitor tree lifecycle audits in your department.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => router.push('/hod/verifications')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
          >
            Review Verifications ({pendingPlantations.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Leaderboard & Recent Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Recent Departmental Activity</CardTitle>
              <CardDescription>Latest uploads by students and faculty coordinators in {departmentId}.</CardDescription>
            </CardHeader>
            <CardContent>
              {deptPlantations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic">No plantations found in this department.</div>
              ) : (
                <div className="divide-y divide-border/40">
                  {deptPlantations.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p.plantationPhoto ? (
                          <img src={p.plantationPhoto} alt={p.speciesName} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center"><Trees className="h-5 w-5 text-muted-foreground" /></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.userName}</p>
                          <p className="text-xs text-muted-foreground">{p.speciesName} • {p.userRoll}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.verificationStatus === 'verified' ? 'bg-success/15 text-success' :
                          p.verificationStatus === 'pending' ? 'bg-warning/15 text-warning' :
                          'bg-destructive/15 text-destructive'
                        }`}>
                          {p.verificationStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gamified Department Top Planters Widget */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" /> Dept Leaderboard
              </CardTitle>
              <CardDescription>Top students/faculty in {departmentId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deptStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No planters registered yet.</p>
                ) : (
                  deptStudents
                    .sort((a: any, b: any) => b.points - a.points)
                    .slice(0, 5)
                    .map((student: any, i) => (
                      <div key={student.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                          }`}>
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.roll}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-primary">{student.points} pts</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <Button 
                onClick={() => router.push('/leaderboard')}
                variant="ghost" 
                className="w-full text-center text-primary mt-6 hover:bg-primary/5 text-sm"
              >
                View Full Leaderboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <AiAnalyticsWidget title={`${departmentId} AI Growth Forecasts`} />
      </motion.div>
    </div>
  );
}
