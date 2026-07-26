'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Shield, Target, Terminal, Calculator, X, Command, User, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../lib/api';

const ACTIONS = [
    { id: 'roster', label: 'Faction Roster', path: '/dashboard/roster', icon: Users, category: 'Navigation' },
    { id: 'armory', label: 'Armory Intelligence', path: '/dashboard/armory', icon: Shield, category: 'Navigation' },
    { id: 'crimes', label: 'OC Tactical Board', path: '/dashboard/crimes', icon: Target, category: 'Navigation' },
    { id: 'logs', label: 'Intelligence Feed', path: '/dashboard/logs', icon: Terminal, category: 'Navigation' },
    { id: 'warpay', label: 'War Pay Calculator', path: '/dashboard/warpay', icon: Calculator, category: 'Navigation' },
    { id: 'warintel', label: 'War Intelligence', path: '/dashboard/war', icon: Target, category: 'Navigation' },
    { id: 'analytics', label: 'Advanced Analytics', path: '/dashboard/analytics', icon: ArrowRight, category: 'Navigation' },
];

interface Member {
    id: string;
    name: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
        try {
            const response = await api.get('/api/faction/roster');
            if (mounted && response.data && Array.isArray(response.data)) {
                setMembers(response.data.map((m: any) => ({ id: String(m.id), name: m.name })));
            }
        } catch (e) {

        }
    };

    const timer = setTimeout(fetchMembers, 1000);

    return () => {
        mounted = false;
        clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpen);
    };
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
    setQuery('');
  };

  const openTornProfile = (id: string) => {
      window.open(`https://www.torn.com/profiles.php?XID=${id}`, '_blank');
      setIsOpen(false);
      setQuery('');
  };

  const filteredActions = ACTIONS.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMembers = query.length > 1
    ? members.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  const tools = query.length > 2 ? [
      { id: 'tool-armory', label: `Search Armory for "${query}"`, path: `/dashboard/armory?q=${query}`, icon: Shield },
      { id: 'tool-logs', label: `Search Logs for "${query}"`, path: `/dashboard/logs?q=${query}`, icon: Terminal }
  ] : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {}
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            placeholder="Search members, items, logs or commands..."
            className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-4 text-base outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 && filteredMembers.length === 0 && tools.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-4">
              {}
              {filteredActions.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Quick Navigation
                  </div>
                  {filteredActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleNavigate(action.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary/10 hover:text-primary rounded-xl text-sm font-bold transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <action.icon className="w-4 h-4" />
                        </div>
                        {action.label}
                      </div>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-primary/20 px-1.5 py-0.5 rounded text-primary">JUMP</span>
                    </button>
                  ))}
                </div>
              )}

              {}
              {filteredMembers.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Operatives Found
                  </div>
                  {filteredMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => openTornProfile(member.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl text-sm font-bold transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <User className="w-4 h-4" />
                        </div>
                        {member.name} <span className="text-xs font-mono opacity-40">[{member.id}]</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {}
              {tools.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Intelligence Tools
                  </div>
                  {tools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleNavigate(tool.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-500/10 hover:text-blue-500 rounded-xl text-sm font-bold transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <tool.icon className="w-4 h-4" />
                      </div>
                      {tool.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Command className="w-3 h-3" /> Search Intelligence</span>
                <span className="flex items-center gap-1.5">Esc to close</span>
            </div>
            <span>Global Intel Engine</span>
        </div>
      </div>
    </div>
  );
}
