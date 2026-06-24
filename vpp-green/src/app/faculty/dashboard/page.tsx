"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, Activity, AlertTriangle, Users, Check, X, Eye, Loader2, Trees } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AiAnalyticsWidget } from "@/components/ai/AiAnalyticsWidget";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useApi } from "@/lib/use-api";
import { plantationApi, studentApi } from "@/lib/api";
import { useEffect } from "react";

export default function FacultyDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Fetch all plantations for the institution so we can scope them to faculty's department in memory
  const { data: plantations, isLoading: isLoadingPlantations, execute: fetchPlantations } = useApi(() => 
    plantationApi.list({ 
      institutionId: user?.institutionId
    })
  );

  // Fetch all students of the institution to scope to department
  const { data: students, isLoading: isLoadingStudents, execute: fetchStudents } = useApi(() =>
    studentApi.list({ institutionId: user?.institutionId })
  );

  useEffect(() => {
    if (user?.institutionId) {
      fetchPlantations();
      fetchStudents();
    }
  }, [user?.institutionId, fetchPlantations, fetchStudents]);

  const isLoading = isLoadingPlantations || isLoadingStudents;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Scoping metrics to Faculty's department (case-insensitive & trimmed)
  const deptStudents = students?.filter((s: any) => 
    s.dept?.toLowerCase().trim() === user?.departmentId?.toLowerCase().trim()
  ) || [];
  
  const deptPlantations = plantations?.filter((p: any) => 
    p.userDept?.toLowerCase().trim() === user?.departmentId?.toLowerCase().trim()
  ) || [];

  const verifiedPlantations = deptPlantations.filter((p: any) => p.verificationStatus === 'verified');
  const pendingRequests = deptPlantations.filter((p: any) => p.verificationStatus === 'pending');
  const unhealthyAlerts = deptPlantations.filter((p: any) => p.status === 'WILTING' || p.status === 'DEAD').length;

  const totalTrees = verifiedPlantations.length;
  const pendingCount = pendingRequests.length;
  const totalStudents = deptStudents.length;

  const stats = [
    { label: "My Dept Students", value: totalStudents.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Verified Trees", value: totalTrees.toString(), icon: Trees, color: "text-success", bg: "bg-success/10" },
    { label: "Pending Verifications", value: pendingCount.toString(), icon: ClipboardCheck, color: "text-warning", bg: "bg-warning/10" },
    { label: "Alerts (Unhealthy)", value: unhealthyAlerts.toString(), icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Faculty Overview</h1>
          <p className="text-muted-foreground mt-1">Manage verifications and monitor student plantation performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-card/50 backdrop-blur-sm" onClick={() => router.push('/faculty/reports')}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistic Widgets */}
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

      {/* Verification Queue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>Recent tree plantations requiring faculty approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Species & Student</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading verifications...
                      </TableCell>
                    </TableRow>
                  ) : pendingRequests?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No pending verifications. You are all caught up!
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRequests?.slice(0, 5).map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell>
                          <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage src={item.plantation_photo || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80"} className="object-cover" />
                            <AvatarFallback>TR</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.speciesName}</div>
                          <div className="text-xs text-muted-foreground">Planted by {item.userName}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          Lat: {item.latitude?.toFixed(4)}, Lng: {item.longitude?.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className="bg-warning/20 text-warning hover:bg-warning/30 capitalize"
                          >
                            {item.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Review Details" onClick={() => router.push('/faculty/verifications')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" className="text-sm" onClick={() => router.push('/faculty/verifications')}>
                View All Verifications <Eye className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AiAnalyticsWidget title="Faculty AI Monitoring Insights" />
      </motion.div>
    </div>
  );
}
