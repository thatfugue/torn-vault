'use client';

import { useState } from 'react';
import { useWarPay } from '../../contexts/WarPayContext';
import {
  Wallet, Plus, Trash2, Save, FolderOpen,
  Receipt, AlertCircle
} from 'lucide-react';

export default function BudgetManager() {
  const {
    state, setTotalBudget, setPayoutMode, setMinAttacks,
    addExpense, removeExpense
  } = useWarPay();

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const handleAddExpense = () => {
    if (!expenseName || !expenseAmount) return;
    addExpense({
      name: expenseName,
      amount: parseInt(expenseAmount.replace(/\D/g, ''), 10) || 0
    });
    setExpenseName('');
    setExpenseAmount('');
  };
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllocated = state.totalAllocated || 0;
  const isOverBudget = totalAllocated > state.totalBudget;
  const budgetDiff = totalAllocated - state.totalBudget;
  const budgetUsage = state.totalBudget > 0 ? (totalAllocated / state.totalBudget) * 100 : 0;

  const formatMoneyInput = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return clean ? parseInt(clean).toLocaleString() : '';
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" /> Setup & Budget
        </h3>
        <div className="flex gap-2">
           <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Save Preset"><Save className="w-4 h-4" /></button>
           <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Load Preset"><FolderOpen className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="space-y-4">
        {}
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setPayoutMode('percentage')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${state.payoutMode === 'percentage' ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground'}`}
          >
            PERCENTAGE
          </button>
          <button
            onClick={() => setPayoutMode('flat')}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${state.payoutMode === 'flat' ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground'}`}
          >
            FLAT RATE (PER UNIT)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Payout Budget ($)</label>
            <input
              type="text"
              value={state.totalBudget ? state.totalBudget.toLocaleString() : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setTotalBudget(parseInt(val) || 0);
              }}
              placeholder="e.g. 500,000,000"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Attacks Required</label>
            <input
              type="number"
              value={state.minAttacks}
              onChange={(e) => setMinAttacks(parseInt(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
            />
          </div>
        </div>

        {}
        {isOverBudget && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="text-xs">
                    <p className="font-black text-red-500 uppercase">Budget Exceeded!</p>
                    <p className="text-red-400/80 font-mono">You are ${budgetDiff.toLocaleString()} over your total budget.</p>
                </div>
            </div>
        )}

        {}
        <div className="space-y-3 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Receipt className="w-3 h-3" /> Faction Expenses
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
              placeholder="Expense Name"
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(formatMoneyInput(e.target.value))}
              placeholder="Amount"
              className="w-32 bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono"
            />
            <button
              onClick={handleAddExpense}
              className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
            {state.expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-2.5 bg-muted/20 border border-border rounded-xl text-xs animate-in slide-in-from-right-2">
                <span className="font-bold">{expense.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-red-500 font-bold">-${expense.amount.toLocaleString()}</span>
                  <button onClick={() => removeExpense(expense.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-muted-foreground">Budget Allocation</span>
            <span className={isOverBudget ? 'text-red-500' : 'text-foreground'}>
                {totalAllocated.toLocaleString()} / {state.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
            <div
              className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, budgetUsage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase font-mono">
             <span className="text-muted-foreground">Usage: {budgetUsage.toFixed(1)}%</span>
             <span className={isOverBudget ? 'text-red-500' : 'text-emerald-500'}>
                {isOverBudget ? `Over: -$${budgetDiff.toLocaleString()}` : `Rem: $${(state.totalBudget - totalAllocated).toLocaleString()}`}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
