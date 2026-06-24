"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Settings, Shield, Bell, Save, User } from "lucide-react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function HodSettings() {
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      return toast.error("Please enter a new password.");
    }
    if (newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New password and confirm password do not match.");
    }

    setUpdatingPassword(true);
    try {
      await authApi.updatePassword(newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error("Failed to update password: " + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Faculty Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your coordinator profile, verification alerts, and account preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Faculty Coordinator Profile
            </CardTitle>
            <CardDescription>Update your personal details and academic department information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facultyName">Full Name</Label>
                <Input id="facultyName" defaultValue="Dr. Ananya Desai" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facultyId">Faculty ID</Label>
                <Input id="facultyId" defaultValue="FAC-VPP-2021-09" disabled className="bg-background/50 opacity-70 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facultyEmail">Institutional Email</Label>
                <Input id="facultyEmail" defaultValue="ananya.desai@pvppcoe.ac.in" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Assigned Coordinator Dept.</Label>
                <Input id="department" defaultValue="Computer Engineering & Visual Arts" disabled className="bg-background/50 opacity-70 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/95 text-white" onClick={() => toast.success("Faculty Profile details saved successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Save Profile Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Preference Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Coordinating Alerts
            </CardTitle>
            <CardDescription>Decide when you want to receive alerts regarding student uploads and survival dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Instant Student Upload Notifications</p>
                  <p className="text-xs text-muted-foreground font-light">E-mail alert as soon as a student from your department uploads a tree.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Survival Check Warning Emails</p>
                  <p className="text-xs text-muted-foreground font-light">E-mail notification when a student's tree is 3 days past its 6-month survival deadline.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm text-foreground">Survival Target Deficit Reports</p>
                  <p className="text-xs text-muted-foreground font-light">Weekly report indicating students who have not met their minimum tree planting targets.</p>
                </div>
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/95 text-white" onClick={() => toast.success("Notification preferences saved successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Password Management
            </CardTitle>
            <CardDescription>Update your institutional account credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currPass">Current Password</Label>
                <Input 
                  id="currPass" 
                  type="password" 
                  className="bg-background/50" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPass">New Password</Label>
                <Input 
                  id="newPass" 
                  type="password" 
                  className="bg-background/50" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confPass">Confirm Password</Label>
                <Input 
                  id="confPass" 
                  type="password" 
                  className="bg-background/50" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                className="border-primary/20 text-primary hover:bg-primary/10"
                onClick={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
