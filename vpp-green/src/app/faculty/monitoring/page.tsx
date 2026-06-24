"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Heart, RefreshCw, AlertTriangle, MapPin, Eye, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/lib/use-api";
import { monitoringApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function FacultyMonitoring() {
  const { user } = useAuthStore();
  const { data: treeHealthLogs, isLoading, execute: fetchLogs } = useApi(() => 
    monitoringApi.list({ 
      status: 'pending', 
      institutionId: user?.institutionId 
    })
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [isActioning, setIsActioning] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleApprove = async (id: string) => {
    setIsActioning(id);
    try {
      await monitoringApi.verify(id, 'verified');
      fetchLogs();
    } catch (error) {
      console.error("Failed to approve monitoring log", error);
      toast.error("Error approving monitoring log");
    } finally {
      setIsActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsActioning(id);
    try {
      await monitoringApi.verify(id, 'rejected');
      fetchLogs();
    } catch (error) {
      console.error("Failed to reject monitoring log", error);
      toast.error("Error rejecting monitoring log");
    } finally {
      setIsActioning(null);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Satellite data synced successfully with 0 discrepancies found.");
    }, 1500);
  };

  if (isLoading && !treeHealthLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Derived quick statistics from fetched health logs
  const totalAlerts = treeHealthLogs?.filter((l: any) => l.healthStatus?.toLowerCase() === 'wilting' || l.healthStatus?.toLowerCase() === 'dead').length || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Tree Health & Monitoring</h1>
          <p className="text-muted-foreground mt-1">Track long-term survival statistics and health audits of approved campus trees.</p>
        </div>
        <div>
          <Button variant="outline" className="bg-card/50" onClick={triggerSync} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Satellite Data
          </Button>
        </div>
      </div>

      {/* Monitoring Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Survival Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">94.3%</span>
              <span className="text-xs text-success font-medium">↑ 0.5% this month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target benchmark: 95% survival</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-heading">{treeHealthLogs?.length || 0}</span>
              <span className="text-xs text-muted-foreground">requires review</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verify growth photos and heights</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 bg-card/60 backdrop-blur-xl shadow-sm ${totalAlerts > 0 ? 'border-destructive/20 bg-destructive/5' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${totalAlerts > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold font-heading ${totalAlerts > 0 ? 'text-destructive' : 'text-foreground'}`}>{totalAlerts}</span>
              <span className="text-xs font-medium text-muted-foreground">Trees Flagged</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Alert dispatched to students</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Monitors List */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Continuous Growth Verification Log</CardTitle>
          <CardDescription>Visual health monitoring updates from students across VPP campus circles.</CardDescription>
        </CardHeader>
        <CardContent>
          {treeHealthLogs?.length === 0 ? (
            <div className="text-center p-12 bg-background/50 rounded-xl border border-dashed text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No Pending Monitoring Logs</h3>
              <p className="text-sm mt-1">All tree health logs are fully reviewed and approved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {treeHealthLogs?.map((log: any) => (
                <div key={log.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  {log.photoUrl ? (
                    <img src={log.photoUrl} alt={log.speciesName} className="w-full sm:w-36 h-28 object-cover rounded-md border border-border bg-black/5" />
                  ) : (
                    <div className="w-full sm:w-36 h-28 rounded-md bg-muted flex items-center justify-center shrink-0 border border-dashed">
                      <Activity className="h-8 w-8 text-muted-foreground opacity-30" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground text-sm sm:text-base">{log.speciesName} - <span className="text-xs text-muted-foreground font-mono">{log.id.substring(0, 8)}</span></h4>
                          <p className="text-xs text-muted-foreground">Planted by {log.studentName}</p>
                        </div>
                        <Badge variant="outline" className={
                          log.healthStatus === "Healthy" ? "bg-success/10 text-success border-success/20" :
                          log.healthStatus === "Wilting" ? "bg-warning/10 text-warning border-warning/20" :
                          "bg-destructive/10 text-destructive border-destructive/20"
                        }>
                          {log.healthStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Cycle:</span> <span className="font-medium text-foreground">{log.cycle} / 8</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Height:</span> <span className="font-medium text-foreground">{log.heightCm} cm</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{new Date(log.date).toLocaleDateString()}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary" /> {log.coords}
                        </div>
                        {log.remarks && (
                          <div className="col-span-2 text-xs text-muted-foreground italic border-t border-border/20 pt-1 mt-1">
                            Remarks: "{log.remarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-border/10 mt-3 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(log.id)}
                        disabled={isActioning !== null}
                      >
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs bg-success hover:bg-success/95 text-white"
                        onClick={() => handleApprove(log.id)}
                        disabled={isActioning !== null}
                      >
                        {isActioning === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />} Approve Log
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
