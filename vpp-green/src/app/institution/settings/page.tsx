"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Settings, Shield, Bell, Save, Building2, HelpCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function InstitutionSettings() {
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
        <h1 className="text-3xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure parameters and settings for VPP Trust educational complex.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Institution Profile
            </CardTitle>
            <CardDescription>Update name, contacts, and registration details of the college cluster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complexName">Complex Name</Label>
                <Input id="complexName" defaultValue="Vasantdada Patil Pratishthan Trust Complex" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Administrative Email</Label>
                <Input id="contactEmail" defaultValue="admin@pvppcoe.ac.in" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone Number</Label>
                <Input id="contactPhone" defaultValue="+91 22 2407 0547" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetTrees">Annual Plantation Target</Label>
                <Input id="targetTrees" type="number" defaultValue="20000" className="bg-background/50" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => toast.success("Institution profile details saved successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notification Settings
            </CardTitle>
            <CardDescription>Control the alerts dispatched to faculty coordinators and super admin logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Survival Rate Warning Alerts</p>
                  <p className="text-xs text-muted-foreground font-light">E-mail administrators when a department's tree survival drops below 90%.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Weekly Progress Summaries</p>
                  <p className="text-xs text-muted-foreground font-light">Compile department-wise metrics and email them to the Trustee Board.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm text-foreground">Faculty Verification Reminders</p>
                  <p className="text-xs text-muted-foreground font-light">Notify faculty daily when tree uploads remain pending for more than 48 hours.</p>
                </div>
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => toast.success("Notification preferences updated successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Update Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Security & Credentials
            </CardTitle>
            <CardDescription>Reset login passwords and configure single sign-on parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  className="bg-background/50" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  className="bg-background/50" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
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
                {updatingPassword ? "Updating..." : "Reset Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
