"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Settings, Shield, Bell, Save, Building2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CsrSettings() {
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
        <h1 className="text-3xl font-heading font-bold text-foreground">CSR Account Settings</h1>
        <p className="text-muted-foreground mt-1">Configure company profiles, tax exemption credentials, and update login settings.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Corporate Partner Profile
            </CardTitle>
            <CardDescription>Update your company details and ESG representative information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Corporate Name</Label>
                <Input id="companyName" defaultValue="Tata Motors Green Foundation" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">80G / Corporate Tax ID</Label>
                <Input id="taxId" defaultValue="PAN-AAACT1289M" disabled className="bg-background/50 opacity-70 cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repName">ESG Representative</Label>
                <Input id="repName" defaultValue="Vikram Sen (VP Sustainability)" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repEmail">Contact Email</Label>
                <Input id="repEmail" defaultValue="csr.sustainability@tatamotors.com" className="bg-background/50" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/95 text-white" onClick={() => toast.success("Corporate Details saved successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Save Corporate Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Preference */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> CSR Email Toggles
            </CardTitle>
            <CardDescription>Select which notifications you want to receive about sponsored projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Monthly Carbon Credit Declarations</p>
                  <p className="text-xs text-muted-foreground font-light">Receive verified, audited Carbon Offset PDFs every month.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="font-medium text-sm text-foreground">Disbursal Phase Approvals</p>
                  <p className="text-xs text-muted-foreground font-light">E-mail alert when college coordinators request next-phase fund disbursals (based on survival rates).</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm text-foreground">Press Release Kits</p>
                  <p className="text-xs text-muted-foreground font-light">Receive marketing collateral, photos of students planting trees, and quote sheets when drives complete.</p>
                </div>
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button className="bg-primary hover:bg-primary/95 text-white" onClick={() => toast.success("Notification toggles saved successfully!")}>
                <Save className="h-4 w-4 mr-2" /> Save Toggles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Password Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Security Settings
            </CardTitle>
            <CardDescription>Update your partner account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cPass">Current Password</Label>
                <Input 
                  id="cPass" 
                  type="password" 
                  className="bg-background/50" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nPass">New Password</Label>
                <Input 
                  id="nPass" 
                  type="password" 
                  className="bg-background/50" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coPass">Confirm Password</Label>
                <Input 
                  id="coPass" 
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
                {updatingPassword ? "Updating..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
