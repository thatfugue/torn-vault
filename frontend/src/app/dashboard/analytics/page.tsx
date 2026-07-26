'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import MemberHealth from '@/components/MemberHealth';
import OCAnalytics from '@/components/OCAnalytics';
import FinancialPulse from '@/components/FinancialPulse';
import { BarChart3, Activity, Target, RefreshCcw, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/analytics/overview');
      setData(response.data);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to sync intelligence data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading && !data) {
    return (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Syncing Intelligence...</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Cross-referencing logs and operative records</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider opacity-70">Strategic performance metrics and health monitoring</p>
        </div>
        <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-black rounded-lg text-xs transition-all border border-border shadow-sm"
        >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH SYNC
        </button>
      </header>

      {}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-green-500" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Operative Health Index</h2>
          </div>
          <MemberHealth data={data?.health} loading={loading} />
      </section>

      {}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Financial Pulse</h2>
          </div>
          <FinancialPulse data={data?.finance} loading={loading} />
      </section>

      {}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Crime Success Analysis</h2>
          </div>
          <OCAnalytics data={data?.oc} loading={loading} />
      </section>
    </div>
  );
}
