"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { authApi } from "@/lib/api";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Save, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StudentSettings() {
  const { user } = useAuthStore();
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, "") : "";
      setEmail(cleanPhone ? `${cleanPhone}@vppgreen.com` : "");
    }
  }, [user]);

  const handleSaveProfile = () => {
    toast.success("Student Profile details saved successfully!");
  };

  const handleSavePreferences = () => {
    toast.success("Notification preferences saved successfully!");
  };

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
        <h1 className="text-3xl font-heading font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your personal profile details, notification options, and login credentials.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Student Profile
            </CardTitle>
            <CardDescription>Update your personal information and see registration details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Full Name</Label>
                <Input 
                  id="studentName" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="bg-background/50" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number / Register ID</Label>
                <Input id="rollNumber" defaultValue={user?.id ? `VPP-STU-${user.id.slice(0, 8).toUpperCase()}` : "VPP-STU-TEMP"} disabled className="bg-background/50 opacity-70 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentEmail">Email Address</Label>
                <Input 
                  id="studentEmail" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-background/50" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">Department & Role</Label>
                <Input id="college" defaultValue={`${user?.departmentId || 'General'} (${user?.role || 'STUDENT'})`} disabled className="bg-background/50 opacity-70 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/95 text-white">
                <Save className="h-4 w-4 mr-2" /> Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Preference Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Alert Preferences
            </CardTitle>
            <CardDescription>Decide how and when you wish to be notified about approvals or actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Tree Verification Alerts</p>
                  <p className="text-xs text-muted-foreground font-light">Get a notification when a coordinator approves or rejects your tree upload.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Watering & Health Warnings</p>
                  <p className="text-xs text-muted-foreground font-light">Instant alert when monitoring logs suggest your trees need watering or show signs of wilting.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm text-foreground">Monthly Leaderboard Digests</p>
                  <p className="text-xs text-muted-foreground font-light">Email summarising carbon points ranking and state leaderboards for VPP Trust colleges.</p>
                </div>
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSavePreferences} className="bg-primary hover:bg-primary/95 text-white">
                <Save className="h-4 w-4 mr-2" /> Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Password Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Password Security
            </CardTitle>
            <CardDescription>Change your account passwords.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currP">Current Password</Label>
                <Input 
                  id="currP" 
                  type="password" 
                  className="bg-background/50" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newP">New Password</Label>
                <Input 
                  id="newP" 
                  type="password" 
                  className="bg-background/50" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confP">Confirm Password</Label>
                <Input 
                  id="confP" 
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
                {updatingPassword ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
