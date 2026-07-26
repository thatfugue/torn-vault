'use client';

import React, { useState } from 'react';
import { Heart, Activity, AlertTriangle, ShieldCheck, User, Info, CheckCircle2 } from 'lucide-react';

interface HealthScore {
    id: string;
    name: string;
    score: number;
    reasons: string[];
    state: string;
    lastStatus: string;
}

interface MemberHealthProps {
    data: HealthScore[];
    loading: boolean;
}

export default function MemberHealth({ data, loading }: MemberHealthProps) {
  const [showLogic, setShowLogic] = useState(false);

  if (loading || !data) {
    return (
        <div className="p-12 text-center animate-pulse flex flex-col items-center gap-4 bg-card border border-border rounded-2xl">
            <Heart className="w-10 h-10 text-destructive/50" />
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">Monitoring Vital Signals...</div>
        </div>
    );
  }

  const criticalMembers = data.filter(s => s.score < 40);
  const topPerformers = data.slice(0, 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-primary/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-destructive/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
          {}
          <div className="flex-1 bg-card border border-border p-5 rounded-2xl shadow-sm border-t-4 border-t-green-500">
             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center justify-between">
                 <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Top Active Assets</span>
                 <button onClick={() => setShowLogic(!showLogic)} className="hover:text-primary transition-colors">
                     <Info className="w-3.5 h-3.5" />
                 </button>
             </div>

             {showLogic && (
                 <div className="mb-4 p-3 bg-muted/50 rounded-lg text-[10px] font-bold text-muted-foreground leading-relaxed animate-in fade-in zoom-in-95 duration-200">
                     <div className="mb-1 text-primary font-black uppercase">Scoring Heuristics:</div>
                     • Initial state starts at 50 pts<br/>
                     • Log activity grants up to +30 pts<br/>
                     • Online (+20), Idle (+10), Offline (0)<br/>
                     • Hospital (-15), Jail (-20), Travel (-5)
                 </div>
             )}

             <div className="space-y-4">
                 {topPerformers.map(s => (
                     <div key={s.id} className="flex items-center justify-between group">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-black border border-green-500/20">
                                 {s.name[0]}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-sm font-black text-foreground">{s.name}</span>
                                 <span className="text-[9px] font-bold text-muted-foreground uppercase">{s.lastStatus}</span>
                             </div>
                         </div>
                         <div className="text-xs font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">{s.score}%</div>
                     </div>
                 ))}
             </div>
          </div>

          {}
          <div className="flex-1 bg-card border border-border p-5 rounded-2xl shadow-sm border-t-4 border-t-destructive">
             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Critical Alerts
             </div>
             <div className="space-y-4">
                 {criticalMembers.length > 0 ? criticalMembers.slice(0, 3).map(s => (
                     <div key={s.id} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center text-xs font-black border border-destructive/20">
                                 {s.name[0]}
                             </div>
                             <div className="flex flex-col">
                                 <span className="text-sm font-black text-foreground">{s.name}</span>
                                 <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">{s.reasons.find(r => r.includes('-')) || 'Low Activity'}</span>
                             </div>
                         </div>
                         <div className="text-xs font-black text-destructive bg-destructive/10 px-2 py-1 rounded-lg">{s.score}%</div>
                     </div>
                 )) : (
                     <div className="flex flex-col items-center justify-center py-4 text-center">
                         <CheckCircle2 className="w-8 h-8 text-green-500/20 mb-2" />
                         <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">All operatives stable</span>
                     </div>
                 )}
             </div>
          </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map(s => (
              <div key={s.id} className="bg-card border border-border p-4 rounded-xl hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-black truncate max-w-[100px]">{s.name}</span>
                      </div>
                      <div className={`text-xs font-black px-2 py-0.5 rounded ${getScoreBg(s.score)} ${getScoreColor(s.score)}`}>
                          {s.score}
                      </div>
                  </div>

                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full transition-all duration-1000 ${
                            s.score >= 80 ? 'bg-green-500' :
                            s.score >= 40 ? 'bg-primary' : 'bg-destructive'
                        }`}
                        style={{ width: `${s.score}%` }}
                      />
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                      {s.reasons.slice(1, 4).map((reason, idx) => (
                          <div key={idx} className={`text-[9px] font-bold uppercase tracking-tight flex items-center gap-1.5 ${reason.includes('-') ? 'text-destructive' : 'text-muted-foreground opacity-70'}`}>
                              <div className={`w-1 h-1 rounded-full ${reason.includes('-') ? 'bg-destructive' : 'bg-muted-foreground'}`} />
                              {reason}
                          </div>
                      ))}
                  </div>

                  <div className="mt-2 pt-2 flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 border-t border-border/20">
                      <span>{s.lastStatus}</span>
                      <span>{s.state}</span>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}
