"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { studentApi, authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trees, GraduationCap, Trophy, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function HodStudentsPage() {
  const { user } = useAuthStore();
  const departmentId = user?.departmentId || "Computer Engineering";
  const institutionId = user?.institutionId;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Onboard student state variables
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("FE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    if (!institutionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, plantations!plantations_user_id_fkey(*), leaderboard_points(points)')
        .eq('role', 'student')
        .eq('institution_id', institutionId);

      if (error) throw error;

      // Filter in-memory to be case-insensitive and trim whitespaces
      const filteredData = (data || []).filter((student: any) => 
        student.department?.toLowerCase().trim() === departmentId.toLowerCase().trim()
      );

      let mappedStudents = filteredData.map((student: any) => {
        const verifiedTrees = student.plantations?.filter((p: any) => p.verification_status === 'verified').length || 0;
        const pendingTrees = student.plantations?.filter((p: any) => p.verification_status === 'pending').length || 0;
        const totalPoints = student.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
        return {
          id: student.id,
          name: student.full_name,
          email: student.email,
          mobile: student.mobile,
          roll: student.mobile ? `VPP-STU-${student.mobile.slice(-4)}` : 'VPP-STU-MOCK',
          year: student.class_year || 'TE',
          trees: verifiedTrees,
          pending: pendingTrees,
          points: totalPoints,
        };
      });

      if (mappedStudents.length === 0) {
        const res = await studentApi.list({ institutionId });
        mappedStudents = res.data.filter((s: any) => 
          s.dept?.toLowerCase().trim() === departmentId.toLowerCase().trim()
        );
      }

      setStudents(mappedStudents);
    } catch (err: any) {
      toast.error("Error loading students: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [institutionId, departmentId]);

  const handleOnboardStudent = async () => {
    if (!newStudentName.trim()) return toast.error("Student name is required.");
    if (!newStudentPhone || newStudentPhone.trim().length !== 10) return toast.error("Valid 10-digit mobile number is required.");
    if (!institutionId) return toast.error("No institution ID found for HOD profile.");

    setIsSubmitting(true);
    try {
      await authApi.registerUserAdmin({
        name: newStudentName.trim(),
        phone: newStudentPhone.trim(),
        role: "student",
        institutionId: institutionId,
        department: departmentId,
        classYear: newStudentYear,
        email: newStudentEmail.trim() || undefined,
        password: "Password123!"
      });
      toast.success(`${newStudentName} onboarded successfully! Default password is Password123!`);
      setIsAddOpen(false);
      setNewStudentName("");
      setNewStudentPhone("");
      setNewStudentEmail("");
      setNewStudentYear("FE");
      fetchStudents();
    } catch (e: any) {
      toast.error(`Error onboarding student: ${e.message}`);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Departmental Student Directory</h1>
          <p className="text-muted-foreground mt-1">
            Registered students enrolled in {departmentId} department.
          </p>
        </div>
        <div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2 inline" /> Onboard Student
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Students List
          </CardTitle>
          <CardDescription>
            Lists active students in your department with their tree counts and total carbon points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll ID</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Verified Trees</TableHead>
                <TableHead>Pending Approval</TableHead>
                <TableHead>Carbon Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground italic">
                    No students registered in {departmentId} yet.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <p className="font-semibold text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{student.roll}</TableCell>
                    <TableCell className="uppercase text-xs">{student.year}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Trees className="h-4 w-4 text-success" />
                        {student.trees}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${student.pending > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                        {student.pending} pending
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <Trophy className="h-4 w-4 text-accent" />
                        {student.points} pts
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Onboard Student Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Onboard Student</DialogTitle>
            <DialogDescription>
              Create a new student account scoped to the {departmentId} department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="stuName">Full Name</Label>
              <Input 
                id="stuName"
                placeholder="E.g. Rahul Sharma"
                value={newStudentName} 
                onChange={(e) => setNewStudentName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stuPhone">10-Digit Phone Number</Label>
              <Input 
                id="stuPhone"
                placeholder="E.g. 9876543210"
                value={newStudentPhone} 
                onChange={(e) => setNewStudentPhone(e.target.value)}
                className="bg-background/50"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stuEmail">Email Address (Optional)</Label>
              <Input 
                id="stuEmail"
                type="email"
                placeholder="E.g. rahul@example.com"
                value={newStudentEmail} 
                onChange={(e) => setNewStudentEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stuYear">Class Year</Label>
                <select
                  id="stuYear"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newStudentYear}
                  onChange={(e) => setNewStudentYear(e.target.value)}
                >
                  <option value="FE">First Year (FE)</option>
                  <option value="SE">Second Year (SE)</option>
                  <option value="TE">Third Year (TE)</option>
                  <option value="BE">Fourth Year (BE)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input disabled value={departmentId} className="bg-muted/50" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleOnboardStudent} disabled={isSubmitting}>
              {isSubmitting ? "Onboarding..." : "Onboard Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
