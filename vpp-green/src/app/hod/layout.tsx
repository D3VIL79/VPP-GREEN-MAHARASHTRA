"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, GraduationCap, FileText, BarChart3, Settings, LogOut, Trophy, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { name: "Dashboard", href: "/hod/dashboard", icon: LayoutDashboard },
  { name: "Faculty Coordinators", href: "/hod/faculty", icon: Users },
  { name: "Student Directory", href: "/hod/students", icon: GraduationCap },
  { name: "Verifications Queue", href: "/hod/verifications", icon: FileText },
  { name: "Leaderboard", href: "/hod/leaderboard", icon: Trophy },
  { name: "Events & Drives", href: "/hod/events", icon: Calendar },
  { name: "Reports & Audits", href: "/hod/reports", icon: BarChart3 },
  { name: "Settings", href: "/hod/settings", icon: Settings },
];

export default function HodLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["DEPARTMENT_HOD"]}>
      <div className="min-h-screen bg-muted/20 flex">
        {/* Sidebar */}
        <aside className="w-72 bg-card/85 backdrop-blur-xl border-r border-border hidden lg:flex flex-col relative z-20">
          <div className="h-16 flex items-center px-6 border-b border-border/50 gap-2">
            <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
            <span className="font-heading font-bold text-lg text-primary">VPP HOD Portal</span>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'HD'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground">{user?.name || 'HOD User'}</p>
                  <p className="text-xs text-muted-foreground uppercase">{user?.departmentId || 'Department'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href} className="relative block">
                      {isActive && (
                        <motion.div
                          layoutId="hod-sidebar-active"
                          className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-border/50 pt-4">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full">
                <LogOut className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none -translate-x-1/2" />
          
          {/* Mobile Header */}
          <header className="lg:hidden h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-6 justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
              <span className="font-heading font-bold text-lg text-primary">VPP HOD</span>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-muted rounded-full uppercase text-muted-foreground">
              {user?.departmentId || 'HOD'}
            </div>
          </header>
          
          <div className="flex-1 overflow-auto p-6 lg:p-10 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
