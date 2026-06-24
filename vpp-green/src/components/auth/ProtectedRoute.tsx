"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const roleRedirects: Record<string, string> = {
  STUDENT: "/student/dashboard",
  FACULTY: "/faculty/dashboard",
  HOD: "/institution/dashboard",
  DEPARTMENT_HOD: "/hod/dashboard",
  INSTITUTION_ADMIN: "/institution/dashboard",
  DISTRICT_ADMIN: "/admin/dashboard",
  STATE_ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  CSR_PARTNER: "/csr/dashboard",
  CSR_USER: "/csr/dashboard",
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, loadSession } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    loadSession().finally(() => setChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checked && !isLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/login");
      } else {
        const userRole = user.role?.toUpperCase() || "";
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          const correctPath = roleRedirects[userRole] || "/login";
          router.replace(correctPath);
        }
      }
    }
  }, [checked, isLoading, isAuthenticated, user, allowedRoles, router]);

  // Still loading session
  if (!checked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Role check — if allowedRoles specified, verify user has access
  const userRole = user.role?.toUpperCase() || "";
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Redirecting to your portal...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
