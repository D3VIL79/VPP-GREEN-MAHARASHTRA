"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter, ShieldAlert, UserCheck, UserX, UserCog, Edit3, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/lib/use-api";
import { userApi, authApi } from "@/lib/api";
import { toast } from "sonner";

export default function AdminMembers() {
  const { data: users, execute: fetchUsers, isLoading } = useApi(userApi.list);
  const [searchTerm, setSearchTerm] = useState("");

  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "student", institutionId: "00000000-0000-0000-0000-000000000001", phone: "", department: "" });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    try {
      await userApi.updateStatus(userId, !currentStatus);
      fetchUsers();
      toast.success(`User ${!currentStatus ? 'activated' : 'suspended'} successfully.`);
    } catch (e: any) {
      toast.error(`Error updating user: ${e.message}`);
    }
  };

  const handleRoleChangeOpen = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleOpen(true);
  };

  const handleRoleChangeSave = async () => {
    if (selectedUser && newRole && newRole !== selectedUser.role) {
      try {
        await userApi.updateRole(selectedUser.id, newRole);
        fetchUsers();
        toast.success(`User role updated to ${newRole}.`);
        setIsRoleOpen(false);
      } catch (e: any) {
        toast.error(`Error updating role: ${e.message}`);
      }
    } else {
      setIsRoleOpen(false);
    }
  };

  const handleEditNameOpen = (user: any) => {
    setSelectedUser(user);
    setNewName(user.full_name || "");
    setIsEditNameOpen(true);
  };

  const handleEditNameSave = async () => {
    if (selectedUser && newName) {
      try {
        await userApi.updateName(selectedUser.id, newName);
        fetchUsers();
        toast.success(`User name updated successfully.`);
        setIsEditNameOpen(false);
      } catch (e: any) {
        toast.error(`Error updating name: ${e.message}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await userApi.deleteUser(userId);
        fetchUsers();
        toast.success(`User deleted successfully.`);
      } catch (e: any) {
        toast.error(`Error deleting user: ${e.message}`);
      }
    }
  };

  const handleAddUserSave = async () => {
    if (!newUser.name || !newUser.phone) {
      toast.error("Name and Phone number are required.");
      return;
    }
    if (newUser.phone.trim().length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    try {
      await authApi.registerUserAdmin(newUser);
      fetchUsers();
      toast.success(`User ${newUser.name} added successfully! Default password is Password123!`);
      setIsAddUserOpen(false);
      setNewUser({ name: "", email: "", role: "student", institutionId: "00000000-0000-0000-0000-000000000001", phone: "", department: "" });
    } catch (e: any) {
      toast.error(`Error adding user: ${e.message}`);
    }
  };

  const getInstitutionName = (id: string) => {
    if (!id) return 'Global';
    if (id === '00000000-0000-0000-0000-000000000001') return 'VPP College of Engineering';
    if (id === '00000000-0000-0000-0000-000000000002') return 'VPP Law';
    if (id === '00000000-0000-0000-0000-000000000003') return 'Manohar Phalke Architecture';
    return id;
  };

  const filteredUsers = users?.filter((user: any) => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Members Management</h1>
          <p className="text-muted-foreground mt-1">God Mode: manage all members (students and faculty) across the state</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsAddUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add New Member
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Global Members Directory</CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name, email..." 
                className="pl-9 bg-background/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name & Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading global user database...</TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-xs text-muted-foreground">{user.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{user.full_name || 'Anonymous'}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email?.includes('@vppgreen.com') 
                            ? (user.real_email ? `${user.real_email} • ${user.mobile}` : user.mobile) 
                            : `${user.email} • ${user.mobile}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-muted/50 cursor-pointer" onClick={() => handleRoleChangeOpen(user)}>
                          {user.role} <UserCog className="h-3 w-3 inline ml-1 opacity-50"/>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getInstitutionName(user.institution_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.is_active ? "bg-success/10 text-success border-success/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditNameOpen(user)} title="Edit Name">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`h-8 ${user.is_active ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "text-success hover:text-success hover:bg-success/10"}`}
                            onClick={() => handleStatusChange(user.id, user.is_active)}
                            title={user.is_active ? 'Suspend User' : 'Activate User'}
                          >
                            {user.is_active ? <UserX className="h-4 w-4 mr-1"/> : <UserCheck className="h-4 w-4 mr-1"/>}
                            {user.is_active ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(user.id)} title="Delete User">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change access level for {selectedUser?.full_name || 'this user'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={newRole} onValueChange={(val) => val && setNewRole(val)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="institution_admin">Institution Admin</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                  <SelectItem value="state_admin">State Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleRoleChangeSave}>Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Modal */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="max-w-sm bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit User Name</DialogTitle>
            <DialogDescription>
              Update the full name for this user account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
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

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md bg-card border-border/50 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Manually create and approve a new user account on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                  className="bg-background/50" 
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>10-Digit Phone</Label>
                <Input 
                  value={newUser.phone} 
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})} 
                  className="bg-background/50" 
                  placeholder="e.g., 9910000030"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address (Optional)</Label>
              <Input 
                type="email"
                value={newUser.email} 
                onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                className="bg-background/50" 
                placeholder="e.g., john@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(val) => val && setNewUser({...newUser, role: val})}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="department_hod">Department HOD</SelectItem>
                    <SelectItem value="institution_admin">Institution Admin</SelectItem>
                    <SelectItem value="csr">CSR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Institution ID</Label>
                <Input 
                  value={newUser.institutionId} 
                  onChange={(e) => setNewUser({...newUser, institutionId: e.target.value})} 
                  className="bg-background/50" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Department (Optional)</Label>
              <Input 
                value={newUser.department} 
                onChange={(e) => setNewUser({...newUser, department: e.target.value})} 
                className="bg-background/50" 
                placeholder="e.g., Computer Engineering"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground" onClick={handleAddUserSave}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
