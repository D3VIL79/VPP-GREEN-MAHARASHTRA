"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, LayoutDashboard, ClipboardCheck, Users, Activity, FileText, Settings, LogOut, Trees, Trophy, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { name: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
  { name: "Leaderboard", href: "/faculty/leaderboard", icon: Trophy },
  { name: "Events & Drives", href: "/faculty/events", icon: Calendar },
  { name: "Plant a Tree", href: "/faculty/add-tree", icon: Trees },
  { name: "Verifications", href: "/faculty/verifications", icon: ClipboardCheck },
  { name: "Students", href: "/faculty/students", icon: Users },
  { name: "Monitoring", href: "/faculty/monitoring", icon: Activity },
  { name: "Reports", href: "/faculty/reports", icon: FileText },
  { name: "Settings", href: "/faculty/settings", icon: Settings },
];

export default function FacultyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["FACULTY"]}>
      <div className="min-h-screen bg-muted/20 flex">
        {/* Sidebar - Glassmorphism style */}
        <aside className="w-72 bg-card/80 backdrop-blur-xl border-r border-border hidden lg:flex flex-col relative z-20">
          <div className="h-16 flex items-center px-6 border-b border-border/50 gap-2">
            <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
            <span className="font-heading font-bold text-lg text-primary">Faculty Portal</span>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src="https://i.pravatar.cc/150?u=faculty" />
                <AvatarFallback>FA</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'FACULTY'}</p>
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
                        layoutId="faculty-sidebar-active"
                        className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-border/50">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Background ambient light */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
          
          {/* Mobile Header */}
          <header className="lg:hidden h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-6 sticky top-0 z-20 gap-2">
            <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
            <span className="font-heading font-bold text-lg text-primary">Faculty Portal</span>
          </header>
          
          <div className="flex-1 overflow-auto p-6 lg:p-10 relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
