'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import {
    Search, Shield, DollarSign, Users, AlertTriangle,
    RefreshCcw, Download, Terminal, Activity, LucideIcon
} from 'lucide-react';
import { exportExcel } from '../lib/exportUtils';

interface UnifiedLog {
  id: string;
  type: 'armory' | 'crime' | 'funds' | 'main' | 'membership';
  timestamp: number;
  news: string;
}

interface ParsedLog extends UnifiedLog {
  plainText: string;
  actorName: string;
  actorId: string;
  actionWord: string;
}

const parseHtmlLog = (log: UnifiedLog): ParsedLog => {
  const html = log.news;
  let actorName = 'Unknown';
  let actorId = '';

  const profileMatch = html.match(/<a\s+[^>]*href=["']?[^>]+XID=(\d+)[^>]*["']?[^>]*>([^<]+)<\/a>/i);
  if (profileMatch) {
    actorId = profileMatch[1];
    actorName = profileMatch[2];
  }

  let plainText = html.replace(/<[^>]+>/g, '').trim();

  if (actorName === 'Unknown') {
      const globalIdMatch = plainText.match(/^(.+?)\s*\[(\d+)\]/);
      if (globalIdMatch) {
          actorName = globalIdMatch[1].trim();
          actorId = globalIdMatch[2];
      }
  }

  let actionWord = '';
  if (actorName !== 'Unknown') {
      const parts = plainText.split(actorName);
      if (parts.length > 1) {
          const words = parts[1].trim().split(' ');
          if (words.length > 0) {
              actionWord = words[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
          }
      }
  } else {
      actionWord = plainText.split(' ')[0].toLowerCase() || '';
  }

  return { ...log, plainText, actorName, actorId, actionWord };
};

interface LogTypeConfig {
    id: string;
    label: string;
    icon: LucideIcon | null;
    color: string;
    bg: string;
}

const LOG_TYPES: LogTypeConfig[] = [
    { id: 'all', label: 'All Intel', icon: null, color: '', bg: '' },
    { id: 'armory', label: 'Armory', icon: Shield, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'funds', label: 'Funds', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'crime', label: 'Crimes', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'membership', label: 'Roster', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'main', label: 'Main', icon: Terminal, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export default function UnifiedLogs() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { showToast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchLock = useRef(false);

  const fetchLogs = async (isLoadMore = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let url = '/api/faction/logs';
      if (isLoadMore && logs.length > 0) {
          const oldestTimestamp = logs[logs.length - 1].timestamp;
          url += `?to=${oldestTimestamp}`;
      }

      const response = await api.get(url);
      const fetchedLogs = (response.data || []).map(parseHtmlLog);

      if (fetchedLogs.length === 0) {
          setHasMore(false);
      }

      if (isLoadMore) {
          setLogs(prev => {
              const existingIds = new Set(prev.map(l => l.id));
              const newLogs = fetchedLogs.filter((l: ParsedLog) => !existingIds.has(l.id));
              return [...prev, ...newLogs];
          });
      } else {
          setLogs(fetchedLogs);
          setHasMore(fetchedLogs.length > 0);
      }
    } catch (error: any) {
      showToast('Failed to load intelligence feed', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setTimeout(() => { fetchLock.current = false; }, 800);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchLogs(true);
        }
      },
      { threshold: 1.0, rootMargin: '100px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, logs]);

  const filteredLogs = useMemo(() => {
      return logs.filter(log => {
          const matchesSearch = (log.plainText || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesType = typeFilter === 'all' || log.type === typeFilter;
          return matchesSearch && matchesType;
      });
  }, [logs, searchTerm, typeFilter]);

  const getLogTypeInfo = (type: string): LogTypeConfig => {
      return LOG_TYPES.find(t => t.id === type) || { id: 'unknown', label: 'Unknown', icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' };
  };

  const handleDownloadExcel = () => {
      const exportData = filteredLogs.map(log => ({
        Date: new Date(log.timestamp * 1000).toLocaleString('en-US'),
        Type: log.type.toUpperCase(),
        Player: log.actorName !== 'Unknown' ? log.actorName : 'System',
        PlayerID: log.actorId,
        RawLog: log.plainText
      }));
      exportExcel(exportData, `Unified_Terminal_Logs_${typeFilter}`);
      showToast('Excel downloaded successfully', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4 sticky top-0 z-20 backdrop-blur-md bg-card/90">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {LOG_TYPES.map(type => {
                  const Icon = type.icon;
                  const isActive = typeFilter === type.id;
                  return (
                     <button
                        key={type.id}
                        onClick={() => setTypeFilter(type.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                     >
                        {Icon && <Icon className="w-4 h-4" />}
                        {type.label}
                     </button>
                  )
              })}
          </div>

          <div className="flex gap-2 shrink-0">
            <button onClick={() => fetchLogs()} disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium">
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>
            <button onClick={handleDownloadExcel} className="text-sm flex items-center justify-center gap-2 text-blue-500 hover:text-blue-400 font-bold bg-blue-500/10 px-4 py-2 rounded-lg">
                <Download className="w-4 h-4" />
                <span className="hidden lg:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
                type="text"
                placeholder="Search intel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
            />
        </div>
      </div>

      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse text-sm font-medium flex flex-col items-center gap-3 bg-card border border-border rounded-xl">
            <Terminal className="w-8 h-8 text-muted-foreground/50" />
            Connecting to Torn...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-xl italic">
            No matches found.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredLogs.map((log) => {
              const typeInfo = getLogTypeInfo(log.type);
              const LogIcon = typeInfo.icon || Activity;
              const displayHtml = (log.plainText || '').replace(log.actorName, `<span class="font-bold text-foreground">${log.actorName}</span>`);

              return (
                <div key={log.id} className="group bg-card border border-border hover:border-primary/30 p-4 rounded-xl shadow-sm transition-all flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex items-center gap-4 sm:w-48 shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.bg}`}>
                            <LogIcon className={`w-5 h-5 ${typeInfo.color}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{log.type}</span>
                            <span className="text-sm font-bold text-foreground">
                                {new Date(log.timestamp * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1 border-l-2 border-border/50 pl-4 sm:border-l-0 sm:pl-0">
                        <div className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: displayHtml }} />
                    </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={observerTarget} className="py-6 flex justify-center">
           {loadingMore && <div className="text-xs text-muted-foreground animate-pulse">Decrypting archives...</div>}
           {!hasMore && logs.length > 0 && <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">End of Intelligence Feed</span>}
        </div>
      </div>
    </div>
  );
}
