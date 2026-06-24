"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, LayoutDashboard, PlusCircle, Trees, Activity, Award, Bell, LogOut, FileText, Trophy, Calendar, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
  { name: "Events & Drives", href: "/student/events", icon: Calendar },
  { name: "Add Tree", href: "/student/add-tree", icon: PlusCircle },
  { name: "My Trees", href: "/student/trees", icon: Trees },
  { name: "Monitoring", href: "/student/monitoring", icon: Activity },
  { name: "Reports", href: "/student/reports", icon: FileText },
  { name: "Certificates", href: "/student/certificates", icon: Award },
  { name: "Notifications", href: "/student/notifications", icon: Bell },
  { name: "Settings", href: "/student/settings", icon: Settings },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "STAFF"]}>
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border hidden lg:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
          <span className="font-heading font-bold text-lg text-primary">Student Portal</span>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'ST'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground">{user?.name || 'Student'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'STUDENT'}</p>
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
                      layoutId="sidebar-active"
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
            
            {user?.role?.toUpperCase() === 'FACULTY' && (
              <div className="mt-8">
                <Link href="/faculty/dashboard">
                  <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Faculty Portal
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>

        <div className="p-6 border-t border-border mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-card border-b border-border flex items-center px-6 gap-2">
          <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
          <span className="font-heading font-bold text-lg text-primary">Student Portal</span>
        </header>
        
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
