"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, ArrowRight, Loader2, KeyRound, ShieldCheck, User, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

const roleRedirects: Record<string, string> = {
  student: "/student/dashboard",
  faculty: "/faculty/dashboard",
  institution_admin: "/institution/dashboard",
  department_hod: "/hod/dashboard",
  super_admin: "/admin/dashboard",
  csr_partner: "/csr/dashboard",
  csr_user: "/csr/dashboard",
};

const quickAccounts = [
  {
    group: "🛡️ Super Admin",
    users: [
      { name: "Super Admin", phone: "9910000000" }
    ]
  },
  {
    group: "🏛️ Institutional Admins",
    users: [
      { name: "VVPCOE & VA Admin", phone: "9910000001" },
      { name: "VPP Law Admin", phone: "9910000002" },
      { name: "Manohar Phalke Architecture Admin", phone: "9910000003" }
    ]
  },
  {
    group: "📋 Department HODs",
    users: [
      { name: "HOD - Computer Engineering", phone: "9920000001" },
      { name: "HOD - Information Technology", phone: "9920000002" },
      { name: "HOD - CSE (AI & ML, DS)", phone: "9920000003" },
      { name: "HOD - Electronics & CS", phone: "9920000004" },
      { name: "HOD - Mechatronics Eng", phone: "9920000005" },
      { name: "HOD - Fine Art", phone: "9920000006" },
      { name: "HOD - Architecture (Phalke)", phone: "9920000007" },
      { name: "HOD - Law (VPP Law)", phone: "9920000008" }
    ]
  },
  {
    group: "🤝 CSR Partners",
    users: [
      { name: "CSR Partner Sponsor", phone: "9930000001" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Computer Engineering",
    users: [
      { name: "Dr. M. Kadam", phone: "9910000004" },
      { name: "Prof. A. Sawant", phone: "9910000005" },
      { name: "Prof. S. Rane", phone: "9910000006" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Information Technology",
    users: [
      { name: "Prof. S. Patil", phone: "9910000007" },
      { name: "Dr. R. Naik", phone: "9910000008" },
      { name: "Prof. J. Mehta", phone: "9910000009" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - CSE (AI/ML/DS)",
    users: [
      { name: "Dr. A. Joshi", phone: "9910000010" },
      { name: "Prof. K. Shah", phone: "9910000011" },
      { name: "Dr. S. Shinde", phone: "9910000012" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Electronics & CS",
    users: [
      { name: "Prof. S. Deshpande", phone: "9910000013" },
      { name: "Dr. M. Rao", phone: "9910000014" },
      { name: "Prof. N. Kadam", phone: "9910000015" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Mechatronics Eng",
    users: [
      { name: "Dr. N. Rane", phone: "9910000016" },
      { name: "Prof. P. Shinde", phone: "9910000017" },
      { name: "Prof. D. Pawar", phone: "9910000018" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Fine Art",
    users: [
      { name: "Prof. S. Mehta", phone: "9910000019" },
      { name: "Dr. V. Gawde", phone: "9910000020" },
      { name: "Prof. R. Patil", phone: "9910000021" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Architecture",
    users: [
      { name: "Prof. K. Shinde", phone: "9910000022" },
      { name: "Dr. P. Sawant", phone: "9910000023" },
      { name: "Prof. A. Kulkarni", phone: "9910000024" }
    ]
  },
  {
    group: "👨‍🏫 Faculty - Law",
    users: [
      { name: "Dr. A. Naik", phone: "9910000025" },
      { name: "Prof. V. Thorat", phone: "9910000026" },
      { name: "Prof. G. Bhosle", phone: "9910000027" }
    ]
  },
  {
    group: "🎓 Students - Computer Engineering",
    users: [
      { name: "Amit Sharma (FE)", phone: "9910000030" },
      { name: "Yash Shinde (SE)", phone: "9910000031" },
      { name: "Sneha Reddy (TE)", phone: "9910000032" },
      { name: "Aditya Kulkarni (BE)", phone: "9910000033" },
      { name: "Neha Gokhale (FE)", phone: "9910000034" },
      { name: "Yuvraj Patil (SE)", phone: "9910000035" },
      { name: "Tanvi Mehta (TE)", phone: "9910000036" }
    ]
  },
  {
    group: "🎓 Students - Information Technology",
    users: [
      { name: "Priya Patel (FE)", phone: "9910000037" },
      { name: "Abhishek Rane (SE)", phone: "9910000038" },
      { name: "Komal Thorat (TE)", phone: "9910000039" },
      { name: "Rohit Pawar (BE)", phone: "9910000040" },
      { name: "Divya Salve (FE)", phone: "9910000041" },
      { name: "Rahul Deshmukh (SE)", phone: "9910000042" },
      { name: "Vikram Singh (TE)", phone: "9910000043" }
    ]
  },
  {
    group: "🎓 Students - CSE (AI/ML/DS)",
    users: [
      { name: "Riya Sawant (FE)", phone: "9910000044" },
      { name: "Siddharth Patil (SE)", phone: "9910000045" },
      { name: "Pranav Raje (TE)", phone: "9910000046" },
      { name: "Shreya Kale (BE)", phone: "9910000047" },
      { name: "Sneha Joshi (FE)", phone: "9910000048" },
      { name: "Ananya Rane (SE)", phone: "9910000049" },
      { name: "Ishita Verma (TE)", phone: "9910000050" }
    ]
  },
  {
    group: "🎓 Students - Electronics & CS",
    users: [
      { name: "Dev Thakkar (FE)", phone: "9910000051" },
      { name: "Pooja Nair (SE)", phone: "9910000052" },
      { name: "Gaurav Kadam (TE)", phone: "9910000053" },
      { name: "Tanmay Joshi (BE)", phone: "9910000054" },
      { name: "Nidhi Desai (FE)", phone: "9910000055" },
      { name: "Sanket Patil (SE)", phone: "9910000056" },
      { name: "Tejaswini Rane (TE)", phone: "9910000057" }
    ]
  },
  {
    group: "🎓 Students - Mechatronics Eng",
    users: [
      { name: "Aryan Sawant (FE)", phone: "9910000058" },
      { name: "Kiran Shinde (SE)", phone: "9910000059" },
      { name: "Sameer Gawde (TE)", phone: "9910000060" },
      { name: "Asha Pawar (BE)", phone: "9910000061" },
      { name: "Nitin Kadam (FE)", phone: "9910000062" },
      { name: "Radhika Patil (SE)", phone: "9910000063" },
      { name: "Kunal Sawant (TE)", phone: "9910000064" }
    ]
  },
  {
    group: "🎓 Students - Fine Art",
    users: [
      { name: "Ketan Sawant (FE)", phone: "9910000065" },
      { name: "Mansi Patil (SE)", phone: "9910000066" },
      { name: "Aniket Rane (TE)", phone: "9910000067" },
      { name: "Arjun Naik (BE)", phone: "9910000068" },
      { name: "Kavita Bhosle (FE)", phone: "9910000069" },
      { name: "Manish Gaikwad (SE)", phone: "9910000070" },
      { name: "Sachin Kadam (TE)", phone: "9910000071" }
    ]
  },
  {
    group: "🎓 Students - Architecture",
    users: [
      { name: "Priyanka Patil (FE)", phone: "9910000072" },
      { name: "Rahul Sawant (SE)", phone: "9910000073" },
      { name: "Siddharth Rane (TE)", phone: "9910000074" },
      { name: "Prisha Gokhale (BE)", phone: "9910000075" },
      { name: "Neel Shinde (FE)", phone: "9910000076" },
      { name: "Gauri Sawant (SE)", phone: "9910000077" },
      { name: "Jayesh Patil (TE)", phone: "9910000078" }
    ]
  },
  {
    group: "🎓 Students - Law",
    users: [
      { name: "Kunal More (FE)", phone: "9910000079" },
      { name: "Divya Joshi (SE)", phone: "9910000080" },
      { name: "Aakash Salvi (TE)", phone: "9910000081" },
      { name: "Deepa Kulkarni (BE)", phone: "9910000082" },
      { name: "Harsh Rane (FE)", phone: "9910000083" },
      { name: "Shruti Pawar (SE)", phone: "9910000084" },
      { name: "Mayur Kadam (TE)", phone: "9910000085" }
    ]
  }
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user, error, clearError } = useAuthStore();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Password recovery states
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);
    setResetError(null);
    try {
      await authApi.resetPasswordForEmail(resetEmail);
      setResetSuccess(true);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      const msg = err.message || "Failed to send reset email";
      setResetError(msg);
      toast.error(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = roleRedirects[user.role.toLowerCase()] || "/student/dashboard";
      router.push(redirect);
    }
  }, [isAuthenticated, user, router]);

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    clearError();
    
    const isEmail = identifier.includes('@');
    const cleanIdentifier = isEmail ? identifier.trim() : identifier.replace(/\s/g, "");
    
    if (!isEmail && cleanIdentifier.length < 10) {
      setLocalError("Please enter a valid email or 10-digit phone number");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password");
      return;
    }
    
    const success = await login(cleanIdentifier, password);
    if (!success && !error) {
       setLocalError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side — Decorative */}
      <div className="hidden lg:flex w-1/2 bg-primary/10 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-black/[0.02] [mask-image:linear-gradient(to_bottom_right,white,transparent)]" />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-md border border-border/20 overflow-hidden">
              <img src="/company_logo.png" alt="Company Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Welcome back to <br />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">
                VPP Green Maharashtra
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Log in to your portal to manage plantations, track growth, and contribute to a greener Maharashtra.
            </p>

            <div className="mt-12 space-y-6">
              {[
                "Students: Track your personal plantation dashboard",
                "Faculty: Monitor departmental progress",
                "Admins: Oversee institutional metrics and AI insights",
                "CSR Partners: View funding impact"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Secure Login</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Enter your email, mobile number, or full name and password to access your account.
              </p>
            </div>

            {(error || localError) && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-3 border border-destructive/20">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{localError || error}</p>
              </div>
            )}

            <form onSubmit={handlePasswordLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email, Mobile Number, or Full Name</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <User className="w-5 h-5" />
                    </div>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@example.com, 9876543210, or Full Name"
                      className="pl-10 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsResetDialogOpen(true)}
                      className="text-xs text-primary font-medium hover:underline focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium rounded-xl group"
                  disabled={isLoading || !identifier || !password}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Login
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            
            {/* Quick Test Logins */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3 font-medium tracking-wider">QUICK TEST ACCOUNTS</p>
              
              <div className="space-y-4">
                <select 
                  className="w-full h-10 px-3 py-2 text-sm bg-muted/50 border border-muted-foreground/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  onChange={async (e) => {
                    const val = e.target.value;
                    if (val) {
                      console.log('[QuickLogin] Selected phone:', val);
                      console.log('[QuickLogin] Will try email formats:',
                        `${val}@vppgreen.com`,
                        `91${val}@vppgreen.com`,
                        `+91${val}@vppgreen.com`
                      );
                      setIdentifier(val);
                      setPassword('Password123!');
                      setLocalError(null);
                      clearError();
                      console.log('[QuickLogin] Attempting login...');
                      const result = await login(val, 'Password123!');
                      console.log('[QuickLogin] Login result:', result);
                      if (!result) {
                        console.error('[QuickLogin] Login failed for phone:', val);
                      }
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select an account to instantly login...</option>
                  {quickAccounts.map((grp) => (
                    <optgroup key={grp.group} label={grp.group}>
                      {grp.users.map((acc) => (
                        <option key={acc.phone} value={acc.phone}>
                          {acc.name} ({acc.phone})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                <p className="text-[10px] text-center text-muted-foreground">Selecting an account will log you in instantly.</p>
              </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Don't have an account?</p>
              <Link href="/register" className="text-primary font-medium hover:underline mt-1 inline-block">
                Register as a student
              </Link>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                Supabase OTP Protected
              </div>
            </div>
            
            {/* Forgot Password Dialog */}
            <AnimatePresence>
              {isResetDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => {
                      setIsResetDialogOpen(false);
                      setResetSuccess(false);
                      setResetError(null);
                      setResetEmail("");
                    }}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl max-w-md w-full relative z-10 space-y-4"
                  >
                    {resetSuccess ? (
                      /* ── Success State ── */
                      <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold tracking-tight text-foreground">Check Your Email</h3>
                          <p className="text-sm text-muted-foreground">
                            We've sent a password reset link to <span className="font-medium text-foreground">{resetEmail}</span>. Click the link in the email to create a new password.
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setIsResetDialogOpen(false);
                            setResetSuccess(false);
                            setResetError(null);
                            setResetEmail("");
                          }}
                          className="mt-2"
                        >
                          Back to Login
                        </Button>
                      </div>
                    ) : (
                      /* ── Form State ── */
                      <>
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Mail className="w-6 h-6 text-primary" />
                          </div>
                          <h3 className="text-xl font-semibold tracking-tight text-foreground">Reset Password</h3>
                          <p className="text-sm text-muted-foreground font-normal">
                            Enter your registered email address below, and we'll send you a secure link to reset your password.
                          </p>
                        </div>

                        {/* Inline Error */}
                        {resetError && (
                          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-2.5 border border-destructive/20">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{resetError}</p>
                          </div>
                        )}

                        {/* Important note */}
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5 border border-amber-500/20">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <p>Use a <strong>real email address</strong> (e.g. Gmail, Outlook) that can receive mail. Generated phone-based emails (@vppgreen.com) cannot receive password reset links.</p>
                        </div>
                        
                        <form onSubmit={handleSendResetEmail} className="space-y-4 text-left">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="yourname@gmail.com"
                              value={resetEmail}
                              onChange={(e) => { setResetEmail(e.target.value); setResetError(null); }}
                              disabled={isSendingReset}
                              required
                              className="h-12 bg-muted/30"
                            />
                          </div>
                          
                          <div className="flex gap-3 justify-end pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsResetDialogOpen(false);
                                setResetError(null);
                                setResetEmail("");
                              }}
                              disabled={isSendingReset}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={isSendingReset || !resetEmail}
                            >
                              {isSendingReset ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Send Reset Link
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
