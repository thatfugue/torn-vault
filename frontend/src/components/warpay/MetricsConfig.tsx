'use client';

import { useWarPay } from '../../contexts/WarPayContext';
import {
  BarChart4, Swords, Target, HeartPulse,
  ShieldCheck, HelpCircle, Skull, Ghost, Banknote, Filter, UserX
} from 'lucide-react';

export default function MetricsConfig() {
  const { state, updateMetric, setFilter } = useWarPay();

  const getFactionTotal = (key: string) => {
    const backendStats = state.warData?.faction_stats;

    if (backendStats) {
        if (key === 'totalHits') return (backendStats.war_hits || 0) + (backendStats.nw_hits_chain || 0);
        if (key === 'warHits') return backendStats.war_hits || 0;
        if (key === 'nonWarHits') return backendStats.nw_hits_chain || 0;
        if (key === 'respect') return backendStats.war_respect_base || 0;
        if (key === 'assists') return backendStats.war_assists || 0;
        if (key === 'hosp') return backendStats.war_hosp || 0;
        if (key === 'stealth') return backendStats.war_stealth || 0;
        if (key === 'mugs') return backendStats.war_mugs || 0;
        if (key === 'losses') return backendStats.war_lost || 0;
    }

    if (!state.results || state.results.length === 0) return 0;

    const sum = state.results.reduce((acc: number, r: any) => {
      const s = r.stats || {};
      return acc + (s[key] || 0);
    }, 0);

    return Math.round(sum);
  };

  const metricItems = [
    {
        key: 'totalHits',
        label: 'Total Hits',
        icon: BarChart4,
        color: 'text-blue-500',
        desc: 'Total hits (war + outside)',
        unitName: 'total hits',
        priceSuffix: 'per hit'
    },
    {
        key: 'warHits',
        label: 'War Hits',
        icon: Swords,
        color: 'text-primary',
        desc: 'Hits against the opponent faction during the ranked war',
        unitName: 'war hits',
        priceSuffix: 'per hit'
    },
    {
        key: 'nonWarHits',
        label: 'Outside Hits',
        icon: UserX,
        color: 'text-rose-400',
        desc: 'Hits made during the war but against targets outside the opponent faction.',
        unitName: state.filters.excludeNonChain ? 'outside hits (chain only)' : 'outside hits',
        priceSuffix: 'per hit'
    },
    {
        key: 'respect',
        label: 'Respect',
        icon: Target,
        color: 'text-emerald-500',
        desc: state.filters.excludeNonWar && state.filters.excludeBonusRespect ? 'Total respect gained from attacks against the opposing faction (excluding chain bonus points)' :
              state.filters.excludeNonWar ? 'Total respect gained from attacks against the opposing faction' :
              'Total respect gained from attacks',
        unitName: state.filters.excludeNonWar && state.filters.excludeBonusRespect ? 'total respect (war only), (no chain bonus points)' :
                  state.filters.excludeNonWar ? 'total respect (war only)' :
                  'total respect',
        priceSuffix: 'per point'
    },
    {
        key: 'assists',
        label: 'Assists',
        icon: ShieldCheck,
        color: 'text-purple-500',
        desc: 'Supporting team attacks',
        unitName: state.filters.excludeNonWarAssists ? 'total assists (war only)' : 'total assists',
        priceSuffix: 'per assist'
    },
    {
        key: 'hosp',
        label: 'Hospitalization',
        icon: HeartPulse,
        color: 'text-red-500',
        desc: 'Attacks resulting in hospitalization',
        unitName: 'hospitalizations',
        priceSuffix: 'per hosp'
    },
    {
        key: 'stealth',
        label: 'Stealthed',
        icon: Ghost,
        color: 'text-orange-500',
        desc: 'Strategic stealthed attacks',
        unitName: 'stealthed',
        priceSuffix: 'per attack'
    },
    {
        key: 'mugs',
        label: 'Mugs',
        icon: Banknote,
        color: 'text-yellow-600',
        desc: 'Successful mugging attacks that stole money',
        unitName: 'mugging attacks',
        priceSuffix: 'per mugging'
    },
    {
        key: 'losses',
        label: 'Losses',
        icon: Skull,
        color: 'text-gray-500',
        desc: 'Attacks where the member was defeated',
        unitName: state.filters.excludeNonWarLosses ? 'losses (war only)' : 'losses',
        priceSuffix: 'per loss'
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-primary">
          <BarChart4 className="w-4 h-4" /> Metrics Configuration
        </h3>
        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-all">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Filter className="w-3 h-3" /> War Filters
        </p>
        <div className="grid grid-cols-1 gap-3">
            <label className="flex flex-col p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Exclude Non-Chain Hits</span>
                    <input type="checkbox" checked={state.filters.excludeNonChain} onChange={(e) => setFilter('excludeNonChain', e.target.checked)} className="w-4 h-4 accent-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">When enabled, hits that did not contribute to the chain will be excluded</span>
            </label>
            <label className="flex flex-col p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Exclude Chain Bonus Respect</span>
                    <input type="checkbox" checked={state.filters.excludeBonusRespect} onChange={(e) => setFilter('excludeBonusRespect', e.target.checked)} className="w-4 h-4 accent-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">When enabled, respect from chain bonus hits (10, 25, 50, 100, 250, 500, 1000, etc.) will be excluded</span>
            </label>
            <label className="flex flex-col p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Exclude Non-War Respect</span>
                    <input type="checkbox" checked={state.filters.excludeNonWar} onChange={(e) => setFilter('excludeNonWar', e.target.checked)} className="w-4 h-4 accent-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">When enabled, respect from attacks outside the war will be excluded</span>
            </label>
            <label className="flex flex-col p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Exclude Non-War Assists</span>
                    <input type="checkbox" checked={state.filters.excludeNonWarAssists} onChange={(e) => setFilter('excludeNonWarAssists', e.target.checked)} className="w-4 h-4 accent-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">When enabled, assists from attacks outside the war will be excluded</span>
            </label>
            <label className="flex flex-col p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase">Exclude Non-War Losses</span>
                    <input type="checkbox" checked={state.filters.excludeNonWarLosses} onChange={(e) => setFilter('excludeNonWarLosses', e.target.checked)} className="w-4 h-4 accent-primary" />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">When enabled, losses from attacks outside the war will be excluded</span>
            </label>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {metricItems.map((item) => {
          const config = state.metrics[item.key as keyof typeof state.metrics];
          const totalUnits = getFactionTotal(item.key);
          const subtotal = totalUnits * config.weight;
          const maxPossible = totalUnits > 0 ? (state.totalBudget / totalUnits) : 0;

          return (
            <div key={item.key} className="p-5 bg-muted/10 border border-border rounded-2xl space-y-4 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm font-black uppercase tracking-tight">{item.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs">{item.desc}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-xl font-black text-emerald-500 font-mono">
                        ${Math.round(subtotal).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Metric Allocation</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">
                        Price / Unit
                    </label>
                    <span className="text-[9px] font-bold text-primary/60 italic">Max: ${Math.round(maxPossible).toLocaleString()} / unit</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">$</span>
                    <input
                        type="number"
                        value={config.weight || ''}
                        onChange={(e) => updateMetric(item.key as any, { weight: parseFloat(e.target.value) || 0 })}
                        className={`w-full bg-background border border-border rounded-xl ${state.payoutMode === 'flat' ? 'pl-7' : 'px-4'} pr-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/50 outline-none transition-all`}
                        placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground px-1 block">Set Max Payout / Member</label>
                  <input
                    type="number"
                    value={config.max || ''}
                    placeholder="No limit"
                    onChange={(e) => updateMetric(item.key as any, { max: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border/50">
                  <p className="text-[11px] font-medium text-muted-foreground italic">
                    <strong className="text-foreground">{Math.round(totalUnits).toLocaleString()}</strong> {item.unitName} • <strong className="text-foreground">${(config.weight || 0).toLocaleString()}</strong> {item.priceSuffix}
                  </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
