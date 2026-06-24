"use client";

import { useEffect, useState } from "react";
import { Users, Search, Download, Eye, Award, Loader2, Trees, UserPlus, MoreVertical, Ban, Trash2, ShieldAlert, Leaf, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { userApi, studentApi, authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { downloadCSV } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

const INSTITUTION_DEPARTMENTS: Record<string, string[]> = {
  '00000000-0000-0000-0000-000000000001': [
    'Computer Engineering',
    'Information Technology',
    'Computer Science & Engineering (AI & ML, Data Science)',
    'Electronics & Computer Science',
    'Mechatronics Engineering',
    'Fine Art',
  ],
  '00000000-0000-0000-0000-000000000002': [
    'Department of Law',
  ],
  '00000000-0000-0000-0000-000000000003': [
    'Department of Architecture',
  ],
};

export default function InstitutionStudents() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPointsOpen, setIsPointsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPoints, setNewPoints] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentDept, setNewStudentDept] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("FE");
  const [deptOptions, setDeptOptions] = useState<string[]>([]);

  useEffect(() => {
    if (user?.institutionId) {
      supabase.from('institutions')
        .select('departments')
        .eq('id', user.institutionId)
        .single()
        .then(({ data }) => {
          if (data?.departments) {
            setDeptOptions(data.departments);
            if (data.departments.length > 0) {
              setNewStudentDept(data.departments[0]);
            }
          }
        });
    }
  }, [isAddOpen, user]);

  useEffect(() => {
    if (user?.institutionId) {
      fetchStudents(user.institutionId);
    }
  }, [user]);

  const fetchStudents = async (institutionId: string) => {
    try {
      setIsLoading(true);
      const res = await studentApi.list({ institutionId });
      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (students.length === 0) return toast.error("No students to export.");
    downloadCSV(students, "Institution_Students_Directory.csv");
  };

  const handleViewProfile = async (student: any) => {
    // Fetch individual tree records for the selected student from the database if they are a real user
    let treeRecords = student.treeRecords || [];
    if (!student.id.startsWith('stu-') && !student.id.startsWith('USR-')) {
      try {
        const { data, error } = await supabase
          .from('plantations')
          .select('*, tree_species(*)')
          .eq('user_id', student.id);
        if (!error && data) {
          treeRecords = data.map((t: any) => ({
            id: t.id.substring(0, 8),
            species: t.tree_species?.species_name || 'Unknown',
            plantedDate: new Date(t.plantation_date).toLocaleDateString(),
            health: t.verification_status === 'verified' ? 'Healthy' : (t.verification_status === 'pending' ? 'Pending' : 'Rejected'),
            carbonKg: (t.tree_species?.average_co2_kg_per_year || 18.5).toFixed(1)
          }));
        }
      } catch (err) {
        console.error("Failed to fetch student tree records", err);
      }
    }
    setSelectedStudent({
      ...student,
      treeRecords
    });
    setIsProfileOpen(true);
  };

  const handleManagePointsOpen = (student: any) => {
    setSelectedStudent(student);
    setNewPoints(student.points.toString());
    setIsPointsOpen(true);
  };

  const handleSavePoints = async () => {
    if (selectedStudent && newPoints) {
      try {
        // If it is a database user, we can insert points into leaderboard_points
        if (!selectedStudent.id.startsWith('stu-') && !selectedStudent.id.startsWith('USR-')) {
          const { error } = await supabase.from('leaderboard_points').insert({
            user_id: selectedStudent.id,
            activity_type: 'admin_adjustment',
            points: parseInt(newPoints) - selectedStudent.points
          });
          if (error) throw error;
        }
        toast.success(`Points successfully updated to ${newPoints} for ${selectedStudent.name}.`);
        setStudents(students.map(s => s.id === selectedStudent.id ? {...s, points: parseInt(newPoints)} : s));
        setIsPointsOpen(false);
      } catch (err: any) {
        toast.error(`Failed to update points: ${err.message}`);
      }
    } else {
      toast.error("Please enter a valid points value.");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return toast.error("Student name is required.");
    if (!newStudentPhone || newStudentPhone.trim().length !== 10) return toast.error("Valid 10-digit phone number is required.");
    
    setIsLoading(true);
    try {
      await authApi.registerUserAdmin({
        name: newStudentName.trim(),
        phone: newStudentPhone.trim(),
        role: "student",
        institutionId: user?.institutionId,
        department: newStudentDept,
        classYear: newStudentYear,
        password: "Password123!"
      });
      toast.success(`${newStudentName} has been successfully added to ${newStudentDept}. Default password is Password123!`);
      setIsAddOpen(false);
      setNewStudentName("");
      setNewStudentPhone("");
      setNewStudentYear("FE");
      if (user?.institutionId) {
        fetchStudents(user.institutionId);
      }
    } catch (e: any) {
      toast.error(`Error adding student: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendStudent = async (student: any) => {
    const isSuspending = student.status === 'Active';
    try {
      if (!student.id.startsWith('stu-') && !student.id.startsWith('USR-')) {
        const { error } = await supabase
          .from('users')
          .update({ is_active: !isSuspending })
          .eq('id', student.id);
        if (error) throw error;
      }
      setStudents(students.map(s => s.id === student.id ? {...s, status: isSuspending ? 'Suspended' : 'Active'} : s));
      if (isSuspending) toast.error(`${student.name} has been suspended from the plantation program.`);
      else toast.success(`${student.name}'s suspension has been lifted.`);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm(`Are you sure you want to remove ${student.name}?`)) return;
    try {
      if (!student.id.startsWith('stu-') && !student.id.startsWith('USR-')) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', student.id);
        if (error) throw error;
      }
      setStudents(students.filter(s => s.id !== student.id));
      toast.success(`${student.name} was removed from the institution records.`);
    } catch (err: any) {
      toast.error(`Failed to delete student: ${err.message}`);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Student Directory</h1>
          <p className="text-muted-foreground mt-1">Manage and track student involvement for your institution.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" className="bg-card/50 backdrop-blur-sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Student
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Enrolled Students ({students.length})</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search Roll No, Name..." 
                  className="pl-9 bg-background/50" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Planted Trees</TableHead>
                  <TableHead className="text-right">Carbon Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                      Loading student records...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No students found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-xs text-muted-foreground" title={student.id}>{student.id.substring(0,8)}...</TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div>{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.mobile}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.dept}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">{student.institutionName}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{student.year}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={student.status === 'Active' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{student.trees}</TableCell>
                      <TableCell className="text-right text-primary font-semibold">{student.points} pts</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted outline-none">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px] bg-card border-border/50 backdrop-blur-xl">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewProfile(student)}>
                              <Eye className="mr-2 h-4 w-4 text-primary" /> View Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManagePointsOpen(student)}>
                              <Award className="mr-2 h-4 w-4 text-warning" /> Manage Points
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspendStudent(student)}>
                              <Ban className="mr-2 h-4 w-4 text-destructive" /> {student.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student)} className="text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tree Analytics Report Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl bg-card border-border/50 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Student Analytics Report
            </DialogTitle>
            <DialogDescription>
              Detailed plantation and carbon sequestration metrics for {selectedStudent?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shadow-inner">
                    {selectedStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedStudent.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedStudent.dept} • {selectedStudent.year}</p>
                    <Badge variant="outline" className="mt-1 bg-background/50">{selectedStudent.status}</Badge>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Card className="bg-background/50 border-border/50 shadow-none min-w-[120px]">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Trees className="h-6 w-6 text-success mb-2" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Trees</p>
                      <p className="text-2xl font-bold">{selectedStudent.trees}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-background/50 border-border/50 shadow-none min-w-[120px]">
                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                      <Wind className="h-6 w-6 text-info mb-2" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Carbon Recycled</p>
                      <p className="text-2xl font-bold text-info">{selectedStudent.totalCarbon} kg</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Tree Table Analytics */}
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-success" />
                  Individual Tree Records
                </h4>
                <div className="rounded-md border border-border/50 overflow-hidden bg-background/50">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Tree ID</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Planted On</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead className="text-right">Carbon Recycled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.treeRecords?.length > 0 ? (
                        selectedStudent.treeRecords.map((tree: any) => (
                          <TableRow key={tree.id}>
                            <TableCell className="font-medium text-xs font-mono text-muted-foreground">{tree.id}</TableCell>
                            <TableCell>{tree.species}</TableCell>
                            <TableCell className="text-sm">{tree.plantedDate}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                tree.health === 'Healthy' || tree.health === 'verified' ? 'bg-success/10 text-success border-success/20' : 
                                tree.health === 'Needs Water' || tree.health === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                                'bg-destructive/10 text-destructive border-destructive/20'
                              }>
                                {tree.health}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-info">{tree.carbonKg} kg</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No tree records found.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={isPointsOpen} onOpenChange={setIsPointsOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Manage Carbon Points</DialogTitle>
            <DialogDescription>
              Update carbon points for {selectedStudent?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Carbon Points</label>
              <Input 
                type="number" 
                value={newPoints} 
                onChange={(e) => setNewPoints(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPointsOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSavePoints}>Save Points</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
            <DialogDescription>
              Manually onboard a student into the green program.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                placeholder="E.g. Rahul Sharma"
                value={newStudentName} 
                onChange={(e) => setNewStudentName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">10-Digit Phone Number</label>
              <Input 
                placeholder="E.g. 9876543210"
                value={newStudentPhone} 
                onChange={(e) => setNewStudentPhone(e.target.value)}
                className="bg-background/50"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newStudentDept}
                onChange={(e) => setNewStudentDept(e.target.value)}
              >
                {deptOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Year</label>
              <select
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleAddStudent} disabled={isLoading}>
              {isLoading ? "Onboarding..." : "Onboard Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
