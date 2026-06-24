"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Verify that the user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(session !== null);
      if (!session) {
        toast.error("Invalid or expired password reset session. Please request a new link.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.updatePassword(password);
      toast.success("Password updated successfully! Redirecting to login...");
      
      // Auto log out the current session to ensure clean state
      await authApi.logout();

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2 text-primary">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Checking password recovery session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-lg">
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 border border-primary/20">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
              <CardDescription>
                {hasSession 
                  ? "Please enter your new secure password below." 
                  : "No active recovery session found."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasSession ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 bg-muted/30"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 bg-muted/30"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 mt-2 font-medium"
                    disabled={isSubmitting || !password || !confirmPassword}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Reset Password
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-3 border border-destructive/20 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Session Expired or Missing</p>
                    <p className="mt-1 font-normal text-muted-foreground">
                      This password reset link is invalid or has already been used. Please return to the login page and request a new password reset email.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-center border-t border-border/50 py-4">
              <Button 
                variant="link" 
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
