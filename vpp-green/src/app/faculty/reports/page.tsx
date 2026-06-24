"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, FileSpreadsheet, Plus, HelpCircle, FileCheck, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

export default function FacultyReports() {
  const [department, setDepartment] = useState("cmpn");
  const [batchYear, setBatchYear] = useState("2026");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const reportsList = [
    { id: "ledger", name: "Student Point Ledgers for Term Allocation", format: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), description: "Direct export of student rolls with approved tree counts and points, prepared for university records." },
    { id: "geotag", name: "EXIF Geotag Integrity Check Audit", format: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), description: "Automatic analysis verification report checking image EXIF coordinates for Sion and Chunabhatti campus borders." },
    { id: "survival", name: "Department Leaderboard & Survival Summary", format: "CSV", size: "Dynamic", date: new Date().toLocaleDateString(), description: "Performance summary of native tree species' survival rates across Engineering and Architecture circles." },
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

  const handleCompileGrading = async () => {
    setIsCompiling(true);
    try {
      const deptMap: Record<string, string> = {
        cmpn: "Computer Engineering",
        it: "Information Technology",
        extc: "EXTC",
        arch: "Architecture",
      };
      
      const yearMap: Record<string, string> = {
        "2026": "TE",
        "2025": "SE",
        "2027": "BE",
      };

      const res = await reportsApi.getGradingList({
        department: deptMap[department],
        year: yearMap[batchYear],
      });

      if (res.data) {
        const mappedData = res.data.map(row => ({
          "Roll No": row.id.substring(0, 8),
          "Full Name": row.name,
          "Email Address": row.email || '',
          "Mobile Number": row.mobile || '',
          "Department": row.department,
          "Class Year": row.classYear,
          "Verified Trees": row.treesPlanted,
          "Total Points": row.totalPoints,
          "Grades Assigned": row.grade,
        }));
        
        triggerCSVDownload(mappedData, `Grading_List_${department.toUpperCase()}_${batchYear}.csv`);
      }
    } catch (err) {
      console.error("Grading compilation failed", err);
      toast.error("Failed to compile grading list.");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    setIsDownloading(reportId);
    try {
      if (reportId === 'ledger') {
        const res = await reportsApi.getGradingList();
        const mapped = res.data.map(row => ({
          "Student ID": row.id,
          "Name": row.name,
          "Department": row.department,
          "Year": row.classYear,
          "Trees Planted": row.treesPlanted,
          "Points": row.totalPoints,
        }));
        triggerCSVDownload(mapped, `Student_Point_Ledger.csv`);
      } else if (reportId === 'geotag') {
        const res = await reportsApi.getGeotagAudit();
        const mapped = res.data.map(row => ({
          "Tree ID": row.id,
          "Tree Code": row.treeCode,
          "Species Name": row.speciesName,
          "Planted By": row.studentName,
          "Latitude": row.lat,
          "Longitude": row.lng,
          "Status": row.status,
          "Remarks": row.remarks
        }));
        triggerCSVDownload(mapped, `EXIF_Geotag_Audit_Report.csv`);
      } else if (reportId === 'survival') {
        const res = await reportsApi.getSurvivalSummary();
        triggerCSVDownload(res.data, `Species_Survival_Summary.csv`);
      }
    } catch (err) {
      console.error("Download report failed", err);
      toast.error("Failed to download report data.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Coordinating Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and export grading lists, geotag compliance reports, and leaderboard metrics.</p>
      </div>

      {/* Control Card */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Generate Custom Grading List</CardTitle>
          <CardDescription>Export student names, rolls, and points matching university grading categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-[200px]">
              <Select value={department} onValueChange={(val) => val && setDepartment(val)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cmpn">Computer Engineering</SelectItem>
                  <SelectItem value="it">Information Technology</SelectItem>
                  <SelectItem value="extc">EXTC</SelectItem>
                  <SelectItem value="arch">Architecture</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[150px]">
              <Select value={batchYear} onValueChange={(val) => val && setBatchYear(val)}>
                <SelectTrigger className="bg-background/50 font-sans">
                  <SelectValue placeholder="Batch Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">TE (Third Year)</SelectItem>
                  <SelectItem value="2025">SE (Second Year)</SelectItem>
                  <SelectItem value="2027">BE (Final Year)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="bg-primary hover:bg-primary/95 text-white" 
              onClick={handleCompileGrading}
              disabled={isCompiling}
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Compiling...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Compile Spreadsheet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Documents */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" /> Available Reports for Download
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {reportsList.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-foreground">{doc.name}</h3>
                      <Badge variant="secondary" className="bg-muted text-[10px]">{doc.format}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl">{doc.description}</p>
                    <p className="text-[10px] text-muted-foreground pt-1">Compiled on {doc.date} • {doc.size}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-background/50 hover:bg-muted/80 text-primary border-primary/20 shrink-0"
                    onClick={() => handleDownloadReport(doc.id)}
                    disabled={isDownloading !== null}
                  >
                    {isDownloading === doc.id ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1.5" />
                    )}
                    Download
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
