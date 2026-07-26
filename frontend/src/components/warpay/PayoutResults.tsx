'use client';

import { useWarPay } from '../../contexts/WarPayContext';
import { useToast } from '../../contexts/ToastContext';
import {
  CheckCircle2, Copy, ExternalLink, Users,
  AlertTriangle, DollarSign, User, ShieldCheck,
  TrendingUp, Swords, Target, Download, Vault
} from 'lucide-react';
import { exportExcel } from '../../lib/exportUtils';

export default function PayoutResults() {
  const { state, togglePaid } = useWarPay();
  const { showToast } = useToast();

  const handleCopyAll = () => {
    const text = state.results
      .map(r => `${r.name} [${r.id}] | $${Math.round(r.finalPayout).toLocaleString()}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('All results copied to clipboard', 'success');
  };

  const handleDownload = () => {
    exportExcel(state.results, `Ranked_War_${state.warId}_Payouts`);
    showToast('Payout report downloaded', 'success');
  };

  const paidCount = state.paidMembers.length;
  const totalCount = state.results.length;

  return (
    <div className="space-y-6">
      {}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/80 leading-relaxed">
          <p className="font-bold text-amber-500 mb-1 uppercase tracking-widest">Permissions Required</p>
          "Add to Vault" links require <strong>Money Giving</strong> + <strong>Money Managing</strong> permissions.
          Links will open the Torn faction vault with member ID and amount pre-filled.
        </div>
      </div>

      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Member Payouts
          </h3>
          <p className="text-[10px] text-muted-foreground font-bold">
            PROGRESS: <span className="text-primary">{paidCount} of {totalCount}</span> PAID
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyAll}
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted px-4 py-2.5 rounded-xl border border-border transition-all"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Links
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl border border-blue-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.results.map((res) => {
          const isPaid = state.paidMembers.includes(res.id);
          const vaultUrl = `https://www.torn.com/factions.php?step=your#/tab=controls&addMoneyTo=${res.id}&money=${Math.round(res.finalPayout)}`;

          return (
            <div
              key={res.id}
              className={`bg-card border transition-all rounded-2xl p-5 space-y-4 group relative overflow-hidden ${
                isPaid ? 'border-emerald-500/50 opacity-75' : 'border-border hover:border-primary/50 shadow-sm'
              }`}
            >
              {isPaid && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-10">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-sm">{res.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">ID: {res.id} • Lvl {res.level}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Share</p>
                   <p className="text-xs font-mono font-bold">{res.share}%</p>
                </div>
              </div>

              {}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/20 p-2 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Attacks</p>
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Swords className="w-3 h-3 text-primary" /> {res.stats.attacks}
                  </p>
                </div>
                <div className="bg-muted/20 p-2 rounded-lg border border-border/50">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Respect</p>
                  <p className="text-xs font-bold flex items-center gap-1">
                    <Target className="w-3 h-3 text-emerald-500" /> {res.stats.respect.toFixed(1)}
                  </p>
                </div>
              </div>

              {}
              <div className="pt-2 border-t border-border flex items-end justify-between">
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Payout</p>
                   <p className="text-lg font-black font-mono text-emerald-500">${Math.round(res.finalPayout).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => togglePaid(res.id)}
                  className={`p-2 rounded-lg transition-colors border ${
                    isPaid ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-background text-muted-foreground border-border hover:text-primary hover:border-primary'
                  }`}
                  title={isPaid ? "Mark as Unpaid" : "Mark as Paid"}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>

              {}
              <a
                href={vaultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-xs transition-all shadow-md mt-2"
              >
                <DollarSign className="w-4 h-4" /> ADD TO VAULT <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
