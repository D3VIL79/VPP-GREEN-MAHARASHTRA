"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trees, ShieldCheck, Activity, Award, ArrowUpRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useApi } from "@/lib/use-api";
import { plantationApi, monitoringApi, certificateApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AiImageAnalyzer } from "@/components/ai/AiImageAnalyzer";
import { AiInsightsPanel } from "@/components/ai/AiInsightsPanel";
import { DynamicMap } from "@/components/map/DynamicMap";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: plantations, isLoading: isLoadingPlantations, execute: fetchPlantations } = useApi(() => plantationApi.list({ userId: user?.id }));
  const { data: monitoring, isLoading: isLoadingMonitoring, execute: fetchMonitoring } = useApi(monitoringApi.list);
  const { data: certificates, isLoading: isLoadingCertificates, execute: fetchCertificates } = useApi(certificateApi.getMine);

  useEffect(() => {
    fetchPlantations();
    fetchMonitoring();
    fetchCertificates();
  }, [fetchPlantations, fetchMonitoring, fetchCertificates]);

  const isLoading = isLoadingPlantations || isLoadingMonitoring || isLoadingCertificates;

  const totalTrees = plantations?.length || 0;
  const aliveTrees = plantations?.filter(p => p.status !== 'DEAD').length || 0;
  const pendingMonitoring = plantations?.filter(p => p.status === 'PLANTED' || p.status === 'MONITORING_DUE').length || 0;
  const totalCertificates = certificates?.length || 0;

  const stats = [
    { label: "My Trees", value: totalTrees, icon: Trees, color: "text-primary", bg: "bg-primary/10" },
    { label: "Alive Trees", value: aliveTrees, icon: ShieldCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Pending Monitoring", value: pendingMonitoring, icon: Activity, color: "text-warning", bg: "bg-warning/10" },
    { label: "Certificates", value: totalCertificates, icon: Award, color: "text-accent", bg: "bg-accent/10" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name || 'Student'}. Here is the latest status of your plantation impact.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/student/add-tree')}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 px-6"
        >
          + Add New Tree
        </Button>
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
              <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-8"
      >
        <AiInsightsPanel studentTrees={plantations || undefined} />
        <AiImageAnalyzer />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart / Map Area Placeholder */}
        <motion.div 
          className="col-span-1 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full min-h-[400px] border-border shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Impact Activity Map</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 m-6 rounded-xl border border-dashed border-border flex flex-col relative overflow-hidden min-h-[300px]">
              <DynamicMap 
                markers={plantations?.filter(p => p.lat && p.lng).map(p => ({
                  id: p.id,
                  lat: p.lat,
                  lng: p.lng,
                  title: p.speciesName || "Tree",
                  subtitle: `Planted: ${new Date(p.createdAt).toLocaleDateString()}`
                })) || []} 
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-border shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {plantations?.slice(0, 5).map((item, i) => (
                  <div key={item.id} className="flex gap-4 items-start relative">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary relative z-10" />
                    {i !== Math.min((plantations?.length || 0) - 1, 4) && <div className="absolute top-4 left-[3px] w-px h-full bg-border -z-0" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">Tree Planted</p>
                      <p className="text-xs text-muted-foreground">{item.speciesName || 'Unknown'} • {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {!plantations?.length && (
                  <p className="text-sm text-muted-foreground italic">No recent activity found. Plant a tree to get started!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
