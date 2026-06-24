"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Trees, Award, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HodReportsPage() {
  const { user } = useAuthStore();
  const departmentId = user?.departmentId || "Computer Engineering";
  const institutionId = user?.institutionId;
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!institutionId) return;
      setLoading(true);
      try {
        // 1. Fetch all plantations (real + mock)
        const { data: allPlants } = await plantationApi.list();

        // 2. Try to fetch users from DB
        let dbUsers: any[] = [];
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*, plantations!plantations_user_id_fkey(*, tree_species(*)), leaderboard_points(points)')
            .eq('institution_id', institutionId)
            .eq('department', departmentId);
          if (!error && data) {
            dbUsers = data;
          }
        } catch (e) {
          console.warn("Database fetch for users failed, using fallback compilation", e);
        }

        let mappedData = [];
        if (dbUsers.length > 0) {
          mappedData = dbUsers.map((u: any) => {
            const verifiedTrees = u.plantations?.filter((p: any) => p.verification_status === 'verified') || [];
            const totalPoints = u.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
            return {
              id: u.id,
              name: u.full_name,
              role: u.role?.toUpperCase(),
              treesPlanted: verifiedTrees.length,
              totalPoints,
              grade: totalPoints >= 200 ? 'A+' : totalPoints >= 100 ? 'A' : totalPoints >= 50 ? 'B' : 'C',
              trees: verifiedTrees.map((t: any) => ({
                code: t.tree_code || 'PENDING',
                species: t.tree_species?.species_name || 'Unknown',
                status: t.is_alive ? 'Alive' : 'Dead'
              }))
            };
          });
        } else {
          // Compile stats dynamically from plantationApi.list() for HOD's department
          const deptPlantations = (allPlants || []).filter((p: any) => 
            (p.userDept === departmentId || p.users?.department === departmentId) &&
            (p.institution_id === institutionId || p.institutionId === institutionId)
          );

          // Group by user_id
          const userMap: Record<string, any> = {};
          deptPlantations.forEach((p: any) => {
            const userId = p.user_id;
            const isVerified = p.verification_status === 'verified' || p.verificationStatus === 'verified';
            if (!userMap[userId]) {
              userMap[userId] = {
                id: userId,
                name: p.userName || p.users?.full_name || "Unknown",
                role: p.userYear === 'Staff' || p.users?.role === 'faculty' ? 'FACULTY' : 'STUDENT',
                treesPlanted: 0,
                totalPoints: 0,
                trees: []
              };
            }
            if (isVerified) {
              userMap[userId].treesPlanted += 1;
              userMap[userId].trees.push({
                code: p.tree_code || 'PENDING',
                species: p.speciesName || p.tree_species?.species_name || 'Unknown',
                status: p.is_alive ? 'Alive' : 'Dead'
              });
            }
          });

          mappedData = Object.values(userMap).map((user: any) => {
            // Each verified tree gives 30 points
            const totalPoints = user.treesPlanted * 30;
            return {
              ...user,
              totalPoints,
              grade: totalPoints >= 150 ? 'A+' : totalPoints >= 100 ? 'A' : totalPoints >= 50 ? 'B' : 'C'
            };
          });
        }

        setReportData(mappedData);
      } catch (err: any) {
        toast.error("Error loading report: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [institutionId, departmentId]);

  const handleDownloadCSV = () => {
    try {
      const headers = ["Name", "Role", "Department", "Trees Planted", "Carbon Points", "Grade"];
      const rows = reportData.map((r: any) => [
        r.name,
        r.role,
        departmentId,
        r.treesPlanted,
        r.totalPoints,
        r.grade
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${departmentId}_Plantation_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully!");
    } catch {
      toast.error("Failed to generate CSV report.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Summary counts
  const totalTreesPlanted = reportData.reduce((acc, curr) => acc + curr.treesPlanted, 0);
  const totalDepartmentPoints = reportData.reduce((acc, curr) => acc + curr.totalPoints, 0);
  
  // Scoped survival rate
  let deptVerifiedAliveCount = 0;
  let deptVerifiedTotalCount = 0;
  reportData.forEach((r: any) => {
    r.trees.forEach((t: any) => {
      deptVerifiedTotalCount++;
      if (t.status === 'Alive') deptVerifiedAliveCount++;
    });
  });
  const departmentSurvivalRate = deptVerifiedTotalCount > 0 ? Math.round((deptVerifiedAliveCount / deptVerifiedTotalCount) * 100) : 100;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Department Reports & Audits</h1>
          <p className="text-muted-foreground mt-1">Detailed plantation audits and student grades for the {departmentId} department.</p>
        </div>
        <div>
          <Button 
            onClick={handleDownloadCSV}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export Department data (CSV)
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Department Verified Trees</p>
              <h3 className="text-3xl font-bold font-heading">{totalTreesPlanted}</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-primary/10">
              <Trees className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Department Carbon Points</p>
              <h3 className="text-3xl font-bold font-heading">{totalDepartmentPoints}</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-accent/10">
              <Award className="h-6 w-6 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Department Survival Rate</p>
              <h3 className="text-3xl font-bold font-heading">{departmentSurvivalRate}%</h3>
            </div>
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-success/10">
              <Percent className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Report Table */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Plantation Audit Ledger
          </CardTitle>
          <CardDescription>
            Lists active students and faculty coordinators in your department, their carbon points, and grading metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified Plantations</TableHead>
                <TableHead>Carbon Points</TableHead>
                <TableHead>Academic Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                    No members found in this department.
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold text-sm">{row.name}</TableCell>
                    <TableCell className="text-xs">{row.role}</TableCell>
                    <TableCell>{row.treesPlanted} Trees</TableCell>
                    <TableCell className="font-bold text-primary">{row.totalPoints} pts</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        row.grade === 'A+' ? 'bg-success/15 text-success' :
                        row.grade === 'A' ? 'bg-primary/15 text-primary' :
                        row.grade === 'B' ? 'bg-warning/15 text-warning' :
                        'bg-destructive/15 text-destructive'
                      }`}>
                        {row.grade}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
