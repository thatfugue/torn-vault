'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { ShieldCheck, UserPlus, Users, Trash2, Calendar, Search, Activity, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newDays, setNewDays] = useState('7');

  const fetchSubs = async () => {
    try {
      const res = await api.get('/api/admin/subscriptions');
      setSubs(res.data);
    } catch (e) {
      showToast('Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.name === 'sercann') fetchSubs();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/api/admin/subscriptions/add', {
        userId: newUserId,
        userName: newUserName,
        days: parseInt(newDays)
      });
      showToast(`Access granted to ${newUserName || newUserId}`, 'success');
      setNewUserId('');
      setNewUserName('');
      fetchSubs();
    } catch (e) {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure? This will revoke access instantly.')) return;
    try {
      await api.post('/api/admin/subscriptions/remove', { userId });
      showToast('Access revoked', 'success');
      fetchSubs();
    } catch (e) {
      showToast('Revoke failed', 'error');
    }
  };

  if (user?.name !== 'sercann') {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <ShieldCheck className="w-16 h-16 text-destructive opacity-20" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">Classified Information</h1>
            <p className="text-muted-foreground text-sm max-w-md">Your clearance level does not authorize access to the Master Administration terminal.</p>
        </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Master Intelligence Control</h1>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Subscriber & Access Management</p>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-1 bg-card border-2 border-border p-6 rounded-3xl shadow-sm h-fit">
              <div className="flex items-center gap-2 mb-6">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Grant Clearance</h2>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Torn User ID</label>
                      <input
                        required
                        type="text"
                        value={newUserId}
                        onChange={e => setNewUserId(e.target.value)}
                        placeholder="e.g. 4141121"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Member Name (Optional)</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        placeholder="e.g. sercann"
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Clearance Days (1 Xan = 7 Days)</label>
                      <select
                        value={newDays}
                        onChange={e => setNewDays(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      >
                          <option value="1">1 Day (Test)</option>
                          <option value="7">7 Days (1x Xanax)</option>
                          <option value="14">14 Days (2x Xanax)</option>
                          <option value="30">30 Days (Standard Monthly)</option>
                          <option value="90">90 Days (Quarterly)</option>
                          <option value="365">365 Days (Annual)</option>
                      </select>
                  </div>
                  <button
                    disabled={actionLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authorize Operative'}
                  </button>
              </form>
          </div>

          {}
          <div className="lg:col-span-2 bg-card border-2 border-border rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-black uppercase tracking-widest">Authorized Operatives</h2>
                  </div>
                  <span className="text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground uppercase">{subs.length} Active</span>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
                              <th className="px-6 py-4">Operative</th>
                              <th className="px-6 py-4">Expiration</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {subs.map(sub => (
                              <tr key={sub.userId} className="hover:bg-muted/20 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                              {sub.userName[0]}
                                          </div>
                                          <div className="flex flex-col">
                                              <span className="text-sm font-black text-foreground">{sub.userName}</span>
                                              <span className="text-[10px] font-mono text-muted-foreground">ID: {sub.userId}</span>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                          <Calendar className="w-3.5 h-3.5" />
                                          {new Date(sub.expiresAt * 1000).toLocaleDateString()}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <button
                                        onClick={() => handleRemove(sub.userId)}
                                        className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {subs.length === 0 && (
                              <tr>
                                  <td colSpan={3} className="px-6 py-12 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest italic opacity-50">
                                      No authorized operatives found in the database.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
}
