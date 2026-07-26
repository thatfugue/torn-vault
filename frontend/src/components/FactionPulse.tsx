'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Activity, Users, Star, Zap, Clock, TrendingUp, Shield } from 'lucide-react';

interface FactionData {
  name: string;
  respect: number;
  memberCount: number;
}

export default function FactionPulse() {
  const [data, setData] = useState<FactionData | null>(null);
  const [chain, setChain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchAll = async () => {
    try {
      const [pulseRes, overviewRes] = await Promise.all([
          api.get('/api/faction/pulse'),
          api.get('/api/analytics/overview')
      ]);
      setData(pulseRes.data);
      setChain(overviewRes.data.chain);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to sync with faction servers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="text-muted-foreground animate-pulse py-8 text-sm font-black uppercase tracking-widest">Interrogating Servers...</div>;
  }

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {}
      {chain && chain.current > 0 && (
          <div className="bg-destructive/10 border-2 border-destructive/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive text-white flex items-center justify-center shadow-lg animate-pulse">
                      <Zap className="w-7 h-7 fill-current" />
                  </div>
                  <div>
                      <h3 className="font-black text-destructive uppercase tracking-tighter text-xl leading-none">Chain Active</h3>
                      <p className="text-[10px] font-bold text-destructive/60 uppercase tracking-widest mt-1">Combat Protocol Engaged</p>
                  </div>
              </div>
              <div className="flex gap-8 items-center bg-background/40 px-6 py-2 rounded-xl border border-destructive/10">
                  <div className="text-center">
                      <div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Hits</div>
                      <div className="text-3xl font-black text-foreground leading-none">{chain.current}</div>
                  </div>
                  <div className="h-8 w-[1px] bg-destructive/20" />
                  <div className="text-center">
                      <div className="text-[9px] font-black text-muted-foreground uppercase mb-1">Timeout</div>
                      <div className={`text-3xl font-mono font-black leading-none ${chain.timeout < 30 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                          {formatTime(chain.timeout)}
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {}
        <div className="p-5 rounded-2xl border-2 border-border bg-card/50 hover:border-primary/40 transition-all group overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Faction Designation</span>
          </div>
          <p className="text-xl font-black text-foreground tracking-tight truncate" title={data?.name}>
            {data?.name || '---'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border-2 border-border bg-card/50 hover:border-primary/40 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Respect</span>
          </div>
          <p className="text-xl font-black text-foreground tracking-tight">
            {data?.respect ? data.respect.toLocaleString() : '---'}
          </p>
        </div>

        <div className="p-5 rounded-2xl border-2 border-border bg-card/50 hover:border-primary/40 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operatives</span>
          </div>
          <p className="text-xl font-black text-foreground tracking-tight">{data?.memberCount ?? '---'}</p>
        </div>
      </div>
    </div>
  );
}
