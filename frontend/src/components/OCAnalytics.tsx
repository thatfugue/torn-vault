'use client';

import React from 'react';
import { Target, CheckCircle2, XCircle, PieChart } from 'lucide-react';

interface OCTrend {
    total: number;
    success: number;
    fail: number;
}

interface OCAnalyticsProps {
    data: Record<string, OCTrend>;
    loading: boolean;
}

export default function OCAnalytics({ data, loading }: OCAnalyticsProps) {
  if (loading || !data) {
    return (
        <div className="p-12 text-center animate-pulse flex flex-col items-center gap-4 bg-card border border-border rounded-2xl">
            <PieChart className="w-10 h-10 text-primary/50" />
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Extracting Crime History...</div>
        </div>
    );
  }

  const sortedTrends = Object.entries(data).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedTrends.length > 0 ? sortedTrends.map(([name, stats]) => {
          const successRate = ((stats.success / Math.max(stats.total, 1)) * 100).toFixed(1);
          return (
            <div key={name} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-primary/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-black text-foreground uppercase tracking-tight text-sm">{name}</h3>
                    </div>
                    <div className="text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground uppercase">
                        {stats.total} Total
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-2xl font-black text-foreground">{successRate}%</div>
                        <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">Success Rate</div>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                        <div
                            className="h-full bg-green-500 transition-all duration-1000"
                            style={{ width: `${successRate}%` }}
                        />
                        <div
                            className="h-full bg-destructive transition-all duration-1000"
                            style={{ width: `${100 - Number(successRate)}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs font-bold text-muted-foreground">{stats.success} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                            <span className="text-xs font-bold text-muted-foreground">{stats.fail} Failed</span>
                        </div>
                    </div>
                </div>
            </div>
          );
      }) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border uppercase font-black text-[10px] tracking-widest leading-loose">
              No historical crime data found in the most recent faction logs.<br/>
              <span className="opacity-50">Note: Success/Failure logs usually appear after OC completion.</span>
          </div>
      )}
    </div>
  );
}
