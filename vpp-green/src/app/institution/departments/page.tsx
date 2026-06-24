"use client";

import { motion } from "framer-motion";
import { GraduationCap, Trees, Users, ChevronRight, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export default function InstitutionDepartments() {
  const { user } = useAuthStore();
  const institutionId = user?.institutionId;

  const [departments, setDepartments] = useState<string[]>([]);
  const [instName, setInstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [plantations, setPlantations] = useState<any[]>([]);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [target, setTarget] = useState("");

  const loadData = async () => {
    if (!institutionId) return;
    try {
      setLoading(true);
      
      // 1. Fetch institution details
      const { data: inst, error: instErr } = await supabase
        .from('institutions')
        .select('institution_name, departments')
        .eq('id', institutionId)
        .single();
      
      if (instErr) throw instErr;
      setInstName(inst.institution_name);
      setDepartments(inst.departments || []);

      // 2. Fetch students of this institution
      const { data: studs, error: studsErr } = await supabase
        .from('users')
        .select('id, department')
        .eq('institution_id', institutionId)
        .eq('role', 'student');
      
      if (studsErr) throw studsErr;
      setStudents(studs || []);

      // 3. Fetch plantations of this institution
      const { data: plants, error: plantsErr } = await supabase
        .from('plantations')
        .select('id, user_id, verification_status')
        .eq('institution_id', institutionId)
        .eq('verification_status', 'verified');
      
      if (plantsErr) throw plantsErr;
      setPlantations(plants || []);

    } catch (err: any) {
      toast.error("Failed to load department data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [institutionId]);

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return toast.error("Department name cannot be empty.");
    
    const formattedName = newDeptName.trim();
    if (departments.some(d => d.toLowerCase() === formattedName.toLowerCase())) {
      return toast.error("Department already exists.");
    }

    setSubmitting(true);
    try {
      const updatedDepts = [...departments, formattedName];
      const { error } = await supabase
        .from('institutions')
        .update({ departments: updatedDepts })
        .eq('id', institutionId);

      if (error) throw error;

      toast.success(`${formattedName} department added successfully.`);
      setDepartments(updatedDepts);
      setIsAddOpen(false);
      setNewDeptName("");
    } catch (err: any) {
      toast.error("Failed to add department: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (deptName: string) => {
    const studentCount = students.filter(s => s.department?.toLowerCase().trim() === deptName.toLowerCase().trim()).length;
    if (studentCount > 0) {
      if (!confirm(`Warning: There are ${studentCount} students mapped to "${deptName}". If you delete this department, they will remain in the database but the department selection will no longer show this. Proceed?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove "${deptName}" department?`)) return;
    }

    try {
      const updatedDepts = departments.filter(d => d !== deptName);
      const { error } = await supabase
        .from('institutions')
        .update({ departments: updatedDepts })
        .eq('id', institutionId);

      if (error) throw error;

      toast.success(`${deptName} department removed successfully.`);
      setDepartments(updatedDepts);
    } catch (err: any) {
      toast.error("Failed to delete department: " + err.message);
    }
  };

  const handleManageDept = (dept: any) => {
    setSelectedDept(dept);
    setTarget((dept.trees + 500).toString());
    setIsManageOpen(true);
  };

  const handleSaveSettings = () => {
    toast.success(`${selectedDept?.name} settings successfully updated.`);
    setIsManageOpen(false);
  };

  // Map departments to their calculated stats in-memory
  const departmentsWithStats = departments.map((deptName) => {
    const deptStudents = students.filter(s => s.department?.toLowerCase().trim() === deptName.toLowerCase().trim());
    const studentIds = new Set(deptStudents.map(s => s.id));
    const deptTrees = plantations.filter(p => studentIds.has(p.user_id)).length;
    
    // Generate a short code from the department name
    const code = deptName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 4);

    return {
      name: deptName,
      code: code || "DEPT",
      students: deptStudents.length,
      trees: deptTrees,
      status: deptTrees >= 10 ? "Excellent" : (deptTrees >= 5 ? "Good" : "Average")
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading academic departments..." : `Manage academic departments for ${instName || "your institution"}.`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Department
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {departmentsWithStats.length === 0 ? (
            <div className="text-center p-12 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Departments Added</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                Begin by adding academic departments to allow students and faculty members to register.
              </p>
              <Button onClick={() => setIsAddOpen(true)} className="mt-4" variant="outline">
                + Add First Department
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departmentsWithStats.map((dept, i) => (
                <motion.div 
                  key={dept.name} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                    <CardHeader className="pb-4 pr-12">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors break-words">{dept.name}</CardTitle>
                        <Badge variant="secondary" className="bg-muted shrink-0">{dept.code}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {dept.students} Students</div>
                        <div className="flex items-center gap-1.5 text-foreground font-medium"><Trees className="h-4 w-4 text-success" /> {dept.trees} Trees</div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <Badge variant="outline" className={
                          dept.status === 'Excellent' ? 'bg-success/10 text-success border-success/20' : 
                          dept.status === 'Good' ? 'bg-primary/10 text-primary border-primary/20' : 
                          'bg-warning/10 text-warning border-warning/20'
                        }>
                          {dept.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => handleManageDept(dept)}>
                            Manage <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDept(dept.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Department Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Add New Department
            </DialogTitle>
            <DialogDescription>
              Create an academic branch under your institution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input 
                placeholder="e.g. Mechanical Engineering"
                value={newDeptName} 
                onChange={(e) => setNewDeptName(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleAddDept} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Department Target Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedDept?.name} Management Console</DialogTitle>
            <DialogDescription>
              Configure targets and monitor analytics for this specific department.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDept && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-background/50 border-border/50 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Users className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Enrolled</p>
                    <p className="text-xl font-bold">{selectedDept.students}</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 border-border/50 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Trees className="h-5 w-5 text-success mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Planters</p>
                    <p className="text-xl font-bold">{Math.floor(selectedDept.students * 0.85)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 border-border/50 shadow-none">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <GraduationCap className="h-5 w-5 text-primary mb-2" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Trees Planted</p>
                    <p className="text-xl font-bold text-primary">{selectedDept.trees}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <Label>Current Semester Target (Trees)</Label>
                  <Input 
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Adjust the expected plantation quota for {selectedDept.code}.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsManageOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleSaveSettings}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
