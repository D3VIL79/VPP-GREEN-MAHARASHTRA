"use client";

import { useEffect, useState } from "react";
import { Users, Search, Download, Eye, Loader2, UserPlus, MoreVertical, Ban, Trash2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { authApi } from "@/lib/api";

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

export default function InstitutionFaculty() {
  const { user } = useAuthStore();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyDept, setNewFacultyDept] = useState("");
  const [newFacultyPhone, setNewFacultyPhone] = useState("");
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
              setNewFacultyDept(data.departments[0]);
            }
          }
        });
    }
  }, [isAddOpen, user]);

  useEffect(() => {
    if (user?.institutionId) {
      fetchFaculty(user.institutionId);
    }
  }, [user]);

  const fetchFaculty = async (institutionId: string) => {
    try {
      setIsLoading(true);
      
      const { data: dbFaculty, error } = await supabase
        .from('users')
        .select('*, plantations!plantations_user_id_fkey(*), leaderboard_points(points)')
        .eq('role', 'faculty')
        .eq('institution_id', institutionId);

      if (error) throw error;

      const dbMapped = dbFaculty.map((f: any) => {
        const verifiedTrees = f.plantations?.filter((p: any) => p.verification_status === 'verified').length || 0;
        const totalPoints = f.leaderboard_points?.reduce((acc: number, curr: any) => acc + curr.points, 0) || 0;
        return {
          id: f.id,
          name: f.full_name,
          dept: f.department || 'General',
          institutionName: getInstitutionName(f.institution_id),
          verifications: verifiedTrees,
          status: f.is_active ? 'Active' : 'Suspended',
          mobile: f.mobile,
          email: f.email
        };
      });

      const combined = [...dbMapped];
      
      setFaculty(combined);
    } catch (error) {
      console.error("Failed to load faculty", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInstitutionName = (id: string) => {
    if (!id) return 'Global';
    if (id === '00000000-0000-0000-0000-000000000001') return "Vasantdada Patil Pratishthan's College of Engineering & Visual Arts";
    if (id === '00000000-0000-0000-0000-000000000002') return 'VPP Law';
    if (id === '00000000-0000-0000-0000-000000000003') return 'Manohar Phalke College of Architecture';
    return id;
  };

  const handleExport = () => {
    if (faculty.length === 0) return toast.error("No faculty to export.");
    downloadCSV(faculty, "Institution_Faculty_Directory.csv");
  };

  const handleViewProfile = (f: any) => {
    setSelectedFaculty(f);
    setIsProfileOpen(true);
  };

  const handleAddFaculty = async () => {
    if (!newFacultyName.trim()) return toast.error("Faculty name is required.");
    if (!newFacultyPhone || newFacultyPhone.trim().length !== 10) return toast.error("Valid 10-digit mobile number is required.");
    
    setIsLoading(true);
    try {
      await authApi.registerUserAdmin({
        name: newFacultyName.trim(),
        phone: newFacultyPhone.trim(),
        role: "faculty",
        institutionId: user?.institutionId,
        department: newFacultyDept,
        password: "Password123!"
      });
      toast.success(`${newFacultyName} has been successfully added as a faculty verifier.`);
      setIsAddOpen(false);
      setNewFacultyName("");
      setNewFacultyPhone("");
      if (user?.institutionId) {
        fetchFaculty(user.institutionId);
      }
    } catch (e: any) {
      toast.error(`Error adding faculty: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendFaculty = async (f: any) => {
    const isSuspending = f.status === 'Active';
    try {
      if (!f.id.startsWith('FAC-')) {
        const { error } = await supabase
          .from('users')
          .update({ is_active: !isSuspending })
          .eq('id', f.id);
        if (error) throw error;
      }
      setFaculty(faculty.map(item => item.id === f.id ? {...item, status: isSuspending ? 'Suspended' : 'Active'} : item));
      if (isSuspending) toast.error(`Verification privileges for ${f.name} have been suspended.`);
      else toast.success(`${f.name} has been reinstated.`);
    } catch (err: any) {
      toast.error(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteFaculty = async (f: any) => {
    if (!confirm(`Are you sure you want to remove ${f.name}?`)) return;
    try {
      if (!f.id.startsWith('FAC-')) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', f.id);
        if (error) throw error;
      }
      setFaculty(faculty.filter(item => item.id !== f.id));
      toast.success(`${f.name} was removed from the institution records.`);
    } catch (err: any) {
      toast.error(`Failed to delete faculty: ${err.message}`);
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Faculty Directory</h1>
          <p className="text-muted-foreground mt-1">Manage verification staff and faculty members.</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" className="bg-card/50 backdrop-blur-sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={() => setIsAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Faculty
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Assigned Faculty ({faculty.length})</CardTitle>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ID, Name..." 
                className="pl-9 bg-background/50" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Faculty ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Verifications</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                      Loading faculty records...
                    </TableCell>
                  </TableRow>
                ) : filteredFaculty.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No faculty found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaculty.map((f) => (
                    <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground" title={f.id}>{f.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div>{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.mobile}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.dept}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20">{f.institutionName}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={f.status === 'Active' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{f.verifications}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewProfile(f)}>
                              <Eye className="mr-2 h-4 w-4 text-primary" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspendFaculty(f)}>
                              <Ban className="mr-2 h-4 w-4 text-destructive" /> {f.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteFaculty(f)} className="text-destructive focus:bg-destructive/10">
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

      {/* Add Faculty Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Register New Faculty</DialogTitle>
            <DialogDescription>
              Assign verification roles to a new faculty member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                placeholder="E.g. Dr. A. Patil"
                value={newFacultyName} 
                onChange={(e) => setNewFacultyName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">10-Digit Phone Number</label>
              <Input 
                placeholder="E.g. 9876543210"
                value={newFacultyPhone} 
                onChange={(e) => setNewFacultyPhone(e.target.value)}
                className="bg-background/50"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={newFacultyDept}
                onChange={(e) => setNewFacultyDept(e.target.value)}
              >
                {deptOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleAddFaculty} disabled={isLoading}>
              {isLoading ? "Adding Faculty..." : "Add Faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Faculty Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Faculty Profile
            </DialogTitle>
          </DialogHeader>
          {selectedFaculty && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shadow-inner">
                  {selectedFaculty.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selectedFaculty.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedFaculty.dept}</p>
                  <Badge variant="outline" className="mt-1 bg-background/50">{selectedFaculty.status}</Badge>
                </div>
              </div>
              <div className="space-y-2 border-t border-border/50 pt-4">
                <p className="text-sm text-muted-foreground"><strong>ID:</strong> {selectedFaculty.id}</p>
                <p className="text-sm text-muted-foreground"><strong>Mobile:</strong> {selectedFaculty.mobile || 'N/A'}</p>
                <p className="text-sm text-muted-foreground"><strong>Email:</strong> {selectedFaculty.email || 'N/A'}</p>
                <p className="text-sm text-muted-foreground"><strong>Verifications:</strong> {selectedFaculty.verifications}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
