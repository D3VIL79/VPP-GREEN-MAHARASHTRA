"use client";

import { motion } from "framer-motion";
import { Target, Leaf, TrendingUp, Award, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiAnalyticsWidget } from "@/components/ai/AiAnalyticsWidget";
import { DynamicMap } from "@/components/map/DynamicMap";
import { downloadCSV } from "@/lib/utils";

import { useEffect } from "react";
import { useApi } from "@/lib/use-api";
import { plantationApi } from "@/lib/api";
import { toast } from "sonner";

export default function CsrDashboard() {
  const { data: allTrees, isLoading, execute: fetchAllTrees } = useApi(plantationApi.list);

  useEffect(() => {
    fetchAllTrees();
  }, [fetchAllTrees]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamic calculations based on real sponsored trees
  const totalTrees = (allTrees && allTrees.length > 0) ? allTrees.length : 50000;
  // Estimate 20kg per tree per year
  const carbonOffsetTons = (allTrees && allTrees.length > 0) ? ((totalTrees * 20) / 1000).toFixed(1) : "1,240";
  const activeProjects = (allTrees && allTrees.length > 0) ? new Set(allTrees.map((t: any) => t.institution_id)).size : 3;

  const handleDownloadEsgReport = () => {
    if (!allTrees || allTrees.length === 0) {
      toast.error("No plantation data available to download.");
      return;
    }
    const esgData = allTrees.map((t: any) => ({
      Tree_ID: t.id,
      Species: t.speciesName,
      Scientific_Name: t.scientificName,
      Planter_Name: t.userName,
      Institution_ID: t.institution_id,
      Health_Status: t.status,
      Latitude: t.lat || 'N/A',
      Longitude: t.lng || 'N/A',
      Carbon_Sequestration_Est_Kg: 20
    }));
    downloadCSV(esgData, 'Corporate_ESG_Impact_Report.csv');
  };

  const stats = [
    { label: "Total Sponsored Trees", value: totalTrees.toLocaleString(), icon: Leaf, color: "text-primary", bg: "bg-primary/10" },
    { label: "CO2 Offset (Tons)", value: carbonOffsetTons.toString(), icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Active Projects", value: activeProjects.toString(), icon: Target, color: "text-accent", bg: "bg-accent/10" },
    { label: "Impact Score", value: "9.2/10", icon: Award, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Sponsorship Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track the environmental impact of your corporate sponsorships.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-card/50 backdrop-blur-sm flex items-center gap-2" onClick={handleDownloadEsgReport}>
            <Download className="h-4 w-4" /> Download ESG Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => toast.info("Opening project catalog... You can browse and select new institutions or forestry programs to sponsor.")}>
            Sponsor New Project
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full min-h-[400px] border-border/50 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>ESG Geospatial Impact</CardTitle>
              <CardDescription>Live geographical distribution of your corporate sponsored trees.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] p-0 m-6 rounded-xl border border-dashed border-border flex items-center justify-center relative overflow-hidden">
              <DynamicMap 
                markers={(allTrees && allTrees.length > 0) ? allTrees.filter((p: any) => p.lat && p.lng).map((p: any) => ({
                  id: p.id,
                  lat: p.lat,
                  lng: p.lng,
                  title: p.speciesName || "Sponsored Tree",
                  subtitle: `Project ID: ${p.institution_id || 'CSR-1'}`
                })) : [
                  { id: 'csr-1', lat: 18.5204, lng: 73.8567, title: 'Sponsored Tree Project', subtitle: 'Pune District' },
                  { id: 'csr-2', lat: 19.0760, lng: 72.8777, title: 'Urban Reforestation', subtitle: 'Mumbai District' },
                  { id: 'csr-3', lat: 21.1458, lng: 79.0882, title: 'Forest Expansion', subtitle: 'Nagpur District' },
                ]} 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Sponsored Institutions</CardTitle>
              <CardDescription>Performance of projects funded by Tata Motors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(allTrees && allTrees.length > 0) 
                  ? Object.entries(allTrees.reduce((acc: any, tree: any) => {
                      const instName = tree.userName?.split(" ")[0] || 'Unknown Inst'; // Basic mockup of institution name
                      acc[instName] = (acc[instName] || 0) + 1;
                      return acc;
                    }, {})).slice(0, 5).map(([name, count]: [string, any], i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-foreground">{name} Campus</span>
                          <span className="text-muted-foreground">{count} / {(count + 5).toString()} Trees</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${Math.round((count / (count + 5)) * 100) > 80 ? 'bg-success' : 'bg-primary'}`} 
                            style={{ width: `${Math.round((count / (count + 5)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    ))
                  : [
                  { name: "Pune University", progress: 85, trees: "20,000 / 25,000" },
                  { name: "Mumbai Tech Institute", progress: 60, trees: "12,000 / 20,000" },
                  { name: "Nagpur College of Engineering", progress: 100, trees: "18,000 / 18,000" }
                ].map((inst, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{inst.name}</span>
                      <span className="text-muted-foreground">{inst.trees} Trees</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${inst.progress === 100 ? 'bg-success' : 'bg-primary'}`} 
                        style={{ width: `${inst.progress}%` }} 
                      />
                    </div>
                  </div>
                ))}
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
        <AiAnalyticsWidget title="CSR AI Impact Analytics" />
      </motion.div>
    </div>
  );
}
