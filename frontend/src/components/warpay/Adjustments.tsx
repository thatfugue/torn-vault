'use client';

import { useState } from 'react';
import { useWarPay } from '../../contexts/WarPayContext';
import {
  Plus, Trash2, MessageSquare, Award
} from 'lucide-react';

export default function Adjustments() {
  const { state, addAdjustment, removeAdjustment } = useWarPay();

  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'bonus' | 'penalty'>('bonus');

  const rawData = state.warData?.rankedwarreport || state.warData;
  const myFactionId = state.warData?.my_faction_id || state.selectedFactionId;
  const members = myFactionId && rawData?.factions?.[myFactionId] ? rawData.factions[myFactionId].members : {};

  const handleAddAdjustment = () => {
    if (!memberId || !amount) return;
    addAdjustment({
      memberId: parseInt(memberId, 10),
      amount: parseInt(amount.replace(/\D/g, ''), 10) || 0,
      reason,
      type
    });
    setAmount('');
    setReason('');
  };

  const getMemberName = (id: number) => members[id]?.name || `Member ${id}`;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> Adjustments (Bonuses & Penalties)
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-2xl border border-border">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Our Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Choose member...</option>
              {Object.entries(members).map(([id, m]: [string, any]) => (
                <option key={id} value={id}>{m.name} [{id}]</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Adjustment Type</label>
            <div className="flex bg-background border border-border rounded-xl p-1">
              <button
                onClick={() => setType('bonus')}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${type === 'bonus' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                BONUS
              </button>
              <button
                onClick={() => setType('penalty')}
                className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${type === 'penalty' ? 'bg-red-500 text-white shadow-sm' : 'text-muted-foreground'}`}
              >
                PENALTY
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Amount ($)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
              placeholder="e.g. 5,000,000"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reason (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Top Assists"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs"
              />
              <button
                onClick={handleAddAdjustment}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> ADD
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="flex-1 space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
          {state.adjustments.length > 0 ? (
            state.adjustments.map((adj, idx) => (
              <div
                key={`${adj.memberId}-${idx}`}
                className={`flex items-center justify-between p-3.5 border rounded-xl animate-in slide-in-from-right-4 transition-all ${
                  adj.type === 'bonus'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{getMemberName(adj.memberId)}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                      adj.type === 'bonus' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {adj.type}
                    </span>
                  </div>
                  {adj.reason && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-2.5 h-2.5" /> {adj.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-black ${
                    adj.type === 'bonus' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {adj.type === 'bonus' ? '+' : '-'}${adj.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeAdjustment(adj.memberId, adj.type)}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 border-2 border-dashed border-border rounded-2xl p-8 bg-muted/5">
              <Award className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No adjustments applied</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
