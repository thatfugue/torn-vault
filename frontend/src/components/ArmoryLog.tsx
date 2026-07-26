'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Search, Shield, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Download, AlertTriangle, AlertCircle, Filter, ExternalLink } from 'lucide-react';
import { exportExcel } from '../lib/exportUtils';

import { CATEGORIZED_ITEMS } from '../shared/constants';

interface ArmoryNews {
  id: string;
  timestamp: number;
  news: string;
}

interface ParsedLog extends ArmoryNews {
  playerName: string;
  playerId: string;
  action: 'deposit' | 'withdraw' | 'unknown';
  quantity: number;
  itemName: string;
  plainText: string;
}

interface AuditResult {
  playerName: string;
  playerId: string;
  suspiciousActions: string[];
  severity: 'high' | 'medium' | 'low';
}

const parseLog = (log: ArmoryNews): ParsedLog => {
  const html = log.news;
  let playerName = 'Unknown';
  let playerId = '';

  const profileMatch = html.match(/<a\s+[^>]*href=["']?[^>]+XID=(\d+)[^>]*["']?[^>]+XID=(\d+)[^>]*["']?[^>]*>([^<]+)<\/a>/i) ||
                       html.match(/<a\s+[^>]*href=["']?[^>]+XID=(\d+)[^>]*["']?[^>]*>([^<]+)<\/a>/i);
  if (profileMatch) {
    playerId = profileMatch[1];
    playerName = profileMatch[2];
  }

  // 2. CLEANUP for plain text parsing
  const plainText = html.replace(/<[^>]+>/g, '').trim();
  const lower = plainText.toLowerCase();

  let action: 'deposit' | 'withdraw' | 'unknown' = 'unknown';
  let quantity = 1;
  let itemName = 'Unknown';

  // 3. BROAD ACTION DETECTION
  const withdrawKeywords = ['withdrew', 'took', 'loaned', 'removed', 'taken', 'used'];
  const depositKeywords = ['deposited', 'returned', 'gave', 'added', 'put', 'filled'];

  let actionWord = '';
  if (withdrawKeywords.some(kw => {
      if (lower.includes(` ${kw} `)) {
          actionWord = kw;
          action = 'withdraw';
          return true;
      }
      return false;
  })) { /* action set */ }
  else if (depositKeywords.some(kw => {
      if (lower.includes(` ${kw} `)) {
          actionWord = kw;
          action = 'deposit';
          return true;
      }
      return false;
  })) { /* action set */ }

  if (actionWord) {
     const parts = plainText.split(new RegExp(`\\s+${actionWord}\\s+`, 'i'));
     if (parts.length >= 2) {
        if (playerName === 'Unknown') {
            const namePart = parts[0].trim();
            const idMatch = namePart.match(/^(.+?)\s*\[(\d+)\]$/);
            if (idMatch) {
                playerName = idMatch[1].trim();
                playerId = idMatch[2];
            } else {
                playerName = namePart;
            }
        }

        const itemPart = parts.slice(1).join(` ${actionWord} `).trim();
        const qtyMatch = itemPart.match(/^([\d,]+)x\s+(.+)$/i);

        if (qtyMatch) {
           quantity = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
           itemName = qtyMatch[2];
        } else {
           itemName = itemPart.replace(/^(a|an|the)\s+/i, '');
        }

        itemName = itemName
            .replace(/\s+(to|from)\s+(the\s+)?(faction\s+)?armory\.?$/i, '')
            .replace(/one of the faction's\s+(.+?)\s+items?/i, '$1')
            .replace(/one of the faction's\s+(.+?)$/i, '$1')
            .trim();
     }
  }

  if (playerName === 'Unknown') {
      const globalIdMatch = plainText.match(/^(.+?)\s*\[(\d+)\]/);
      if (globalIdMatch) {
          playerName = globalIdMatch[1].trim();
          playerId = globalIdMatch[2];
      }
  }

  return { ...log, playerName, playerId, action, quantity, itemName, plainText };
}

const runAudit = (parsedLogs: ParsedLog[]): AuditResult[] => {
   if (parsedLogs.length === 0) return [];

   // Restrict audit to the last 48 hours (2 days) to avoid irrelevant old logs triggering new alerts
   const maxTimestamp = Math.max(...parsedLogs.map(l => l.timestamp));
   const TWO_DAYS = 48 * 60 * 60;
   const recentLogs = parsedLogs.filter(l => l.timestamp >= maxTimestamp - TWO_DAYS);

   // Group by user
   const userLogs: Record<string, { id: string, logs: ParsedLog[] }> = {};

   recentLogs.forEach(log => {
      if (log.action === 'unknown') return;
      if (!userLogs[log.playerName]) userLogs[log.playerName] = { id: log.playerId, logs: [] };
      userLogs[log.playerName].logs.push(log);
   });

   const results: AuditResult[] = [];
   const ONE_DAY = 24 * 60 * 60; // 24 hours in seconds

   const formatDate = (ts: number) => {
       return new Date(ts * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
   };

   Object.entries(userLogs).forEach(([playerName, data]) => {
      const actions: string[] = [];
      let severity = 'low' as 'high' | 'medium' | 'low';

      // Sort user logs by timestamp ascending (oldest first)
      const logs = data.logs.sort((a, b) => a.timestamp - b.timestamp);

      // Track total net items to detect long-term hoarding
      const totalNetItems: Record<string, number> = {};

      // Calculate net over time for weapons/armor
      logs.forEach(log => {
         if (!totalNetItems[log.itemName]) totalNetItems[log.itemName] = 0;
         if (log.action === 'withdraw') totalNetItems[log.itemName] += log.quantity;
         if (log.action === 'deposit') totalNetItems[log.itemName] -= log.quantity;
      });

      // Variables to track the WORST 24h window for each category to prevent overlapping duplicate spam
      let maxXanax = { net: 0, start: 0, end: 0 };
      let maxBooster = { net: 0, start: 0, end: 0 };
      let maxMed = { net: 0, start: 0, end: 0 };

      // Rolling window analysis for consumables
      for (let i = 0; i < logs.length; i++) {
         if (logs[i].action !== 'withdraw') continue;

         const windowStart = logs[i].timestamp;
         const windowLogs = logs.filter(l => l.timestamp >= windowStart && l.timestamp <= windowStart + ONE_DAY);

         const windowNet: Record<string, number> = {};
         windowLogs.forEach(log => {
            if (!windowNet[log.itemName]) windowNet[log.itemName] = 0;
            if (log.action === 'withdraw') windowNet[log.itemName] += log.quantity;
            if (log.action === 'deposit') windowNet[log.itemName] -= log.quantity;
         });

         const windowEndTs = windowLogs[windowLogs.length - 1].timestamp;

         // 1. Xanax net tracking
         const xanaxNet = windowNet['Xanax'] || 0;
         if (xanaxNet > maxXanax.net) maxXanax = { net: xanaxNet, start: windowStart, end: windowEndTs };

         // 2. Booster net tracking
         let boosterNet = 0;
         Object.keys(windowNet).forEach(item => {
             if (CATEGORIZED_ITEMS.boosters.some(b => item.includes(b))) {
                 boosterNet += windowNet[item];
             }
         });
         if (boosterNet > maxBooster.net) maxBooster = { net: boosterNet, start: windowStart, end: windowEndTs };

         // 3. Medical Drain tracking
         let medNet = 0;
         Object.keys(windowNet).forEach(item => {
             if (CATEGORIZED_ITEMS.medical.some(m => item.includes(m))) {
                 medNet += windowNet[item];
             }
         });
         if (medNet > maxMed.net) maxMed = { net: medNet, start: windowStart, end: windowEndTs };
      }

      // --- Append the worst-case alerts ---

      // 1. Xanax Abuse
      if (maxXanax.net >= 5) {
          actions.push(`[${formatDate(maxXanax.start)} - ${formatDate(maxXanax.end)}] Critical Xanax Overuse/Theft (${maxXanax.net} net withdrawn in worst 24h window).`);
          severity = 'high';
      } else if (maxXanax.net === 4) {
          actions.push(`[${formatDate(maxXanax.start)} - ${formatDate(maxXanax.end)}] Suspicious Xanax Usage (${maxXanax.net} net withdrawn in worst 24h window).`);
          if (severity === 'low') severity = 'medium';
      }

      // 2. Booster Abuse
      if (maxBooster.net >= 6) {
          actions.push(`[${formatDate(maxBooster.start)} - ${formatDate(maxBooster.end)}] Booster Hoarding/Theft (${maxBooster.net} net boosters withdrawn in worst 24h window).`);
          if (severity !== 'high') severity = 'high';
      }

      // 3. Medical Drain
      if (maxMed.net >= 100) {
          actions.push(`[${formatDate(maxMed.start)} - ${formatDate(maxMed.end)}] Severe Medical Drain (${maxMed.net} net medicals withdrawn in worst 24h window).`);
          if (severity !== 'high') severity = 'high';
      } else if (maxMed.net >= 50) {
          actions.push(`[${formatDate(maxMed.start)} - ${formatDate(maxMed.end)}] High Medical Usage (${maxMed.net} net medicals withdrawn in worst 24h window).`);
          if (severity === 'low') severity = 'medium';
      }

      // 4. General High-Value Hoarding (Weapons / Armor / Temps) over 48h
      const consumableKeywords = [...CATEGORIZED_ITEMS.drugs, ...CATEGORIZED_ITEMS.boosters, ...CATEGORIZED_ITEMS.medical];

      Object.entries(totalNetItems).forEach(([item, net]) => {
         const isConsumable = consumableKeywords.some(c => item.includes(c));

         // If they hold 2 or more of a non-consumable, flag it.
         if (net >= 2 && !isConsumable) {
             actions.push(`Asset Hoarding: Holding ${net}x ${item} without returning (last 48h).`);
             if (severity === 'low') severity = 'medium';
         }

         // Special case for expensive items
         if (net >= 1 && CATEGORIZED_ITEMS.highValue.some(e => item.includes(e))) {
             actions.push(`High-Value Asset Checked Out: Holding 1x ${item}. Monitor for safe return.`);
         }
      });

      if (actions.length > 0) {
         results.push({ playerName, playerId: data.id, suspiciousActions: actions, severity });
      }
   });

   return results.sort((a, b) => {
       if (a.severity === 'high' && b.severity !== 'high') return -1;
       if (b.severity === 'high' && a.severity !== 'high') return 1;
       if (a.severity === 'medium' && b.severity === 'low') return -1;
       if (b.severity === 'medium' && a.severity === 'low') return 1;
       return 0;
   });
};

export default function ArmoryLog() {
  const [rawLogs, setRawLogs] = useState<ArmoryNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [itemFilter, setItemFilter] = useState('all');

  // View Mode
  const [auditMode, setAuditMode] = useState(false);

  const { showToast } = useToast();
  const observerTarget = useRef<HTMLDivElement>(null);
  const fetchLock = useRef(false);

  const fetchArmoryNews = async (isLoadMore = false) => {
    if (fetchLock.current) return;
    fetchLock.current = true;

    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let url = '/api/faction/armory';
      if (isLoadMore && rawLogs.length > 0) {
          const oldestTimestamp = rawLogs[rawLogs.length - 1].timestamp;
          url += `?to=${oldestTimestamp}`;
      }

      const response = await api.get(url);
      const newLogs = response.data;

      if (newLogs.length === 0 || (isLoadMore && newLogs.length < 100 && newLogs.length === 0)) {
          setHasMore(false);
      }

      if (isLoadMore) {
          setRawLogs(prev => {
              const existingIds = new Set(prev.map(l => l.id));
              const uniqueNewLogs = newLogs.filter((l: ArmoryNews) => !existingIds.has(l.id));
              return [...prev, ...uniqueNewLogs];
          });
      } else {
          setRawLogs(newLogs);
          setHasMore(newLogs.length > 0);
      }
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load armory news', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setTimeout(() => {
          fetchLock.current = false;
      }, 800); // 800ms cooldown
    }
  };

  useEffect(() => {
    fetchArmoryNews(false);
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !auditMode) {
          fetchArmoryNews(true);
        }
      },
      { threshold: 1.0, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, rawLogs, auditMode]);

  // Automatic 48h Fetch for Audit Mode
  useEffect(() => {
     if (auditMode && rawLogs.length > 0 && hasMore && !loading && !loadingMore) {
        const newestTs = rawLogs[0].timestamp;
        const oldestTs = rawLogs[rawLogs.length - 1].timestamp;
        const TWO_DAYS = 48 * 60 * 60;

        if (newestTs - oldestTs < TWO_DAYS) {
           const timeoutId = setTimeout(() => {
               fetchArmoryNews(true);
           }, 800); // 800ms cooldown between auto-fetches to prevent Torn API rate limits

           return () => clearTimeout(timeoutId);
        }
     }
  }, [auditMode, rawLogs, hasMore, loading, loadingMore]);

  const parsedLogs = useMemo(() => {
    const parsed = rawLogs.map(parseLog);
    if (parsed.length > 0) {
        console.log('DEBUG: Sample Parsed Log:', parsed[0]);
    }
    return parsed;
  }, [rawLogs]);
  const auditResults = useMemo(() => runAudit(parsedLogs), [parsedLogs]);

  const filteredLogs = useMemo(() => {
    return parsedLogs.filter(log => {
      const matchesSearch = log.plainText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      let matchesItem = true;
      const itemNameLower = log.itemName.toLowerCase();
      if (itemFilter === 'medical') matchesItem = ['blood bag', 'first aid', 'morphine', 'neumune'].some(m => itemNameLower.includes(m));
      else if (itemFilter === 'drugs') matchesItem = ['xanax', 'vicodin', 'lsd', 'ketamine', 'ecstasy'].some(d => itemNameLower.includes(d));
      else if (itemFilter === 'boosters') matchesItem = ['energy drink', 'can of', 'bottle of', 'candy'].some(b => itemNameLower.includes(b));
      else if (itemFilter !== 'all') matchesItem = itemNameLower.includes(itemFilter);

      return matchesSearch && matchesAction && matchesItem;
    });
  }, [parsedLogs, searchTerm, actionFilter, itemFilter]);

  const getActionIcon = (action: string) => {
    if (action === 'deposit') return <ArrowDownToLine className="w-4 h-4 text-green-500" />;
    if (action === 'withdraw') return <ArrowUpFromLine className="w-4 h-4 text-orange-500" />;
    return <Shield className="w-4 h-4 text-muted-foreground" />;
  };

  const handleDownloadExcel = () => {
    if (auditMode) {
      const exportData = auditResults.map(r => ({
        PlayerName: r.playerName,
        PlayerID: r.playerId,
        Severity: r.severity.toUpperCase(),
        SuspiciousActions: r.suspiciousActions.join('; ')
      }));
      exportExcel(exportData, 'Vault_Audit_Report');
    } else {
      const exportData = filteredLogs.map(log => ({
        Date: new Date(log.timestamp * 1000).toLocaleString('en-US'),
        Player: log.playerName,
        PlayerID: log.playerId,
        Action: log.action.toUpperCase(),
        Quantity: log.quantity,
        Item: log.itemName,
        RawLog: log.plainText
      }));
      exportExcel(exportData, 'Armory_Log_Export');
    }
    showToast('Excel downloaded successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
             <button
                onClick={() => setAuditMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!auditMode ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
             >
                Standard Log
             </button>
             <button
                onClick={() => setAuditMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${auditMode ? 'bg-destructive text-destructive-foreground shadow-sm' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'}`}
             >
                <AlertTriangle className="w-4 h-4" />
                Vault Audit
             </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchArmoryNews(false)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
                onClick={handleDownloadExcel}
                className="text-sm flex items-center justify-center gap-2 text-blue-500 hover:text-blue-400 font-bold transition-colors bg-blue-500/10 px-4 py-2 rounded-lg"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {!auditMode && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Actions</option>
                <option value="withdraw">Withdrawals</option>
                <option value="deposit">Deposits</option>
              </select>

              <select
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Items</option>
                <option value="drugs">Drugs (Xanax, etc.)</option>
                <option value="medical">Medical</option>
                <option value="boosters">Boosters</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        {loading && rawLogs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse text-sm font-medium flex flex-col items-center gap-3">
            <Shield className="w-8 h-8 text-muted-foreground/50" />
            Fetching armory intelligence...
          </div>
        ) : auditMode ? (
          <div className="flex flex-col">
             <div className="bg-primary/5 border-b border-primary/10 p-4 sm:p-5 flex gap-3 sm:items-start text-sm">
                 <div className="mt-0.5">
                     <AlertCircle className="w-5 h-5 text-primary" />
                 </div>
                 <div className="flex flex-col gap-2">
                     <h4 className="font-bold text-foreground">Vault Audit Intelligence</h4>
                     <p className="text-muted-foreground leading-relaxed">
                         The audit engine utilizes a <strong>rolling 24-hour window</strong> analysis to detect Torn TOS abuse, item hoarding, and faction theft. It specifically monitors:
                     </p>
                     <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-1">
                         <li><strong>Consumables Abuse:</strong> High withdrawal rates of Xanax (approaching overdose limits of 3-4/day), Boosters (5+/day), or severe Medical item drain (50-100+/day).</li>
                         <li><strong>Asset Hoarding:</strong> Taking multiple non-consumable weapons or armor items without returning them.</li>
                         <li><strong>High-Value Tracking:</strong> Flags the checkout of expensive equipment (e.g., Armalite, Hazmat, Cesium, Riot) to ensure safe return.</li>
                     </ul>
                 </div>
             </div>
             <div className="overflow-x-auto">
             {auditResults.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm font-medium flex flex-col items-center gap-3">
                   <Shield className="w-8 h-8 text-primary/50" />
                   No suspicious activity detected in the current logs.
                </div>
             ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Operative</th>
                      <th className="py-3 px-4 font-semibold">Severity</th>
                      <th className="py-3 px-4 font-semibold">Audit Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {auditResults.map((result, idx) => (
                        <tr key={idx} className="hover:bg-accent/50 transition-colors group">
                           <td className="py-4 px-4">
                              <a
                                href={result.playerId ? `https://www.torn.com/profiles.php?XID=${result.playerId}` : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-card-foreground hover:text-primary flex items-center gap-1 transition-colors"
                              >
                                {result.playerName}
                                {result.playerId && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                              </a>
                           </td>
                           <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                 result.severity === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              }`}>
                                 {result.severity === 'high' ? <AlertTriangle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                                 {result.severity}
                              </span>
                           </td>
                           <td className="py-4 px-4 text-sm text-muted-foreground">
                              <ul className="list-disc list-inside space-y-1">
                                 {result.suspiciousActions.map((action, i) => (
                                    <li key={i}>{action}</li>
                                 ))}
                              </ul>
                           </td>
                        </tr>
                     ))}
                  </tbody>
                </table>
             )}
          </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 font-semibold w-48">Date & Time</th>
                  <th className="py-3 px-4 font-semibold w-32">Operative</th>
                  <th className="py-3 px-4 font-semibold w-24 text-center">Action</th>
                  <th className="py-3 px-4 font-semibold">Item Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent/50 transition-colors group">
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp * 1000).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-card-foreground">
                         <a
                            href={log.playerId ? `https://www.torn.com/profiles.php?XID=${log.playerId}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary flex items-center gap-1 transition-colors"
                         >
                            {log.playerName}
                            {log.playerId && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                         </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                         <span className="inline-flex p-1.5 rounded-md bg-background border border-border group-hover:border-primary/30 transition-colors" title={log.action.toUpperCase()}>
                           {getActionIcon(log.action)}
                         </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-card-foreground">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{log.quantity}x</span>
                           <span className="font-semibold">{log.itemName}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground text-sm italic">
                      No armory logs match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!auditMode && (
        <div ref={observerTarget} className="py-6 flex justify-center">
           {loadingMore && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium animate-pulse">
                   <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                   Decrypting older records...
               </div>
           )}
           {!hasMore && rawLogs.length > 0 && !loading && (
               <span className="text-xs text-muted-foreground/50 font-mono uppercase tracking-widest">End of Intelligence Feed</span>
           )}
        </div>
      )}
    </div>
  );
}
