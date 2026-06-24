"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf, LayoutDashboard, Building2, Users, Map, BrainCircuit, FileText, Settings, LogOut, Trees, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/lib/auth-store";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
  { name: "Plantations", href: "/admin/plantations", icon: Trees },
  { name: "Institutions", href: "/admin/institutions", icon: Building2 },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Events & Drives", href: "/admin/events", icon: Trophy },
  { name: "GIS Analytics", href: "/admin/gis", icon: Map },
  { name: "AI Insights", href: "/admin/ai", icon: BrainCircuit },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"]}>
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-card/80 backdrop-blur-xl border-r border-border hidden lg:flex flex-col relative z-20">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain mr-2" />
          <span className="font-heading font-bold text-lg text-primary">State Admin Portal</span>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.role || 'ADMIN'}</p>
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
                      layoutId="admin-sidebar-active"
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
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive transition-colors w-full">
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none -translate-x-1/2" />
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-6 sticky top-0 z-20 gap-2">
          <img src="/company_logo.png" alt="Company Logo" className="h-8 w-8 object-contain" />
          <span className="font-heading font-bold text-lg text-primary">State Admin</span>
        </header>
        
        <div className="flex-1 overflow-auto p-6 lg:p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
