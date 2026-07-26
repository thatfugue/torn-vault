'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MetricConfig {
  weight: number;
  max?: number;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
}

interface Adjustment {
  memberId: number;
  amount: number;
  reason: string;
  type: 'bonus' | 'penalty';
}

interface WarPayState {
  warId: string;
  warData: any | null;
  selectedFactionId: string;
  loading: boolean;
  payoutMode: 'percentage' | 'flat';
  totalBudget: number;
  minAttacks: number;
  expenses: Expense[];
  filters: {
    excludeNonChain: boolean;
    excludeBonusRespect: boolean;
    excludeNonWar: boolean;
    excludeNonWarAssists: boolean;
    excludeNonWarLosses: boolean;
  };
  metrics: {
    totalHits: MetricConfig;
    warHits: MetricConfig;
    nonWarHits: MetricConfig;
    respect: MetricConfig;
    assists: MetricConfig;
    hosp: MetricConfig;
    stealth: MetricConfig;
    mugs: MetricConfig;
    losses: MetricConfig;
  };
  adjustments: Adjustment[];
  paidMembers: number[];
  results: any[];
  totalAllocated: number;
}

const initialState: WarPayState = {
  warId: '',
  warData: null,
  selectedFactionId: '',
  loading: false,
  payoutMode: 'flat',
  totalBudget: 0,
  minAttacks: 0,
  expenses: [],
  filters: {
    excludeNonChain: true,
    excludeBonusRespect: true,
    excludeNonWar: true,
    excludeNonWarAssists: true,
    excludeNonWarLosses: true,
  },
  metrics: {
    totalHits: { weight: 0 },
    warHits: { weight: 0 },
    nonWarHits: { weight: 0 },
    respect: { weight: 0 },
    assists: { weight: 0 },
    hosp: { weight: 0 },
    stealth: { weight: 0 },
    mugs: { weight: 0 },
    losses: { weight: 0 },
  },
  adjustments: [],
  paidMembers: [],
  results: [],
  totalAllocated: 0
};

