"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Users,
  Calculator,
  LayoutDashboard,
  Shield,
  Terminal,
  Crosshair,
  Menu,
  X,
  LogOut,
  Swords,
  BarChart3,
  Search,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Roster", href: "/dashboard/roster", icon: Users },
  { name: "Terminal", href: "/dashboard/logs", icon: Terminal },
  { name: "OC Planner", href: "/dashboard/crimes", icon: Crosshair },
  { name: "War Intel", href: "/dashboard/war", icon: Swords },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Armory Audit", href: "/dashboard/armory", icon: Shield },
  { name: "War Pay", href: "/dashboard/warpay", icon: Calculator },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin = user?.name === 'sercann';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      {}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg uppercase tracking-tighter">TornVault</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-accent text-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 hidden md:flex items-center gap-2 px-6 border-b border-border bg-muted/20">
          <Activity className="w-6 h-6 text-primary" />
          <span className="font-black text-xl tracking-tight uppercase">TornVault</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2 opacity-50">
            Intelligence Feed
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all group ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-6 mt-6 border-t border-border">
                <div className="px-2 mb-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-70">Master Control</div>
                <Link
                    href="/dashboard/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all group ${
                    pathname === '/dashboard/admin'
                        ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                    <ShieldCheck className={`w-4 h-4 transition-transform group-hover:scale-110 ${pathname === '/dashboard/admin' ? "text-background" : "text-muted-foreground group-hover:text-primary"}`} />
                    Admin Control
                </Link>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border space-y-4">
          <div className="hidden md:flex justify-between items-center px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Theme Mode</span>
            <ThemeToggle />
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-0">
        {}
        <header className="hidden md:flex h-16 border-b border-border bg-card/50 backdrop-blur-md items-center justify-center px-8 shrink-0">
            <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="w-full max-w-md bg-muted/50 border border-border hover:border-primary/50 hover:bg-muted transition-all px-4 py-2 rounded-xl flex items-center justify-between text-muted-foreground group"
            >
                <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Search Commands...</span>
                </div>
                <div className="flex items-center gap-1">
                    <kbd className="bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black">CTRL</kbd>
                    <kbd className="bg-background border border-border px-1.5 py-0.5 rounded text-[9px] font-black">K</kbd>
                </div>
            </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 mt-16 md:mt-0">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
