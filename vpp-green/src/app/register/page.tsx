"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ArrowRight, Loader2, Phone, KeyRound, User, Mail, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { authApi, institutionApi } from "@/lib/api";
import Link from "next/link";

const roleRedirects: Record<string, string> = {
  student: "/student/dashboard",
  faculty: "/faculty/dashboard",
  hod: "/institution/dashboard",
  institution_admin: "/institution/dashboard",
  district_admin: "/admin/dashboard",
  state_admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
};

interface Institution {
  id: string;
  name: string;
  code: string;
  type: string;
  district: string;
}



export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");
  const [institutionId, setInstitutionId] = useState("");
  const [department, setDepartment] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = roleRedirects[user.role.toLowerCase()] || "/student/dashboard";
      router.push(redirect);
    }
  }, [isAuthenticated, user, router]);

  // Fetch institutions on mount
  useEffect(() => {
    institutionApi.list()
      .then((res) => setInstitutions(res.data || []))
      .catch(() => setInstitutions([]));
  }, []);

  // Update departments and reset selected department when institution changes
  useEffect(() => {
    if (institutionId) {
      const selected = institutions.find(i => i.id === institutionId);
      if (selected) {
        setDepartments((selected as any).departments || []);
      } else {
        setDepartments([]);
      }
    } else {
      setDepartments([]);
    }
    setDepartment("");
  }, [institutionId, institutions]);

  const handleRegister = async () => {
    setError(null);
    if (name.trim().length < 2) { setError("Please enter your full name"); return; }
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length !== 10) { setError("Please enter a valid 10-digit phone number"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setRegistering(true);
    try {
      await authApi.register({ 
        name: name.trim(), 
        phone: cleanPhone, 
        password,
        email: email || undefined, 
        role, 
        institutionId: institutionId || undefined,
        department: department || undefined
      });
      
      // Auto login after successful registration - use the same identifier that was registered
      const loginIdentifier = email || cleanPhone;
      const loginSuccess = await login(loginIdentifier, password);
      if (!loginSuccess) {
        router.push("/login?registered=true");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary via-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-16 text-primary-foreground h-full">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-md border border-border/20 overflow-hidden">
            <img src="/company_logo.png" alt="Company Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-5xl font-heading font-bold mb-4">Join the Movement.</h1>
          <p className="text-xl text-primary-foreground/80 max-w-lg">
            Register your account, plant trees, and earn certificates. Your green journey starts here.
          </p>

          <div className="flex items-center gap-6 mt-12 pt-8 border-t border-primary-foreground/20">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <GraduationCap className="h-4 w-4" />
              <span>2,728 Students</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Building2 className="h-4 w-4" />
              <span>{institutions.length} Institutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center lg:text-left mt-8 lg:mt-0">
            <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground">
              Create your account
            </h2>
            <p className="text-muted-foreground mt-2">
              Fill in your details to get started with VPP Green Maharashtra.
            </p>
          </div>

          {/* Error Display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 flex items-center gap-2"
              >
                <span className="shrink-0">⚠️</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6 mt-8">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input id="name" placeholder="Rahul Sharma" className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input id="phone" placeholder="98765 43210" className="h-12" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <Input id="password" type="password" placeholder="••••••••" className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    Confirm
                  </Label>
                  <Input id="confirm" type="password" placeholder="••••••••" className="h-12" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              {/* Email (optional) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Input id="email" type="email" placeholder="you@example.com" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  I am a
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["STUDENT", "FACULTY"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        role === r
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {r === "STUDENT" ? "🎓 Student" : "👨‍🏫 Faculty"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Institution
                </Label>
                <select
                  id="institution"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                >
                  <option value="">Select your institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department - shown when institution is selected */}
              {institutionId && (
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    Department
                  </Label>
                  {departments.length > 0 ? (
                    <select
                      id="department"
                      className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">Select your department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="department"
                      placeholder="Enter your department name"
                      className="h-12 bg-background"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  )}
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
                onClick={handleRegister}
                disabled={registering}
              >
                {registering ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 pb-8">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary font-medium">
              Log in instead
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
