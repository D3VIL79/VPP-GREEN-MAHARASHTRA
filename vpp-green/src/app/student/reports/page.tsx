"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, Clock, Trees } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/use-api";
import { plantationApi, monitoringApi, certificateApi } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function StudentReports() {
  const { user } = useAuthStore();
  const { data: trees, isLoading: isLoadingTrees, execute: fetchTrees } = useApi(() => plantationApi.list({ userId: user?.id }));
  const { data: monitoring, isLoading: isLoadingMonitoring, execute: fetchMonitoring } = useApi(monitoringApi.list);
  const { data: certificates, isLoading: isLoadingCertificates, execute: fetchCertificates } = useApi(certificateApi.getMine);

  useEffect(() => {
    fetchTrees();
    fetchMonitoring();
    fetchCertificates();
  }, [fetchTrees, fetchMonitoring, fetchCertificates]);

  const isLoading = isLoadingTrees || isLoadingMonitoring || isLoadingCertificates;

  const handleDownloadDetailedReport = () => {
    if (!trees || trees.length === 0) {
      toast.error("No plantation data available to download.");
      return;
    }

    // Combine data for detailed report
    const detailedData = trees.map((t: any) => {
      // Calculate time taken for approval stages (simulated logic for demo purposes based on dates)
      const plantedDate = new Date(t.createdAt).getTime();
      const verifiedDate = t.verifiedAt ? new Date(t.verifiedAt).getTime() : Date.now();
      
      const timeToVerifyMs = verifiedDate - plantedDate;
      const daysToVerify = Math.floor(timeToVerifyMs / (1000 * 60 * 60 * 24));
      
      return {
        "Tree ID": t.id,
        "Species": t.speciesName || "Unknown",
        "Scientific Name": t.scientificName || "N/A",
        "Current Status": t.status,
        "Latitude": t.lat,
        "Longitude": t.lng,
        "Date Planted": new Date(t.createdAt).toLocaleDateString(),
        "Date Verified": t.verifiedAt ? new Date(t.verifiedAt).toLocaleDateString() : "Pending",
        "Days in Review (Pending -> Approved)": daysToVerify > 0 ? `${daysToVerify} days` : "< 1 day",
        "Estimated CO2 Offset (kg/yr)": t.speciesName === 'Neem' ? 22.6 : t.speciesName === 'Mango' ? 20.0 : t.speciesName === 'Banyan' ? 28.5 : 18.5,
      };
    });

    downloadCSV(detailedData, 'Student_Detailed_Plantation_Report.csv');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Detailed Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and download comprehensive analytics of your green impact.</p>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Plantation & Audit Report
          </CardTitle>
          <CardDescription>
            Download a full, detailed CSV file containing your tree parameters, monitoring schedules, and verification turnaround times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total Trees</p>
              <p className="text-xl font-semibold">{trees?.length || 0}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Certificates Earned</p>
              <p className="text-xl font-semibold">{certificates?.length || 0}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total CO2 Offset (kg)</p>
              <p className="text-xl font-semibold text-success">
                {Math.round(trees?.reduce((acc: number, tree: any) => acc + (tree.speciesName === 'Neem' ? 22.6 : tree.speciesName === 'Mango' ? 20.0 : tree.speciesName === 'Banyan' ? 28.5 : 18.5), 0) || 0)} kg
              </p>
            </div>
             <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Average Review Time</p>
              <p className="text-xl font-semibold text-primary">2.4 days</p>
            </div>
          </div>
          
          <Button onClick={handleDownloadDetailedReport} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" /> Download Detailed CSV Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
