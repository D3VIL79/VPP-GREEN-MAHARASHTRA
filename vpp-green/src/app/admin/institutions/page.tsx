"use client";

import { motion } from "framer-motion";
import { Building2, Search, Filter, ExternalLink, Edit3, Trash2, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { institutionApi, authApi } from "@/lib/api";

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [newInstName, setNewInstName] = useState("");
  const [newInstType, setNewInstType] = useState("engineering_college");
  const [newInstCode, setNewInstCode] = useState("");
  const [newInstDistrict, setNewInstDistrict] = useState("Mumbai City");
  const [newInstAddress, setNewInstAddress] = useState("");
  
  // Admin credentials
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("Password123!");
  const [submitting, setSubmitting] = useState(false);

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any>(null);
  const [editName, setEditName] = useState("");

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const res = await institutionApi.list();
      setInstitutions(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load institutions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleOnboard = async () => {
    if (!newInstName.trim()) return toast.error("Please enter institution name.");
    if (!newInstCode.trim()) return toast.error("Please enter a short code (e.g. VPPCOE).");
    if (!adminEmail.trim()) return toast.error("Please enter admin email.");
    const cleanPhone = adminPhone.replace(/\s/g, "");
    if (cleanPhone.length !== 10) return toast.error("Please enter a valid 10-digit admin phone number.");
    if (adminPassword.length < 6) return toast.error("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      // 1. Create the institution record
      const res = await institutionApi.create({
        name: newInstName.trim(),
        type: newInstType,
        code: newInstCode.trim().toUpperCase(),
        district: newInstDistrict,
        address: newInstAddress.trim()
      });

      const institutionId = res.data.id;

      // 2. Register the institution admin user in Supabase Auth
      await authApi.registerUserAdmin({
        name: `${newInstCode.toUpperCase()} Admin`,
        phone: cleanPhone,
        password: adminPassword,
        email: adminEmail.trim(),
        role: 'institution_admin',
        institutionId: institutionId
      });

      toast.success(`${newInstName} onboarded and admin account created successfully!`);
      setIsOnboardOpen(false);
      
      // Clear form
      setNewInstName("");
      setNewInstCode("");
      setNewInstAddress("");
      setAdminEmail("");
      setAdminPhone("");
      setAdminPassword("Password123!");
      
      // Reload list
      loadInstitutions();
    } catch (err: any) {
      if (err.message?.includes("unique_constraint") || err.message?.includes("institution_code_key") || err.message?.includes("duplicate key")) {
        toast.error("This Short Code is already registered. Please choose a unique Short Code (e.g. MSSCI-01).");
      } else {
        toast.error("Onboarding failed: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNameOpen = (inst: any) => {
    setSelectedInst(inst);
    setEditName(inst.name);
    setIsEditNameOpen(true);
  };

  const handleEditNameSave = async () => {
    if (selectedInst && editName.trim()) {
      try {
        await institutionApi.update(selectedInst.id, { institution_name: editName.trim() });
        toast.success(`Institution name updated to ${editName}`);
        setIsEditNameOpen(false);
        loadInstitutions();
      } catch (err: any) {
        toast.error("Failed to update name: " + err.message);
      }
    }
  };

  const handleDeleteInst = async (instId: string) => {
    if (confirm("Are you sure you want to completely remove this institution from the network? This will remove all associated user and tree records!")) {
      try {
        await institutionApi.delete(instId);
        toast.success("Institution removed successfully.");
        loadInstitutions();
      } catch (err: any) {
        toast.error("Failed to delete institution: " + err.message);
      }
    }
  };

  const handleToggleStatus = async (instId: string, currentStatus: boolean) => {
    try {
      await institutionApi.update(instId, { is_active: !currentStatus });
      toast.success(`Institution status updated successfully.`);
      loadInstitutions();
    } catch (err: any) {
      toast.error("Action failed: " + err.message);
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase()) || 
                         inst.code.toLowerCase().includes(search.toLowerCase()) ||
                         inst.district.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === "all" || inst.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Registered Institutions</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all participating colleges and universities.</p>
        </div>
        <div className="flex gap-3">
          <select
            className="flex h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="engineering">Engineering</option>
            <option value="law">Law</option>
            <option value="architecture">Architecture</option>
            <option value="school">School</option>
            <option value="university">University</option>
            <option value="ngo">NGO</option>
          </select>

          <Dialog open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                + Onboard Institution
              </Button>
            } />
            <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-success animate-pulse" /> Onboard New Institution
                </DialogTitle>
                <DialogDescription>
                  Register a new college or university and set up its admin account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input 
                    placeholder="e.g. Vasantdada Patil Pratishthan's College" 
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Short Code</Label>
                    <Input 
                      placeholder="e.g. VPPCOE" 
                      value={newInstCode}
                      onChange={(e) => setNewInstCode(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Institution Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                      value={newInstType}
                      onChange={(e) => setNewInstType(e.target.value)}
                    >
                      <option value="engineering_college">Engineering College</option>
                      <option value="law_college">Law College</option>
                      <option value="architecture_college">Architecture College</option>
                      <option value="school">School</option>
                      <option value="university">University</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Input 
                      placeholder="e.g. Mumbai City" 
                      value={newInstDistrict}
                      onChange={(e) => setNewInstDistrict(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input 
                      placeholder="e.g. Sion, Mumbai" 
                      value={newInstAddress}
                      onChange={(e) => setNewInstAddress(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Admin Portal Credentials</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Admin Email ID</Label>
                      <Input 
                        type="email"
                        placeholder="admin@vppcoe.edu.in" 
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Admin Phone (10-Digit)</Label>
                        <Input 
                          placeholder="9876543210" 
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          className="bg-background/50"
                          maxLength={10}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Admin Password</Label>
                        <Input 
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setIsOnboardOpen(false)} disabled={submitting}>Cancel</Button>
                <Button className="bg-primary text-primary-foreground" onClick={handleOnboard} disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Onboarding...</> : "Onboard"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Institution Directory</CardTitle>
              <CardDescription>Comprehensive list of educational trusts mapping to the One Student One Tree initiative.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search VPP, Phalke, Pune..." 
                className="pl-9 bg-background/50 rounded-full" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[120px]">Inst. ID</TableHead>
                    <TableHead>Institution Name</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead className="text-right">Trees Planted</TableHead>
                    <TableHead className="text-right">Survival</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No institutions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInstitutions.map((inst, i) => (
                      <motion.tr 
                        key={inst.id} 
                        className="hover:bg-muted/20 border-b border-border/50 last:border-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <TableCell className="font-medium text-xs text-muted-foreground break-all">{inst.id}</TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{inst.name}</div>
                          <div className="text-xs text-muted-foreground">{inst.type} ({inst.code})</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{inst.district}</TableCell>
                        <TableCell className="text-right font-medium">{inst.trees}</TableCell>
                        <TableCell className="text-right text-success font-semibold">{inst.survival}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={inst.is_active ? "bg-success/10 text-success border-success/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                            {inst.is_active ? "Active" : "Suspended"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit Name" onClick={() => handleEditNameOpen(inst)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className={`h-8 w-8 ${inst.is_active ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "text-success hover:text-success hover:bg-success/10"}`} title={inst.is_active ? "Suspend Affiliation" : "Approve Affiliation"} onClick={() => handleToggleStatus(inst.id, inst.is_active)}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Remove Institution" onClick={() => handleDeleteInst(inst.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Name Modal */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit Institution Name</DialogTitle>
            <DialogDescription>
              Update the official name of this educational institution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <Input 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="bg-background/50" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleEditNameSave}>Save Name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
