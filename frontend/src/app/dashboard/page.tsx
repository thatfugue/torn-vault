'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import FactionPulse from '@/components/FactionPulse';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    Calculator, Shield, ArrowRight, Target, Swords, Zap, User,
    Settings2, Terminal, Users, BarChart3, Crosshair, Check, Plus
} from 'lucide-react';

const ALL_OPERATIONS = [
    { id: 'warpay', name: 'War Pay', desc: 'Calculate fair payout distribution', href: '/dashboard/warpay', icon: Calculator, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'armory', name: 'Vault Audit', desc: 'Monitor and audit armory assets', href: '/dashboard/armory', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'crimes', name: 'OC Planner', desc: 'Strategic crime coordination', href: '/dashboard/crimes', icon: Crosshair, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'warintel', name: 'War Intel', desc: 'Attack performance analytics', href: '/dashboard/war', icon: Swords, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'analytics', name: 'Analytics', desc: 'Member health and trends', href: '/dashboard/analytics', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'terminal', name: 'Terminal', desc: 'Unified intelligence feed', href: '/dashboard/logs', icon: Terminal, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'roster', name: 'Roster', desc: 'Member status and tracking', href: '/dashboard/roster', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [personalIntel, setPersonalIntel] = useState<any>(null);
  const [customOps, setCustomOps] = useState<string[]>(['warpay', 'armory', 'crimes', 'warintel']);
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
      const fetchIntel = async () => {
          try {
              const res = await api.get('/api/user/me/intelligence');
              setPersonalIntel(res.data);
          } catch (e) {}
      };
      fetchIntel();

      const saved = localStorage.getItem('tornvault_quick_ops');
      if (saved) {
          try {
              setCustomOps(JSON.parse(saved));
          } catch (e) {}
      }
  }, []);

  const toggleOp = (id: string) => {
      const updated = customOps.includes(id)
        ? customOps.filter(oid => oid !== id)
        : [...customOps, id];
      setCustomOps(updated);
      localStorage.setItem('tornvault_quick_ops', JSON.stringify(updated));
  };

  const visibleOps = ALL_OPERATIONS.filter(op => customOps.includes(op.id));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <User className="w-6 h-6 text-primary" />
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome back, {user?.name}</h1>
                    {user?.name === 'sercann' ? (
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">Master Admin</span>
                    ) : (
                        <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-0.5 rounded-md border border-green-500/20 uppercase tracking-widest">
                            {user?.subscription?.daysLeft} Days Clearance
                        </span>
                    )}
                </div>
                <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">
                    {personalIntel?.factionName || 'FACTION'} OPERATIONS TERMINAL
                </p>
            </div>
        </div>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-sm group hover:border-primary/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Target className="w-16 h-16 text-primary" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">My Assignment</div>
              <div className="text-xl font-black text-foreground truncate">{personalIntel?.oc?.name || 'STANDBY'}</div>
              <div className={`text-[10px] font-black mt-1 uppercase tracking-widest ${personalIntel?.oc?.status === 'Ready' ? 'text-green-500' : 'text-primary opacity-70'}`}>
                  {personalIntel?.oc?.status || 'No active OC assignment'}
              </div>
          </div>

          <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-sm group hover:border-orange-500/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Swords className="w-16 h-16 text-orange-500" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Personal Combat Impact</div>
              <div className="text-xl font-black text-foreground">{personalIntel?.war?.hits || 0} Successful Hits</div>
              <div className={`text-[10px] font-black text-orange-500 mt-1 uppercase tracking-widest`}>
                  {personalIntel?.war?.respect.toFixed(1) || 0} Respect Contribution
              </div>
          </div>

          <div className="bg-card border-2 border-border p-6 rounded-2xl shadow-sm group hover:border-green-500/50 transition-all relative overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-16 h-16 text-green-500" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Operative Status</div>
              <div className="text-xl font-black text-foreground">Active Duty</div>
              <div className="text-[10px] font-black text-green-500 mt-1 uppercase tracking-widest">
                  Authorized Intelligence Access
              </div>
          </div>
      </div>

      <div className="space-y-8">
        {}
        <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Live Faction Pulse</h2>
          </div>
          <div className="border-2 border-border rounded-2xl p-6 bg-card shadow-sm">
            <FactionPulse />
          </div>
        </section>

        {}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Quick Operations</h2>
              </div>
              <button
                onClick={() => setIsConfiguring(!isConfiguring)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isConfiguring ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                  <Settings2 className="w-3.5 h-3.5" />
                  {isConfiguring ? 'Save Layout' : 'Configure'}
              </button>
          </div>

          {isConfiguring && (
              <div className="bg-muted/30 border-2 border-dashed border-border p-6 rounded-2xl animate-in zoom-in-95 duration-200">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Toggle Dashboard Widgets</div>
                  <div className="flex flex-wrap gap-3">
                      {ALL_OPERATIONS.map(op => (
                          <button
                            key={op.id}
                            onClick={() => toggleOp(op.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${customOps.includes(op.id) ? 'bg-card border-primary text-foreground' : 'bg-transparent border-border text-muted-foreground opacity-50 hover:opacity-100'}`}
                          >
                              {customOps.includes(op.id) ? <Check className="w-3.5 h-3.5 text-primary" /> : <Plus className="w-3.5 h-3.5" />}
                              {op.name}
                          </button>
                      ))}
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleOps.map(op => (
                <Link key={op.id} href={op.href} className="group">
                  <div className="bg-card hover:bg-accent/50 border-2 border-border rounded-2xl p-5 transition-all shadow-sm hover:shadow-md h-full flex flex-col justify-between group-hover:border-primary/30">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 ${op.bg} ${op.color} rounded-xl group-hover:scale-110 transition-transform border border-border/50`}>
                          <op.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 uppercase">Tactical</span>
                      </div>
                      <h3 className="font-black text-sm uppercase tracking-tight mb-1">{op.name}</h3>
                      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{op.desc}</p>
                    </div>
                    <div className={`mt-4 flex items-center gap-1 text-[10px] font-black ${op.color} uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Launch <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
            ))}

            {visibleOps.length === 0 && !isConfiguring && (
                <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-border text-muted-foreground text-xs font-black uppercase tracking-widest">
                    No operations pinned. Use configure to add widgets.
                </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
