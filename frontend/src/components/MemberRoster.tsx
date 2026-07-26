'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
  rank: string;
  level: number;
  status: string;
  state: string;
  stateDescription: string;
}

export default function MemberRoster() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const fetchRoster = async () => {
      try {
        const response = await api.get('/api/faction/roster');
        if (mounted) {
          const sortedMembers = response.data.sort((a: Member, b: Member) => {
            const statusPriority: Record<string, number> = { 'Online': 0, 'Idle': 1, 'Offline': 2 };
            const priorityA = statusPriority[a.status] ?? 3;
            const priorityB = statusPriority[b.status] ?? 3;
            return priorityA - priorityB;
          });
          setMembers(sortedMembers);
        }
      } catch (error: any) {
        if (mounted) {
          showToast(error.response?.data?.error || 'Failed to load member roster', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRoster();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'Hospital': return '🏥';
      case 'Jail': return '⚖️';
      case 'Travel':
      case 'Traveling': return '✈️';
      case 'Abroad': return '🌎';
      default: return null;
    }
  };

  const getRankIcon = (rank: string | undefined | null) => {
    if (!rank) return '👤';
    const r = rank.toLowerCase();
    if (r.includes('leader') && !r.includes('co-')) return '👑';
    if (r.includes('co-leader')) return '🎖️';
    if (r.includes('member') || r.includes('trusted')) return '🛡️';
    if (r.includes('recruit')) return '🔰';
    return '👤';
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Hospital': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'Jail': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Travel':
      case 'Traveling':
      case 'Abroad': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  if (loading) {
    return <div className="text-muted-foreground animate-pulse py-8 text-center text-sm font-medium">Synchronizing roster data...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left border-collapse bg-card">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
            <th className="py-3 px-4 font-semibold">Operative</th>
            <th className="py-3 px-4 font-semibold text-center">LVL</th>
            <th className="py-3 px-4 font-semibold text-right">Status / Intelligence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.length > 0 ? (
            members.map((member) => (
              <tr key={member.id} className="group hover:bg-accent/50 transition-all duration-200">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl" title={member.rank}>{getRankIcon(member.rank)}</span>
                    <div className="flex flex-col">
                      <a href={`https://www.torn.com/profiles.php?XID=${member.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-card-foreground hover:text-primary transition-colors text-sm flex items-center gap-1">
                        {member.name || 'Unknown'}
                      </a>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {member.rank || 'Member'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-muted-foreground font-mono text-sm bg-accent px-2 py-1 rounded-md">{member.level}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border
                      ${member.status === 'Online' ? 'bg-primary/10 text-primary border-primary/20' : ''}
                      ${member.status === 'Offline' ? 'bg-muted text-muted-foreground border-border' : ''}
                      ${member.status === 'Idle' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5
                        ${member.status === 'Online' ? 'bg-primary animate-pulse' : ''}
                        ${member.status === 'Offline' ? 'bg-muted-foreground' : ''}
                        ${member.status === 'Idle' ? 'bg-amber-500' : ''}
                      `} />
                      {member.status}
                    </span>

                    {member.state !== 'Okay' && (
                      <span
                        className={`cursor-help inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStateColor(member.state)}`}
                        title={member.stateDescription}
                      >
                        <span className="mr-1.5 text-xs">{getStateIcon(member.state)}</span>
                        {member.state}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-12 text-muted-foreground italic text-center text-sm" colSpan={3}>
                No intelligence data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
