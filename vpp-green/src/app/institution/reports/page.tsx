"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Filter, Calendar, BarChart3, TrendingUp, Trees, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportsApi, plantationApi } from "@/lib/api";
import { toast } from "sonner";

export default function InstitutionReports() {
  const [department, setDepartment] = useState("all");
  const [academicYear, setAcademicYear] = useState("2026");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const reportList = [
    { id: "audit", name: "Institutional Green Audit", type: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), category: "Audit" },
    { id: "survival", name: "Department-wise Tree Survival Rate Analysis", type: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), category: "Monitoring" },
    { id: "ledger", name: "Student Carbon Credits & Points Ledger", type: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), category: "Engagement" },
    { id: "geotag", name: "EXIF Geotag Integrity Check Audit", type: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), category: "Fraud Verification" },
  ];

  const triggerCSVDownload = (jsonData: any[], filename: string) => {
    if (jsonData.length === 0) {
      toast.error("No records found to compile.");
      return;
    }
    const keys = Object.keys(jsonData[0]);
    const csvContent = [
      keys.join(','),
      ...jsonData.map(row => keys.map(key => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReport = async () => {
    setIsCompiling(true);
    try {
      const res = await plantationApi.list();
      if (res.data) {
        const filtered = res.data.filter((p: any) => {
          return department === "all" || p.userDept?.toLowerCase() === department.toLowerCase();
        });
        
        const mapped = filtered.map(row => ({
          "Tree ID": row.id,
          "Sapling Code": row.treeCode || 'PENDING',
          "Species Name": row.speciesName,
          "Scientific Name": row.scientificName,
          "Planted By": row.userName,
          "Department": row.userDept,
          "Academic Year": row.userYear,
          "Planted Date": row.plantation_date,
          "Latitude": row.lat,
          "Longitude": row.lng,
          "Status": row.verificationStatus
        }));
        
        triggerCSVDownload(mapped, `Institution_Green_Report_${department}_${academicYear}.csv`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report.");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setIsDownloading(reportId);
    try {
      if (reportId === 'audit') {
        const res = await plantationApi.list();
        const mapped = res.data.map(p => ({
          "Plantation ID": p.id,
          "Tree Code": p.treeCode || 'PENDING',
          "Species": p.speciesName,
          "Date": p.plantation_date,
          "Student": p.userName,
          "Status": p.verificationStatus,
          "Alive": p.is_alive ? 'YES' : 'NO'
        }));
        triggerCSVDownload(mapped, `Campus_Green_Audit_${new Date().getFullYear()}.csv`);
      } else if (reportId === 'survival') {
        const res = await reportsApi.getSurvivalSummary();
        triggerCSVDownload(res.data, `Department_Tree_Survival_Rate.csv`);
      } else if (reportId === 'ledger') {
        const res = await reportsApi.getGradingList();
        const mapped = res.data.map(row => ({
          "Student ID": row.id,
          "Name": row.name,
          "Department": row.department,
          "Year": row.classYear,
          "Trees Planted": row.treesPlanted,
          "Points": row.totalPoints,
          "Grading": row.grade
        }));
        triggerCSVDownload(mapped, `Student_Carbon_Points_Grading.csv`);
      } else if (reportId === 'geotag') {
        const res = await reportsApi.getGeotagAudit();
        triggerCSVDownload(res.data, `EXIF_Geotag_Fraud_Audit.csv`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile document.");
    } finally {
      setIsDownloading(null);
    }
  };

  const quickStats = [
    { label: "Co2 Offset (Est.)", value: "3.1 Tons/yr", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "Survival Target", value: "95% (Current: 94%)", icon: Trees, color: "text-primary", bg: "bg-primary/10" },
    { label: "Report Categories", value: "4 Available", icon: FileText, color: "text-info", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Export, generate, and view environmental impact reports for your institution.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
            onClick={handleGenerateReport}
            disabled={isCompiling}
          >
            {isCompiling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Compiling...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" /> Generate New Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold font-heading">{stat.value}</h3>
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

      {/* Filter Options */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center text-sm font-medium text-muted-foreground mr-2">
                <Filter className="h-4 w-4 mr-1.5" /> Filters
              </div>
              <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Engineering">Computer Engg (VPP)</SelectItem>
                  <SelectItem value="Information Technology">Information Tech (VPP)</SelectItem>
                  <SelectItem value="EXTC">EXTC (VPP)</SelectItem>
                  <SelectItem value="Architecture">Architecture (Phalke)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={academicYear} onValueChange={(val) => val && setAcademicYear(val)}>
                <SelectTrigger className="w-[150px] bg-background/50">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2025 - 2026</SelectItem>
                  <SelectItem value="2025">2024 - 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table Card */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Downloadable Reports</CardTitle>
          <CardDescription>Official administrative exports for Maharashtra Green Initiative audits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Report ID</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Report Name</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Category</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Format</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground">Date Generated</th>
                  <th className="py-4 px-4 font-semibold text-muted-foreground text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {reportList.map((report) => (
                  <tr key={report.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-muted-foreground">{report.id.toUpperCase()}</td>
                    <td className="py-4 px-4 font-medium text-foreground">{report.name}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{report.category}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/10">
                        {report.type} ({report.size})
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{report.date}</td>
                    <td className="py-4 px-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:text-primary hover:bg-primary/10"
                        onClick={() => handleDownloadReport(report.id)}
                        disabled={isDownloading !== null}
                      >
                        {isDownloading === report.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
