'use client';

import { useWarPay } from '../../contexts/WarPayContext';
import {
  Trophy, Swords, Target, TrendingUp,
  Coins, Box, Zap
} from 'lucide-react';

export default function WarSummary() {
  const { state } = useWarPay();
  const data = state.warData;

  if (!data) return null;

  const rawData = data.rankedwarreport || data;
  const factions = rawData.factions || {};
  const warInfo = rawData.war || {};

  const factionIds = Object.keys(factions);
  if (factionIds.length === 0) return null;

  const safeParse = (val: any) => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      const cleaned = String(val).replace(/,/g, '');
      return parseFloat(cleaned) || 0;
  };

  const myFactionId = String(data.my_faction_id || factionIds[0]);
  const oppFactionId = String(data.opponent_faction_id || factionIds.find(id => String(id) !== myFactionId) || factionIds[0]);

  const myFaction = factions[myFactionId];
  const oppFaction = factions[oppFactionId];

  if (!myFaction || !oppFaction) return null;

  let rewardsObj = myFaction.rewards || {};
  const items = Array.isArray(rewardsObj.items || {}) ? rewardsObj.items : Object.values(rewardsObj.items || {});
  const points = safeParse(rewardsObj.points);

  const myRespectGained = rawData.faction_stats?.war_respect_base || safeParse(myFaction.rewards?.respect) || Object.values(myFaction.members || {}).reduce((sum: number, m: any) => sum + safeParse(m.respect || m.score), 0);

  const myWarScore = safeParse(myFaction.score);
  const oppWarScore = safeParse(oppFaction.score);

  const efficiency = myRespectGained / (safeParse(myFaction.attacks) || 1);
  const durationMs = (safeParse(warInfo.end) - safeParse(warInfo.start)) * 1000;
  const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);

  const rankBefore = myFaction.rank_before || 'N/A';
  const rankAfter = myFaction.rank_after || 'N/A';

  const getRankColor = (rankStr: string) => {
      if (rankStr.includes('Diamond')) return 'text-blue-400';
      if (rankStr.includes('Platinum')) return 'text-slate-300';
      if (rankStr.includes('Gold')) return 'text-yellow-500';
      if (rankStr.includes('Silver')) return 'text-slate-400';
      if (rankStr.includes('Bronze')) return 'text-orange-700';
      return 'text-foreground';
  };

  const getRankWeight = (rankStr: string) => {
      if (rankStr.includes('Diamond')) return 600;
      if (rankStr.includes('Platinum')) return 500;
      if (rankStr.includes('Gold')) return 400;
      if (rankStr.includes('Silver')) return 300;
      if (rankStr.includes('Bronze')) return 200;
      return 100;
  };

  const getSubRank = (rankStr: string) => {
      if (rankStr.includes(' I')) return 3;
      if (rankStr.includes(' II')) return 2;
      if (rankStr.includes(' III')) return 1;
      return 0;
  };

  const weightBefore = getRankWeight(rankBefore) + getSubRank(rankBefore);
  const weightAfter = getRankWeight(rankAfter) + getSubRank(rankAfter);
  const isPromotion = weightAfter > weightBefore;
  const isDemotion = weightAfter < weightBefore;

  const getCachePrice = (itemId: string, name: string) => {
      const n = (name || '').toLowerCase();
      if (n.includes('armor')) return 330453332;
      if (n.includes('melee')) return 167827925;
      if (n.includes('medium')) return 225329998;
      if (n.includes('small')) return 118454013;
      if (n.includes('heavy')) return 480000000;
      return 10000000;
  };

  const rawItems = rewardsObj.items || {};
  const itemDetails = Object.entries(rawItems).map(([id, item]: [string, any]) => ({
      name: item.name,
      quantity: item.quantity || 1,
      unitPrice: getCachePrice(id, item.name),
      totalPrice: (item.quantity || 1) * getCachePrice(id, item.name)
  }));

  const totalItemValue = itemDetails.reduce((sum: number, i: any) => sum + i.totalPrice, 0);
  const pointValue = points > 0 ? points * 33936 : 0;
  const totalValue = totalItemValue + pointValue;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Trophy className={`w-12 h-12 ${warInfo.winner === Number(myFactionId) ? 'text-yellow-500' : 'text-gray-500'}`} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">War Status</p>
            <h4 className={`text-xl font-black truncate ${warInfo.winner === Number(myFactionId) ? 'text-emerald-500' : 'text-rose-500'}`}>
                {warInfo.winner === Number(myFactionId) ? 'VICTORY' : 'DEFEAT'}
            </h4>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Duration: <span className="text-foreground font-bold">{durationHours} hours</span>
            </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Rank Change</p>
            <div className="flex items-center gap-3">
                <span className={`text-lg font-black ${getRankColor(rankBefore)}`}>
                    {rankBefore}
                </span>
                <span className="text-primary font-black">→</span>
                <span className={`text-lg font-black ${getRankColor(rankAfter)}`}>
                    {rankAfter}
                </span>
            </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 bg-gradient-to-br from-card to-emerald-500/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Faction War Value</p>
            <h4 className="text-2xl font-black text-emerald-500 font-mono">${totalValue.toLocaleString()}</h4>
            <div className="flex gap-4 mt-2">
                <p className="text-[9px] font-bold text-muted-foreground">ITEMS: ${(totalItemValue).toLocaleString()}</p>
                {points > 0 && <p className="text-[9px] font-bold text-muted-foreground">POINTS: ${(pointValue).toLocaleString()}</p>}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                    <Swords className="w-4 h-4 text-primary" /> Faction Breakdown
                </h3>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Total War Attacks</p>
                            <p className="text-xl font-black">{((safeParse(myFaction.attacks)) + (safeParse(oppFaction.attacks))).toLocaleString()}</p>
                        </div>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex border border-border">
                            <div className="bg-primary h-full" style={{ width: `${((safeParse(myFaction.attacks)) / Math.max(1, (safeParse(myFaction.attacks)) + (safeParse(oppFaction.attacks)))) * 100}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-primary truncate uppercase">{myFaction.name}</p>
                                <p className="text-lg font-black">{(safeParse(myFaction.attacks)).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-muted-foreground truncate uppercase">{oppFaction.name}</p>
                                <p className="text-lg font-black text-muted-foreground">{(safeParse(oppFaction.attacks)).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">War Scores</p>
                            <p className="text-xl font-black">{myWarScore.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/20 rounded-xl border border-border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Our Score</p>
                                <p className="text-lg font-black text-primary">{myWarScore.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-border">
                                <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Opp Score</p>
                                <p className="text-lg font-black text-muted-foreground">{oppWarScore.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Respect Gained (Our Faction)</p>
                                <p className="text-xl font-black">{Math.round(myRespectGained).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-muted-foreground italic">Efficiency</p>
                            <p className="text-xs font-black">{efficiency.toFixed(2)} / hit</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" /> Estimated Values
            </h3>

            <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cache Value</p>
                        <p className="text-lg font-black text-emerald-500 font-mono">${totalItemValue.toLocaleString()}</p>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                        {itemDetails.length > 0 ? itemDetails.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-bold">{item.quantity}px {item.name}</span>
                                <span className="font-mono font-bold">${item.totalPrice.toLocaleString()}</span>
                            </div>
                        )) : (
                            <p className="text-center text-[10px] text-muted-foreground py-2 italic">No cache items recorded</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Points Value</p>
                        <p className="text-lg font-black text-emerald-500 font-mono">{points > 0 ? `$${pointValue.toLocaleString()}` : 'N/A'}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-border pt-4">
                        <div className="space-y-1">
                            <p className="text-muted-foreground uppercase font-bold">Total Points</p>
                            <p className="font-black text-xs">{points > 0 ? points.toLocaleString() : 'N/A'}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-muted-foreground uppercase font-bold">Avg Cost</p>
                            <p className="font-black text-xs">$33,936</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2 text-center">
                    <p className="text-[9px] text-muted-foreground italic">
                        Market rates as of: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, 12:00 AMTCT
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
