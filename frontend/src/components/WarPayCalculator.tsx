'use client';

import { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Calculator, Copy, CheckCircle2, Download, ExternalLink, Settings2, Info, User } from 'lucide-react';
import { exportExcel } from '../lib/exportUtils';

interface PayoutResult {
  playerId: number;
  playerName: string;
  respect: number;
  hits: number;
  payout: number;
  share: number;
}

export default function WarPayCalculator() {
  const [budget, setBudget] = useState<string>('');
  const [pricePerRespect, setPricePerRespect] = useState<string>('');
  const [pricePerHit, setPricePerHit] = useState<string>('');

  const [results, setResults] = useState<PayoutResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { showToast } = useToast();

  const formatNumberInput = (value: string, setter: (val: string) => void) => {
      const clean = value.replace(/[^0-9]/g, '');
      const formatted = clean ? parseInt(clean).toLocaleString('en-US') : '';
      setter(formatted);
  };

  const handleCalculate = async () => {
    const cleanBudget = budget.replace(/,/g, '');
    const cleanRespectPrice = pricePerRespect.replace(/,/g, '');
    const cleanHitPrice = pricePerHit.replace(/,/g, '');

    if (!cleanBudget && !cleanRespectPrice && !cleanHitPrice) {
      showToast('Please enter at least one value (Budget or Unit Prices)', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        budget: cleanBudget ? Number(cleanBudget) : undefined,
        pricePerRespect: cleanRespectPrice ? Number(cleanRespectPrice) : 0,
        pricePerHit: cleanHitPrice ? Number(cleanHitPrice) : 0
      };

      const response = await api.post('/api/faction/payout', payload);
      setResults(response.data);
      showToast('Payout distribution calculated successfully', 'success');
      setCopied(false);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to calculate payouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results) return;
    const text = results
      .map(r => `${r.playerName} [${r.playerId}] | Payout: $${r.payout.toLocaleString('en-US')} (${r.share}%)`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Results copied to clipboard', 'success');
  };

  const handleDownloadExcel = () => {
    if (!results) return;
    exportExcel(results, 'War_Pay_Distribution');
    showToast('Excel downloaded successfully', 'success');
  };

  const totalPayout = results?.reduce((acc, r) => acc + r.payout, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Payout Configuration</h2>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black tracking-widest border border-primary/20">
                HYBRID CALC 2.0
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fixed Budget ($)</label>
                <input
                    type="text"
                    value={budget}
                    onChange={(e) => formatNumberInput(e.target.value, setBudget)}
                    placeholder="Total to distribute..."
                    className="bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">Overrides unit prices if set.</p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price per Respect ($)</label>
                <input
                    type="text"
                    value={pricePerRespect}
                    onChange={(e) => formatNumberInput(e.target.value, setPricePerRespect)}
                    placeholder="e.g. 100,000"
                    className="bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price per Hit ($)</label>
                <input
                    type="text"
                    value={pricePerHit}
                    onChange={(e) => formatNumberInput(e.target.value, setPricePerHit)}
                    placeholder="e.g. 50,000"
                    className="bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                />
            </div>

            <div className="flex items-end">
                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-[46px] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Calculator className="w-5 h-5" /> CALCULATE</>}
                </button>
            </div>
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-start gap-3 text-foreground/80">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
                <p className="font-bold text-foreground mb-1">Calculation Logic:</p>
                <ul className="list-disc ml-4 space-y-1">
                    <li><strong>Fixed Budget:</strong> If you enter an amount here, the system will distribute exactly this total among members based on their <strong>Respect share</strong>. (Unit prices are ignored).</li>
                    <li><strong>Unit Prices:</strong> If Fixed Budget is empty, the system calculates each member's pay by multiplying their <strong>Respect</strong> and <strong>Hits</strong> with the prices you set.</li>
                </ul>
            </div>
        </div>
      </div>

      <div className="pt-2">
        {!results ? (
          <div className="text-center py-20 text-muted-foreground text-sm bg-muted/20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-4">
            <Calculator className="w-10 h-10 text-muted-foreground/30" />
            <p className="font-bold text-foreground">Ready for analysis</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
                <div>
                    <h3 className="text-lg font-black text-foreground">DISTRIBUTION INTEL</h3>
                    <p className="text-sm text-muted-foreground">Total: <span className="font-mono font-bold text-foreground">${totalPayout.toLocaleString()}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={copyToClipboard} className="text-sm flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy</button>
                  <button onClick={handleDownloadExcel} className="text-sm flex items-center gap-2 text-blue-500 font-bold bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20"><Download className="w-4 h-4" /> Export</button>
                </div>
            </div>

            <div className="overflow-hidden border border-border rounded-2xl shadow-xl bg-card">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-widest font-black border-b border-border">
                    <th className="py-4 px-6">Member Name</th>
                    <th className="py-4 px-4 text-center">Respect</th>
                    <th className="py-4 px-4 text-center">Hits</th>
                    <th className="py-4 px-4 text-right">Share %</th>
                    <th className="py-4 px-6 text-right">Payout ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((res) => (
                    <tr key={res.playerId} className="hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-6">
                          <div className="flex flex-col gap-0.5">
                              <span className="font-black text-foreground text-sm flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-primary" />
                                {res.playerName || `Member ${res.playerId}`}
                              </span>
                              <a
                                  href={`https://www.torn.com/profiles.php?XID=${res.playerId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors w-fit"
                              >
                                  ID: {res.playerId} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                          </div>
                      </td>
                      <td className="py-4 px-4 text-center font-mono font-bold text-foreground">{res.respect.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground font-medium">{res.hits}</td>
                      <td className="py-4 px-4 text-right font-bold text-foreground">{res.share}%</td>
                      <td className="py-4 px-6 text-right font-mono font-black text-primary text-base">${res.payout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
