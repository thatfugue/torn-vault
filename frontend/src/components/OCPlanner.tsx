'use client';

import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Swords, Clock, AlertCircle, CheckCircle2, ShieldAlert, Crosshair, Briefcase, RefreshCcw, ExternalLink, Target, User, Users } from 'lucide-react';

import { ITEM_DATABASE } from '../shared/constants';

interface CrimeMember {
    id?: string;
    name?: string;
    state?: string;
    color?: string;
    role?: string;
    status?: string;
    description?: string;
}

interface Crime {
    id: string;
    crime_type: number;
    crime_name: string;
    time_started: number;
    time_ready: number;
    time_left: number;
    participants: CrimeMember[];
    success?: boolean;
    money_gain?: number;
    respect_gain?: number;
    status: 'Ready' | 'Blocked' | 'Planning' | 'Recruiting';
    blockReasons: string[];
    isFinished: boolean;
}

interface FactionMember {
    id: string;
    name: string;
    state: string;
    stateDescription: string;
    status: string;
    level: number;
}

const getItemName = (id: any) => {
    const numId = Number(id);
    if (!numId || isNaN(numId)) return 'Unknown Item';
    return ITEM_DATABASE[numId] || `Item #${numId}`;
};

export default function OCPlanner() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [members, setMembers] = useState<Record<string, FactionMember>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'action' | 'recruiting' | 'strategic'>('action');

  const { showToast } = useToast();

  const getChanceColor = (chanceStr: string) => {
      const match = chanceStr.match(/(\d+)/);
      if (!match) return 'text-muted-foreground';
      const val = parseInt(match[1]);
      if (val < 50) return 'text-destructive font-black';
      if (val <= 65) return 'text-orange-500 font-black';
      if (val >= 70) return 'text-green-500 font-black';
      return 'text-yellow-500 font-black';
  };

  const fetchCrimes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/faction/crimes');
      const rawCrimes = response.data.crimes || {};
      const rawMembers = response.data.members || {};

      const parsedMembers: Record<string, FactionMember> = {};

      if (Array.isArray(rawMembers)) {
          rawMembers.forEach((m: any) => {
              parsedMembers[String(m.id)] = {
                  id: String(m.id),
                  name: m.name || 'Unknown',
                  state: m.status?.state || 'Okay',
                  stateDescription: m.status?.description || '',
                  status: m.last_action?.status || 'Unknown',
                  level: m.level || 0,
              };
          });
      } else {
          Object.entries(rawMembers).forEach(([id, m]: [string, any]) => {
              parsedMembers[id] = {
                  id,
                  name: m.name || 'Unknown',
                  state: m.status?.state || 'Okay',
                  stateDescription: m.status?.description || '',
                  status: m.last_action?.status || 'Unknown',
                  level: m.level || 0,
              };
          });
      }
      setMembers(parsedMembers);

      let parsedCrimes: Crime[] = [];

      if (Array.isArray(rawCrimes)) {
          parsedCrimes = rawCrimes.map((c: any) => {
              const participants: CrimeMember[] = [];
              const blockReasons: string[] = [];

              if (Array.isArray(c.slots)) {
                  c.slots.forEach((slot: any) => {
                      const roleName = slot.position || slot.position_info?.label || 'Slot';
                      let reqItemStr = '';
                      if (slot.item_requirement) {
                          const itemName = getItemName(slot.item_requirement.id);
                          reqItemStr = slot.item_requirement.is_available ? `✅ ${itemName}` : `❌ Missing ${itemName}`;
                      }
                      const winRate = slot.checkpoint_pass_rate ? `Chance: ${slot.checkpoint_pass_rate}%` : '';
                      const description = [winRate, reqItemStr].filter(Boolean).join(' | ');

                      if (slot.user) {
                          const userIdStr = typeof slot.user === 'object' ? String(slot.user.id) : String(slot.user);
                          const member = parsedMembers[userIdStr];

                          let userName = 'Unknown';
                          if (slot.user && typeof slot.user === 'object' && slot.user.name && String(slot.user.name) !== 'undefined') {
                              userName = String(slot.user.name);
                          } else if (member && member.name) {
                              userName = member.name;
                          } else {
                              userName = `Member [${userIdStr}]`;
                          }

                          const isMissingItem = slot.item_requirement && !slot.item_requirement.is_available;
                          const isHospital = member && member.state !== 'Okay';

                          participants.push({
                              id: userIdStr,
                              name: userName,
                              role: roleName,
                              description,
                              color: isMissingItem ? 'red' : (isHospital ? 'red' : 'green')
                          });

                          if (isMissingItem) {
                              blockReasons.unshift(`🚨 ${userName} is missing: ${getItemName(slot.item_requirement.id)}`);
                          }
                          if (isHospital) {
                              blockReasons.push(`${userName} is in ${member.state} (${member.stateDescription}).`);
                          }
                      } else {
                          participants.push({
                              id: `empty-${Math.random()}`,
                              name: 'Empty Slot',
                              role: roleName,
                              description,
                              color: 'orange'
                          });
                          blockReasons.push(`⚠️ Missing operative for ${roleName} role.`);
                      }
                  });
              }

              const now = Math.floor(Date.now() / 1000);
              let timeLeft = 0;
              if (c.ready_at) {
                  timeLeft = Math.max(0, c.ready_at - now);
              } else if (c.status === 'Planning') {
                  timeLeft = c.planning_at ? Math.max(0, c.planning_at - now) : 1;
              }

              let status: 'Ready' | 'Blocked' | 'Planning' | 'Recruiting' = 'Planning';

              const hasErrors = blockReasons.some(r => r.includes('🚨') || r.includes('in '));
              const hasEmptySlots = blockReasons.some(r => r.includes('⚠️'));

              if (hasErrors) {
                  status = 'Blocked';
              } else if (hasEmptySlots) {
                  status = 'Recruiting';
              } else if (timeLeft <= 0) {
                  status = 'Ready';
              } else {
                  status = 'Planning';
              }

              return {
                  id: String(c.id),
                  crime_type: c.difficulty || 0,
                  crime_name: c.name || `Crime #${c.id}`,
                  time_started: c.created_at || c.planning_at || 0,
                  time_ready: c.ready_at || 0,
                  time_left: timeLeft,
                  participants,
                  status,
                  blockReasons,
                  isFinished: ['Success', 'Failed', 'Expired', 'Canceled'].includes(c.status) || c.executed_at !== null
              };
          });
      } else {

          parsedCrimes = Object.entries(rawCrimes).map(([id, c]: [string, any]) => {
              const crimeName = c.name || c.crime_name || (c.crime_type ? `OC Type ${c.crime_type}` : `Crime #${id}`);
              return {
                  id,
                  crime_type: c.crime_type || 0,
                  crime_name: crimeName,
                  time_started: 0,
                  time_ready: 0,
                  time_left: c.time_left || 0,
                  participants: [],
                  status: (c.time_left || 0) <= 0 ? 'Ready' : 'Planning',
                  blockReasons: [],
                  isFinished: false
              };
          });
      }

      const activeCrimes: Crime[] = [];
      const seenCrimeIds = new Set<string>();
      parsedCrimes.filter(c => !c.isFinished).forEach(crime => {
          if (!seenCrimeIds.has(crime.id)) {
              activeCrimes.push(crime);
              seenCrimeIds.add(crime.id);
          }
      });

      setCrimes(activeCrimes.sort((a, b) => a.time_left - b.time_left));
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load OC data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrimes();
  }, []);

  const readyCrimes = crimes.filter(c => c.status === 'Ready');
  const blockedCrimes = crimes.filter(c => c.status === 'Blocked');
  const planningCrimes = crimes.filter(c => c.status === 'Planning');
  const recruitingCrimes = crimes.filter(c => c.status === 'Recruiting');

  const strategicRecommendations = useMemo(() => {
    const recommendations: string[] = [];

    if (readyCrimes.length > 0) {
        recommendations.push(`🚀 ${readyCrimes.length} operation(s) are ready for immediate initiation.`);
    }

    blockedCrimes.forEach(c => {
        const hospitalCount = c.blockReasons.filter(r => r.includes('in Hospital')).length;
        const missingItemCount = c.blockReasons.filter(r => r.includes('missing:')).length;

        if (hospitalCount === 1 && missingItemCount === 0) {
            recommendations.push(`💊 "${c.crime_name}" is blocked by only ONE member in hospital. Consider Revive.`);
        } else if (missingItemCount > 0 && hospitalCount === 0) {
            recommendations.push(`📦 "${c.crime_name}" requires ${missingItemCount} item(s). Check armory stocks.`);
        }
    });

    if (recruitingCrimes.length > 0) {
        const totalEmpty = recruitingCrimes.reduce((acc, c) => acc + c.participants.filter(p => p.name?.includes('Empty')).length, 0);
        recommendations.push(`📢 ${recruitingCrimes.length} operations have ${totalEmpty} open slots. Recruit members now.`);
    }

    return recommendations;
  }, [readyCrimes, blockedCrimes, recruitingCrimes]);

  const formatTimeLeft = (seconds: number) => {
      if (seconds <= 0) return 'Ready Now';
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hrs}h ${mins}m`;
  };

  const getCrimeIcon = (type: number) => {
      if (type >= 8) return <Target className="w-5 h-5" />;
      if (type >= 5) return <Swords className="w-5 h-5" />;
      return <Briefcase className="w-5 h-5" />;
  };

  return (
    <div className="space-y-8">
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-card/90">
         <div className="flex items-center gap-3">
             <Crosshair className="w-6 h-6 text-primary" />
             <div>
                 <h2 className="font-black text-foreground uppercase tracking-tight">Tactical Board</h2>
                 <p className="text-[10px] text-muted-foreground hidden sm:block uppercase font-bold tracking-widest opacity-60">OC 2.0 Strategic Planner</p>
             </div>
         </div>
         <button onClick={fetchCrimes} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-lg text-xs transition-all shadow-md">
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
         </button>
      </div>

      {loading && crimes.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground animate-pulse text-sm font-medium flex flex-col items-center gap-4 bg-card border border-border rounded-2xl">
            <Target className="w-10 h-10 text-primary/50" />
            Intercepting Data...
          </div>
      ) : (
          <div className="flex flex-col">
              <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto scrollbar-hide">
                  <button onClick={() => setActiveTab('action')} className={`px-4 py-3 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${activeTab === 'action' ? 'text-destructive border-destructive bg-destructive/5' : 'text-muted-foreground border-transparent hover:bg-muted/50'}`}>
                      <ShieldAlert className="w-4 h-4" /> Action Required
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'action' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>{blockedCrimes.length}</span>
                  </button>
                  <button onClick={() => setActiveTab('recruiting')} className={`px-4 py-3 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${activeTab === 'recruiting' ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-muted-foreground border-transparent hover:bg-muted/50'}`}>
                      <Users className="w-4 h-4" /> Recruiting
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'recruiting' ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground'}`}>{recruitingCrimes.length}</span>
                  </button>
                  <button onClick={() => setActiveTab('strategic')} className={`px-4 py-3 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 ${activeTab === 'strategic' ? 'text-foreground border-primary bg-primary/5' : 'text-muted-foreground border-transparent hover:bg-muted/50'}`}>
                      <Target className="w-4 h-4" /> Strategic Ops
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'strategic' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{planningCrimes.length + readyCrimes.length}</span>
                  </button>
              </div>

              {activeTab === 'strategic' && strategicRecommendations.length > 0 && (
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {strategicRecommendations.map((rec, i) => (
                          <div key={i} className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <ShieldAlert className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-bold text-foreground">{rec}</span>
                          </div>
                      ))}
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(activeTab === 'action' ? blockedCrimes : activeTab === 'recruiting' ? recruitingCrimes : [...readyCrimes, ...planningCrimes]).map(crime => (
                      <div key={crime.id} className={`bg-card border-2 rounded-xl p-4 shadow-sm flex flex-col gap-4 transition-all ${crime.status === 'Ready' ? 'border-green-500/30' : crime.status === 'Blocked' ? 'border-destructive/30' : crime.status === 'Recruiting' ? 'border-orange-500/30' : 'border-border'}`}>
                          <div className="flex items-center justify-between gap-2">
                              <a
                                  href="https://www.torn.com/factions.php?step=your&type=1#/tab=crimes"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 font-black text-foreground uppercase tracking-tight hover:text-primary transition-colors group/title"
                              >
                                  <span className={crime.status === 'Ready' ? 'text-green-500' : crime.status === 'Blocked' ? 'text-destructive' : crime.status === 'Recruiting' ? 'text-orange-500' : 'text-primary'}>
                                      {getCrimeIcon(crime.crime_type)}
                                  </span>
                                  {crime.crime_name}
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                              </a>
                              <span className="text-[10px] font-black bg-muted px-2 py-1 rounded text-muted-foreground uppercase">LVL {crime.crime_type}</span>
                          </div>

                          {crime.status === 'Planning' && (
                              <div className="bg-background border border-border p-2 rounded-lg flex items-center justify-center gap-2">
                                  <Clock className="w-4 h-4 text-primary animate-pulse" />
                                  <span className="text-sm font-mono font-bold text-foreground">{formatTimeLeft(crime.time_left)}</span>
                              </div>
                          )}

                          {crime.status === 'Ready' && (
                              <div className="bg-green-500/10 text-green-600 border border-green-500/20 p-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 uppercase tracking-widest">
                                  <CheckCircle2 className="w-4 h-4" /> Ready for Initiation
                              </div>
                          )}

                          {crime.blockReasons.length > 0 && (
                              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex flex-col gap-1">
                                  <div className="text-[9px] font-black text-destructive uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Tactical Alerts</div>
                                  {crime.blockReasons.map((r, i) => <div key={i} className="text-xs font-bold text-foreground leading-tight">• {r}</div>)}
                              </div>
                          )}

                          <div className="flex flex-col gap-1">
                              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex justify-between">
                                  <span>Operative Roster</span>
                                  <span>Status / Chance</span>
                              </div>
                              <div className="space-y-1">
                                  {crime.participants.filter(p => p.name && !p.name.includes('Empty')).map((p, i) => (
                                      <div key={i} className={`flex items-center justify-between p-1.5 rounded-md border transition-all ${
                                          p.color === 'red' ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/20 border-border/50'
                                      }`}>
                                          <div className="flex items-center gap-2 min-w-0">
                                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${p.color === 'red' ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                                  <User className="w-3 h-3" />
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                  <div className="flex items-center gap-2">
                                                      <a
                                                        href={p.id ? `https://www.torn.com/profiles.php?XID=${p.id}` : '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`text-sm font-black truncate hover:underline transition-all ${p.color === 'red' ? 'text-destructive' : 'text-foreground hover:text-primary'}`}
                                                      >
                                                        {p.name}
                                                      </a>
                                                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-widest border border-border/50">{p.role}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          <div className={`text-xs font-black whitespace-nowrap ml-3 bg-background/40 px-2 py-1 rounded border border-border/20 ${getChanceColor(p.description || '')}`}>
                                              {(p.description || '').split('|')[0].replace('Chance:', '').trim()}
                                          </div>
                                      </div>
                                  ))}

                                  {(() => {
                                      const emptySlots = crime.participants.filter(p => p.name && p.name.includes('Empty'));
                                      if (emptySlots.length === 0) return null;
                                      return (
                                          <div className="bg-orange-500/5 border border-orange-500/20 rounded-md p-2 flex items-center justify-between mt-1">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-5 h-5 rounded bg-orange-500/20 text-orange-500 flex items-center justify-center">
                                                      <Users className="w-3 h-3" />
                                                  </div>
                                                  <span className="text-xs font-bold text-orange-600">
                                                      {emptySlots.length}x Empty Slots
                                                  </span>
                                              </div>
                                              <div className="text-[8px] font-black text-orange-400 uppercase tracking-tighter text-right leading-tight max-w-[120px]">
                                                  {emptySlots.map(s => s.role).join(', ')}
                                              </div>
                                          </div>
                                      );
                                  })()}
                              </div>
                          </div>
                      </div>
                  ))}
                  {((activeTab === 'action' && blockedCrimes.length === 0) || (activeTab === 'recruiting' && recruitingCrimes.length === 0) || (activeTab === 'strategic' && planningCrimes.length + readyCrimes.length === 0)) && (
                      <div className="col-span-full py-20 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border uppercase font-black text-xs tracking-widest">
                          No intelligence data for this sector.
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}
