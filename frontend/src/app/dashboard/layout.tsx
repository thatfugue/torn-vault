"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import CommandPalette from "@/components/CommandPalette";
import { ShieldAlert, CreditCard, ArrowRight, Zap } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isSubscribed = user.subscription?.active || user.name === 'sercann';

  if (!isSubscribed) {
      return (
          <div className="min-h-screen bg-background flex items-center justify-center p-6">
              <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center border-2 border-destructive/20 shadow-xl shadow-destructive/5">
                      <ShieldAlert className="w-10 h-10 text-destructive" />
                  </div>

                  <div className="space-y-3">
                      <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Intelligence Restricted</h1>
                      <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                          Your account requires an active **TornVault Clearance** to access faction analytics.
                      </p>
                  </div>

                  <div className="bg-card border-2 border-border p-6 rounded-3xl text-left space-y-4 shadow-sm">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                              <div className="text-xs font-black uppercase tracking-widest text-primary">Activation Protocol</div>
                              <div className="text-sm font-bold">1x Xanax = 7 Days Access</div>
                          </div>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-2xl border border-border space-y-2">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Instructions:</p>
                          <p className="text-sm font-medium">Send Xanax to <strong className="text-foreground">sercann [4141121]</strong> with the message <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">tornvault</code></p>
                      </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      I sent the items <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => window.location.href = '/login'}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                      Logout Session
                  </button>
              </div>
          </div>
      );
  }

  return (
    <Sidebar>
      <CommandPalette />
      {children}
    </Sidebar>
  );
}
