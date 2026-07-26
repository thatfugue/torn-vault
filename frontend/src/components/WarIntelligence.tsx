'use client';

import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Swords, Trophy, Target, TrendingUp, User, Activity, RefreshCcw } from 'lucide-react';

interface WarStat {
    name: string;
    hits: number;
    respect: number;
    finishingHits: number;
    assists: number;
    losses: number;
}

interface WarIntelligenceProps {
    data?: WarStat[];
    loading?: boolean;
}

export default function WarIntelligence({ data: propData, loading: propLoading }: WarIntelligenceProps) {
  const [stats, setStats] = useState<WarStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchStats = async () => {
    if (propData) return;
    setLoading(true);
    try {

      const response = await api.get('/api/analytics/overview');
      setStats(response.data.war);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to fetch war intelligence', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propData) {
        setStats(propData);
        setLoading(!!propLoading);
    } else {
        fetchStats();
    }
  }, [propData, propLoading]);

  if (loading && stats.length === 0) {
    return (
        <div className="p-20 text-center animate-pulse flex flex-col items-center gap-4 bg-card border border-border rounded-2xl">
            <Swords className="w-12 h-12 text-primary/50" />
            <div className="text-sm font-black uppercase tracking-widest text-muted-foreground">Analyzing Attack Vectors...</div>
        </div>
    );
  }

  const topRespect = stats[0];
  const totalRespect = stats.reduce((acc, s) => acc + s.respect, 0);
  const totalHits = stats.reduce((acc, s) => acc + s.hits, 0);

  return (
    <div className="space-y-8">
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Trophy className="w-12 h-12 text-primary" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Top Conqueror</div>
              <div className="text-2xl font-black text-foreground">{topRespect?.name || 'N/A'}</div>
              <div className="text-xs font-bold text-primary mt-1">Earned {topRespect?.respect.toFixed(2) || 0} Respect</div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Target className="w-12 h-12 text-primary" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Impact</div>
              <div className="text-2xl font-black text-foreground">{totalRespect.toFixed(1)} Respect</div>
              <div className="text-xs font-bold text-muted-foreground mt-1">Across {totalHits} Offensive Actions</div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-12 h-12 text-primary" />
              </div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Efficiency Ratio</div>
              <div className="text-2xl font-black text-foreground">{(totalRespect / Math.max(totalHits, 1)).toFixed(2)}</div>
              <div className="text-xs font-bold text-muted-foreground mt-1">Respect per Hit Average</div>
          </div>
      </div>

      {}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="font-black text-foreground uppercase tracking-tight text-lg">Combat Performance Index</h2>
            </div>
            {!propData && (
                <button onClick={fetchStats} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-primary">
                    <RefreshCcw className="w-4 h-4" />
                </button>
            )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Combatant</th>
                <th className="py-4 px-6 text-center">Hits</th>
                <th className="py-4 px-6 text-center text-primary">Respect</th>
                <th className="py-4 px-6 text-center">Finishing</th>
                <th className="py-4 px-6 text-center">Assists</th>
                <th className="py-4 px-6 text-center text-destructive">Losses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((s, idx) => (
                <tr key={idx} className="hover:bg-accent/30 transition-colors group">
                  <td className="py-4 px-6 text-sm font-black text-muted-foreground">#{idx + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="font-black text-foreground text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm font-bold">{s.hits}</td>
                  <td className="py-4 px-6 text-center text-sm font-black text-primary">{s.respect.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center text-sm font-bold">{s.finishingHits}</td>
                  <td className="py-4 px-6 text-center text-sm font-bold">{s.assists}</td>
                  <td className="py-4 px-6 text-center text-sm font-bold text-destructive">{s.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
