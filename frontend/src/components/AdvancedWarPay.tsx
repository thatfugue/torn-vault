'use client';

import { useState } from 'react';
import { useWarPay } from '../contexts/WarPayContext';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/api';
import {
  Calculator, Search, Info, BarChart3, Settings2,
  Users, AlertCircle, ChevronDown, Check
} from 'lucide-react';
import WarSummary from './warpay/WarSummary';
import BudgetManager from './warpay/BudgetManager';
import MetricsConfig from './warpay/MetricsConfig';
import Adjustments from './warpay/Adjustments';
import PayoutResults from './warpay/PayoutResults';

export default function AdvancedWarPay() {
  const [activeTab, setActiveTab] = useState<'summary' | 'setup' | 'results'>('summary');
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const { state, setWarId, setWarData, setSelectedFactionId, setLoading } = useWarPay();
  const { showToast } = useToast();

  const handleFetchWar = async () => {
    if (!state.warId) {
      showToast('Please enter a War ID', 'error');
      return;
    }

    setLoading(true);
    setFetchProgress(0);
    let interval: NodeJS.Timeout;

    try {

      interval = setInterval(async () => {
          try {
              const res = await api.get(`/api/faction/ranked-war/${state.warId}/progress`);
              if (res.data && typeof res.data.count === 'number') {
                  setFetchProgress(res.data.count);
              }
          } catch(e) {}
      }, 500);

      const response = await api.get(`/api/faction/ranked-war/${state.warId}`);
      clearInterval(interval);
      setFetchProgress(0);
      setWarData(response.data);
      showToast('War data retrieved successfully', 'success');
    } catch (error: any) {
      clearInterval(interval!);
      setFetchProgress(0);
      showToast(error.response?.data?.error || 'Failed to fetch war data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const rawData = state.warData?.rankedwarreport || state.warData;
  const factions = rawData?.factions || {};
  const factionList = Object.entries(factions).map(([id, f]: [string, any]) => ({ id, name: f.name }));

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'setup', label: 'Configuration', icon: Settings2 },
    { id: 'results', label: 'Payouts', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> War ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.warId}
                onChange={(e) => setWarId(e.target.value)}
                placeholder="Enter Ranked War ID (e.g. 38673)"
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                disabled={state.loading}
              />
              <button
                onClick={handleFetchWar}
                disabled={state.loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center justify-center min-w-[140px] disabled:opacity-50"
              >
                  <span>FETCH DATA</span>
              </button>
            </div>

            {state.loading && (
                <div className="pt-3 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Fetching Intelligence...
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground font-mono">{fetchProgress} Logs Analysed</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/50 animate-pulse w-full" style={{ width: '100%' }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground italic mt-1.5">
                        Securely pulling Ranked War report and cross-referencing deep faction logs to pinpoint
                        stealth attacks, assists, and outside chain hits...
                    </p>
                </div>
            )}
          </div>

          <div className="flex-[0.5] bg-muted/30 p-4 rounded-xl border border-border flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Find your War ID in the <strong>Ranked War</strong> tab or in the URL of the war report.
            </p>
          </div>
        </div>
      </div>

      {state.warData && (
        <>
          {}
          <div className="flex bg-card p-1.5 rounded-2xl border border-border sticky top-4 z-40 shadow-lg md:relative md:top-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className={activeTab === tab.id ? 'block' : 'hidden sm:block'}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'summary' && <WarSummary />}
            {activeTab === 'setup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BudgetManager />
                  <MetricsConfig />
                </div>
                <Adjustments />
              </div>
            )}
            {activeTab === 'results' && <PayoutResults />}
          </div>
        </>
      )}

      {!state.warData && !state.loading && (
        <div className="py-20 text-center space-y-4 bg-muted/10 rounded-3xl border-2 border-dashed border-border">
          <Calculator className="w-16 h-16 text-muted-foreground/20 mx-auto" />
          <p className="text-lg font-bold">Waiting for Intel</p>
        </div>
      )}

      {state.warData && (
        <div className="mt-10 p-6 bg-black border border-red-500/30 rounded-2xl overflow-hidden">
            <h4 className="text-red-500 font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Internal System Debug (Raw API Data)
            </h4>
            <pre className="text-[10px] text-emerald-500 font-mono overflow-auto max-h-[300px] custom-scrollbar">
                {JSON.stringify(state.warData._debug_info || state.warData, null, 2)}
            </pre>
        </div>
      )}
    </div>
  );
}