const WarPayContext = createContext<{
  state: WarPayState;
  setWarId: (id: string) => void;
  setWarData: (data: any) => void;
  setSelectedFactionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setPayoutMode: (mode: 'percentage' | 'flat') => void;
  setTotalBudget: (budget: number) => void;
  setMinAttacks: (min: number) => void;
  setFilter: (name: keyof WarPayState['filters'], value: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  updateMetric: (name: keyof WarPayState['metrics'], config: Partial<MetricConfig>) => void;
  addAdjustment: (adj: Adjustment) => void;
  removeAdjustment: (memberId: number, type: 'bonus' | 'penalty') => void;
  togglePaid: (memberId: number) => void;
  calculatePayouts: () => void;
} | undefined>(undefined);

export function WarPayProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WarPayState>(initialState);

  const setWarId = (warId: string) => setState(prev => ({ ...prev, warId }));

  const setWarData = (warData: any) => {
      const rawData = warData.rankedwarreport || warData;
      const fIds = Object.keys(rawData.factions || {});
      const autoId = String(warData.my_faction_id || fIds[0] || '');
      setState(prev => ({ ...prev, warData, selectedFactionId: autoId }));
  };

  const setSelectedFactionId = (selectedFactionId: string) => setState(prev => ({ ...prev, selectedFactionId }));
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));
  const setPayoutMode = (payoutMode: 'percentage' | 'flat') => setState(prev => ({ ...prev, payoutMode }));
  const setTotalBudget = (totalBudget: number) => setState(prev => ({ ...prev, totalBudget }));
  const setMinAttacks = (minAttacks: number) => setState(prev => ({ ...prev, minAttacks }));
  const setFilter = (name: keyof WarPayState['filters'], value: boolean) =>
    setState(prev => ({ ...prev, filters: { ...prev.filters, [name]: value } }));

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setState(prev => ({
      ...prev,
      expenses: [...prev.expenses, { ...expense, id: Math.random().toString(36).substr(2, 9) }]
    }));
  };

  const removeExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const updateMetric = (name: keyof WarPayState['metrics'], config: Partial<MetricConfig>) => {
    setState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [name]: { ...prev.metrics[name], ...config }
      }
    }));
  };

  const addAdjustment = (adj: Adjustment) => {
    setState(prev => ({
      ...prev,
      adjustments: [...prev.adjustments, adj]
    }));
  };

  const removeAdjustment = (memberId: number, type: 'bonus' | 'penalty') => {
    setState(prev => ({
      ...prev,
      adjustments: prev.adjustments.filter(a => !(a.memberId === memberId && a.type === type))
    }));
  };

  const togglePaid = (memberId: number) => {
    setState(prev => ({
      ...prev,
      paidMembers: prev.paidMembers.includes(memberId)
        ? prev.paidMembers.filter(id => id !== memberId)
        : [...prev.paidMembers, memberId]
    }));
  };

  const safeParse = (val: any) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
  };

  const calculatePayouts = () => {
    try {
      if (!state.warData || !state.selectedFactionId) return;

      const rawData = state.warData.rankedwarreport || state.warData;
      const factions = rawData.factions || {};
      const targetFaction = factions[state.selectedFactionId];
      if (!targetFaction) return;

      const members = targetFaction.members || {};
      const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
      const distributableBudget = Math.max(0, state.totalBudget - totalExpenses);

      let results = Object.entries(members).map(([id, m]: [string, any]) => {
        if (!m) return null;
        const memberId = Number(id);

        const backendWarHits = safeParse(m.war_attacks);
        const backendNWChain = safeParse(m.nw_hits_chain);
        const backendNWAll = safeParse(m.nw_hits_all);

        const nonWarHits = state.filters.excludeNonChain ? backendNWChain : backendNWAll;
        const totalHits = backendWarHits + nonWarHits;

        let respect = 0;
        const rawWarRespectBase = safeParse(m.war_respect_base);
        const trueWarRespectTotal = safeParse(m.respect || m.score);
        const warResBonus = safeParse(m.war_respect_bonus);
        const nwResBase = safeParse(m.nw_respect_base);
        const nwResBonus = safeParse(m.nw_respect_bonus);

        if (state.filters.excludeNonWar && state.filters.excludeBonusRespect) {
            respect = rawWarRespectBase;
        } else if (state.filters.excludeNonWar) {
            respect = rawWarRespectBase + warResBonus;
        } else {

            respect = rawWarRespectBase + nwResBase;
            if (!state.filters.excludeBonusRespect) {
                respect += (warResBonus + nwResBonus);
            }
        }

        const displayRespect = Math.round(respect);

        const assists = state.filters.excludeNonWarAssists ? safeParse(m.war_assists) : (safeParse(m.war_assists) + safeParse(m.nw_assists));
        const hosp = safeParse(m.war_hosp) + safeParse(m.nw_hosp);
        const stealth = safeParse(m.war_stealth) + safeParse(m.nw_stealth);
        const mugs = safeParse(m.war_mugs) + safeParse(m.nw_mugs);
        const losses = state.filters.excludeNonWarLosses ? safeParse(m.war_lost) : (safeParse(m.war_lost) + safeParse(m.nw_lost));

        if (backendWarHits < state.minAttacks) return null;

        let memberScore = 0;
        const calc = (val: number, config: MetricConfig) => {
          let s = val * (config.weight || 0);
          if (config.max && config.max > 0) s = Math.min(s, config.max);
          return s;
        };

        memberScore += calc(totalHits, state.metrics.totalHits);
        memberScore += calc(backendWarHits, state.metrics.warHits);
        memberScore += calc(nonWarHits, state.metrics.nonWarHits);
        memberScore += calc(respect, state.metrics.respect);
        memberScore += calc(assists, state.metrics.assists);
        memberScore += calc(hosp, state.metrics.hosp);
        memberScore += calc(stealth, state.metrics.stealth);
        memberScore += calc(mugs, state.metrics.mugs);
        memberScore += calc(losses, state.metrics.losses);

        return {
          id: memberId,
          name: m.name || `Member ${memberId}`,
          level: safeParse(m.level),
          score: memberScore,
          basePayout: 0,
          bonus: state.adjustments.filter(a => a.memberId === memberId && a.type === 'bonus').reduce((sum, a) => sum + a.amount, 0),
          penalty: state.adjustments.filter(a => a.memberId === memberId && a.type === 'penalty').reduce((sum, a) => sum + a.amount, 0),
          stats: { totalHits, warHits: backendWarHits, nonWarHits, respect, assists, hosp, stealth, mugs, losses }
        };
      }).filter(Boolean) as any[];

      const totalScore = results.reduce((sum, r) => sum + r.score, 0);

      results = results.map(r => {
        let basePayout = 0;
        let share = 0;

        if (state.payoutMode === 'percentage') {
          share = totalScore > 0 ? r.score / totalScore : 0;
          basePayout = distributableBudget * share;
        } else {
          basePayout = r.score;
          share = totalScore > 0 ? r.score / totalScore : 0;
        }

        const finalPayout = Math.max(0, basePayout + (r.bonus || 0) - (r.penalty || 0));
        return { ...r, basePayout, finalPayout, share: (share * 100).toFixed(2) };
      });

      const totalAllocated = results.reduce((sum, r) => sum + r.finalPayout, 0) + totalExpenses;
      results.sort((a, b) => (b.finalPayout || 0) - (a.finalPayout || 0));
      setState(prev => ({ ...prev, results, totalAllocated }));
    } catch (error) {
      console.error('CRITICAL ERROR IN PAYOUT CALCULATION:', error);
    }
  };

  useEffect(() => {
    if (state.warData) calculatePayouts();
  }, [state.warData, state.selectedFactionId, state.metrics, state.totalBudget, state.expenses, state.adjustments, state.payoutMode, state.minAttacks, state.filters]);

  return (
    <WarPayContext.Provider value={{
      state, setWarId, setWarData, setSelectedFactionId, setLoading, setPayoutMode,
      setTotalBudget, setMinAttacks, setFilter, addExpense, removeExpense,
      updateMetric, addAdjustment, removeAdjustment, togglePaid,
      calculatePayouts
    }}>
      {children}
    </WarPayContext.Provider>
  );
}

export function useWarPay() {
  const context = useContext(WarPayContext);
  if (context === undefined) {
    throw new Error('useWarPay must be used within a WarPayProvider');
  }
  return context;
}
