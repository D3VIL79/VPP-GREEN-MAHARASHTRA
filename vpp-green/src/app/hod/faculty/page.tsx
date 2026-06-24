"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trees, Check, X, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function HodFacultyPage() {
  const { user } = useAuthStore();
  const departmentId = user?.departmentId || "Computer Engineering";
  const institutionId = user?.institutionId;
  const [facultyMembers, setFacultyMembers] = useState<any[]>([]);
  const [facultyPlantations, setFacultyPlantations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Appoint faculty dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyPhone, setNewFacultyPhone] = useState("");
  const [newFacultyEmail, setNewFacultyEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      // 1. Fetch Faculty members in this department
      const { data: faculty, error: facultyError } = await supabase
        .from('users')
        .select('*, plantations!plantations_user_id_fkey(*), leaderboard_points(points)')
        .eq('role', 'faculty')
        .eq('institution_id', institutionId)
        .eq('department', departmentId);

      if (facultyError) throw facultyError;

      // Map faculty records with total trees and points
      let mappedFaculty = faculty.map((f: any) => {
        const verifiedTrees = f.plantations?.filter((p: any) => p.verification_status === 'verified').length || 0;
        const totalPoints = f.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
        return {
          id: f.id,
          name: f.full_name,
          email: f.email,
          mobile: f.mobile,
          status: f.is_active ? 'ACTIVE' : 'INACTIVE',
          trees: verifiedTrees,
          points: totalPoints,
        };
      });


      setFacultyMembers(mappedFaculty);

      // 2. Fetch plantations uploaded by faculty in this department that are pending HOD verification
      const { data: plantations, error: plantError } = await supabase
        .from('plantations')
        .select('*, users!inner(*), tree_species(*)')
        .eq('users.role', 'faculty')
        .eq('users.department', departmentId)
        .eq('users.institution_id', institutionId);

      if (plantError) throw plantError;

      let finalPlantations = plantations || [];


      setFacultyPlantations(finalPlantations);
    } catch (err: any) {
      toast.error("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [institutionId, departmentId]);

  const handleVerify = async (plantationId: string, status: 'verified' | 'rejected', rejectionReason?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from('plantations')
        .update({
          verification_status: status,
          verified_by: session.session.user.id,
          verified_on: new Date().toISOString(),
          rejection_reason: rejectionReason || null
        })
        .eq('id', plantationId);

      if (error) throw error;

      // Insert reward points if verified
      if (status === 'verified') {
        const pRecord = facultyPlantations.find((p: any) => p.id === plantationId);
        if (pRecord) {
          await supabase.from('leaderboard_points').insert({
            user_id: pRecord.user_id,
            plantation_id: plantationId,
            activity_type: 'plantation_verification',
            points: 30
          });

          await supabase.from('notifications').insert({
            user_id: pRecord.user_id,
            title: "Staff Tree Verified! 🌳",
            message: `Your tree has been verified by Department HOD. 30 Carbon Points awarded.`,
            notification_type: 'plantation_approved',
            reference_id: plantationId
          });
        }
      }

      toast.success(`Tree successfully ${status}`);
      fetchData(); // Reload
    } catch (err: any) {
      toast.error("Verification failed: " + err.message);
    }
  };

  const handleAppointFaculty = async () => {
    if (!newFacultyName.trim()) return toast.error("Faculty name is required.");
    if (!newFacultyPhone || newFacultyPhone.trim().length !== 10) return toast.error("Valid 10-digit mobile number is required.");
    if (!institutionId) return toast.error("No institution ID found for your HOD profile.");

    setIsSubmitting(true);
    try {
      await authApi.registerUserAdmin({
        name: newFacultyName.trim(),
        phone: newFacultyPhone.trim(),
        role: "faculty",
        institutionId: institutionId,
        department: departmentId,
        email: newFacultyEmail.trim() || undefined,
        password: "Password123!"
      });
      toast.success(`${newFacultyName} has been successfully appointed as a coordinator.`);
      setIsAddOpen(false);
      setNewFacultyName("");
      setNewFacultyPhone("");
      setNewFacultyEmail("");
      fetchData();
    } catch (e: any) {
      toast.error(`Error appointing faculty: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingFacultyPlanted = facultyPlantations.filter((p: any) => p.verification_status === 'pending');

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Faculty Coordinators</h1>
          <p className="text-muted-foreground mt-1">
            Review coordinates, manage active statuses, and verify staff tree plantations for {departmentId}.
          </p>
        </div>
        <div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddOpen(true)}>
            Appoint Faculty
          </Button>
        </div>
      </div>

      {/* Staff Tree Plantation Pending Verification */}
      {pendingFacultyPlanted.length > 0 && (
        <Card className="border-warning/30 bg-warning/5 backdrop-blur-xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <div>
              <CardTitle className="text-warning">Staff Plantations Pending HOD Approval</CardTitle>
              <CardDescription>Faculties belonging to your department have registered their own trees. Verification must be done by you.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingFacultyPlanted.map((p: any) => (
                <div key={p.id} className="p-4 bg-card border border-border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4">
                    <img src={p.plantation_photo} alt="Plantation" className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.users?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{p.tree_species?.species_name} • GPS: {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</p>
                      <p className="text-xs text-muted-foreground italic mt-1">&quot;{p.remarks || 'No remarks'}&quot;</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      size="sm" 
                      onClick={() => handleVerify(p.id, 'verified')}
                      className="bg-success hover:bg-success/90 text-white rounded-full flex-1 md:flex-none"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const reason = prompt("Enter rejection reason:");
                        if (reason) handleVerify(p.id, 'rejected', reason);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/5 rounded-full flex-1 md:flex-none"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Faculty Coordinators List */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Departmental Coordinators</CardTitle>
          <CardDescription>Coordinators running tree plantation monitoring for mentees in {departmentId}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified Trees</TableHead>
                <TableHead>Carbon Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground italic">
                    No faculty coordinators registered in this department yet.
                  </TableCell>
                </TableRow>
              ) : (
                facultyMembers.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell className="font-medium">
                      <div>{fac.name}</div>
                      <span className="text-[10px] font-mono text-muted-foreground">{fac.id.substring(0,8)}...</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{fac.email || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{fac.mobile}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fac.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {fac.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Trees className="h-4 w-4 text-success" />
                        {fac.trees}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">{fac.points} pts</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Appoint Faculty Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Appoint Faculty Coordinator</DialogTitle>
            <DialogDescription>
              Register and authorize a faculty member to manage verification roles in the {departmentId} department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="facName">Full Name</Label>
              <Input 
                id="facName"
                placeholder="E.g. Dr. A. Patil"
                value={newFacultyName} 
                onChange={(e) => setNewFacultyName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facPhone">10-Digit Phone Number</Label>
              <Input 
                id="facPhone"
                placeholder="E.g. 9876543210"
                value={newFacultyPhone} 
                onChange={(e) => setNewFacultyPhone(e.target.value)}
                className="bg-background/50"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facEmail">Email Address (Optional)</Label>
              <Input 
                id="facEmail"
                type="email"
                placeholder="E.g. patil@example.com"
                value={newFacultyEmail} 
                onChange={(e) => setNewFacultyEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Input disabled value={departmentId} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input disabled value="Faculty Coordinator" className="bg-muted/50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleAppointFaculty} disabled={isSubmitting}>
              {isSubmitting ? "Appointing..." : "Appoint Coordinator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
