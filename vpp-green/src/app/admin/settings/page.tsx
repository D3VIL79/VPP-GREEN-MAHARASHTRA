"use client";

import { useState } from "react";
import { Settings, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

export default function AdminSettings() {
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Global configurations for the VPP Green Maharashtra platform.</p>
      </div>

      <div className="space-y-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Manage global environment variables and AI thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
               <label className="text-sm font-medium">Minimum Survival Rate Threshold (%)</label>
               <Input type="number" defaultValue={85} className="mt-1 bg-background/50" />
             </div>
             <Button className="mt-2" onClick={() => toast.success("Global configuration saved successfully.")}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security Password Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Password Security
            </CardTitle>
            <CardDescription>Change your administrator account credentials.</CardDescription>
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
                onClick={handleUpdatePassword} 
                variant="outline" 
                className="border-primary/20 text-primary hover:bg-primary/10"
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
