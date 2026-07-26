'use client';

import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface FinanceData {
    deposited: number;
    withdrawn: number;
    net: number;
}

interface FinancialPulseProps {
    data: FinanceData;
    loading: boolean;
}

export default function FinancialPulse({ data, loading }: FinancialPulseProps) {
  if (loading || !data) {
    return <div className="h-32 bg-muted animate-pulse rounded-2xl" />;
  }

  const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
      }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Inflow (Recent)</div>
            <div className="text-2xl font-black text-green-500">{formatMoney(data.deposited)}</div>
            <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">Faction vault deposits</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-destructive/30 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-12 h-12 text-destructive" />
            </div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Outflow (Recent)</div>
            <div className="text-2xl font-black text-destructive">{formatMoney(data.withdrawn)}</div>
            <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">Faction vault withdrawals</div>
        </div>

        <div className={`bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group transition-all ${data.net >= 0 ? 'hover:border-primary/30' : 'hover:border-destructive/30'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className={`w-12 h-12 ${data.net >= 0 ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Net Flow</div>
            <div className={`text-2xl font-black ${data.net >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {data.net >= 0 ? '+' : ''}{formatMoney(data.net)}
            </div>
            <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter text-balance">Current liquidity trend</div>
        </div>
    </div>
  );
}
