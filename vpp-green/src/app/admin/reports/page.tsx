"use client";

import { useState } from "react";
import { FileText, Download, Loader2, Users, Trees, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminReports() {
  const [downloadingUsers, setDownloadingUsers] = useState(false);
  const [downloadingPlantations, setDownloadingPlantations] = useState(false);
  const [downloadingInstitutions, setDownloadingInstitutions] = useState(false);

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadUsers = async () => {
    setDownloadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, institutions(name), plantations!plantations_user_id_fkey(id, verification_status), leaderboard_points(points)');

      if (error) throw error;
      if (!data || data.length === 0) return toast.info("No data available.");

      const rows = data.map(u => {
        const verifiedTrees = u.plantations?.filter((p: any) => p.verification_status === 'verified').length || 0;
        const totalPoints = u.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
        return [
          u.id, `"${u.full_name || ''}"`, u.role, `"${u.department || ''}"`, 
          `"${u.institutions?.name || 'Global'}"`, u.mobile, u.email, 
          u.is_active ? 'Active' : 'Suspended', verifiedTrees, totalPoints,
          `"${u.created_at || ''}"`
        ];
      });

      downloadCSV("VPP_Green_Users_Report", ["ID", "Name", "Role", "Department", "Institution", "Mobile", "Email", "Status", "Verified Trees", "Total Points", "Created At"], rows);
      toast.success("Users Report downloaded successfully.");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloadingUsers(false);
    }
  };

  const handleDownloadPlantations = async () => {
    setDownloadingPlantations(true);
    try {
      const { data, error } = await supabase
        .from('plantations')
        .select('*, tree_species(name), users(full_name), institutions(name)');

      if (error) throw error;
      if (!data || data.length === 0) return toast.info("No plantations available.");

      const rows = data.map(p => [
        p.id, `"${p.users?.full_name || ''}"`, `"${p.institutions?.name || ''}"`, 
        `"${p.tree_species?.name || 'Unknown'}"`, `"${p.location_lat || ''}"`, `"${p.location_lng || ''}"`, 
        `"${p.address || ''}"`, p.health_status, p.verification_status, `"${p.created_at || ''}"`
      ]);

      downloadCSV("VPP_Green_Plantations_Report", ["Plantation ID", "Planter Name", "Institution", "Species", "Latitude", "Longitude", "Address", "Health", "Verification", "Date"], rows);
      toast.success("Plantations Report downloaded successfully.");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloadingPlantations(false);
    }
  };

  const handleDownloadInstitutions = async () => {
    setDownloadingInstitutions(true);
    try {
      const { data, error } = await supabase.from('institutions').select('*');
      if (error) throw error;
      if (!data || data.length === 0) return toast.info("No institutions available.");

      const rows = data.map(i => [
        i.id, `"${i.name || ''}"`, `"${i.address || ''}"`, `"${i.district || ''}"`, 
        `"${i.state || ''}"`, `"${i.created_at || ''}"`
      ]);

      downloadCSV("VPP_Green_Institutions_Report", ["ID", "Name", "Address", "District", "State", "Date Created"], rows);
      toast.success("Institutions Report downloaded successfully.");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    } finally {
      setDownloadingInstitutions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">State Reports</h1>
          <p className="text-muted-foreground mt-1">Export official environmental impact statistics.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Users & Points Report</CardTitle>
            <CardDescription>Comprehensive dataset of all users, their activity, roles, and total points.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex gap-2" onClick={handleDownloadUsers} disabled={downloadingUsers}>
              {downloadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloadingUsers ? "Generating..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <Trees className="h-8 w-8 text-success mb-2" />
            <CardTitle>Plantations Log</CardTitle>
            <CardDescription>All plantation records including locations, health statuses, and verifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex gap-2" onClick={handleDownloadPlantations} disabled={downloadingPlantations}>
              {downloadingPlantations ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloadingPlantations ? "Generating..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle>Institutions List</CardTitle>
            <CardDescription>List of all affiliated colleges, schools, and organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full flex gap-2" onClick={handleDownloadInstitutions} disabled={downloadingInstitutions}>
              {downloadingInstitutions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloadingInstitutions ? "Generating..." : "Download CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
