import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TornApiService } from '../services/tornApi.service';

const router = Router();

const logError = (context: string, error: any) => {
    console.error(`ANALYTICS ERROR [${context}]:`, error.message);
};

router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);

        const [factionData, logs, crimeData, chainsData, chainDataLive] = await Promise.all([
            tornApi.getFactionBasic().catch(e => { logError('Overview Basic', e); return {}; }),
            tornApi.getFactionUnifiedLogs().catch(e => { logError('Overview Logs', e); return {}; }),
            tornApi.getFactionCrimes().catch(e => { logError('Overview Crimes', e); return {}; }),
            tornApi.getFactionChains().catch(() => ({})),
            tornApi.getFactionChain().catch(() => ({}))
        ]);

        const membersData = factionData?.members || factionData?.faction?.members || factionData?.basic?.members || {};
        const memberList = Array.isArray(membersData) ? membersData : Object.entries(membersData).map(([id, m]: [string, any]) => ({ ...m, id }));

        const crimes = crimeData?.crimes || crimeData?.faction?.crimes || [];
        const memberCrimeMap: Record<string, { count: number, roles: string[] }> = {};

        if (Array.isArray(crimes)) {
            crimes.forEach((c: any) => {
                if (c.slots && Array.isArray(c.slots)) {
                    c.slots.forEach((slot: any) => {
                        if (slot.user) {
                            const uid = typeof slot.user === 'object' ? String(slot.user.id) : String(slot.user);
                            if (!memberCrimeMap[uid]) memberCrimeMap[uid] = { count: 0, roles: [] };
                            memberCrimeMap[uid].count++;
                            if (slot.position) memberCrimeMap[uid].roles.push(slot.position);
                        }
                    });
                }
            });
        }

        const unifiedLogs: any[] = [];
        const processNews = (obj: any) => obj && typeof obj === 'object' && Object.values(obj).forEach((l: any) => l?.news && unifiedLogs.push(l));
        if (logs) {
            processNews(logs.armorynews);
            processNews(logs.crimenews);
            processNews(logs.fundsnews);
            processNews(logs.membershipnews);
        }

        const fundsLogs = logs?.fundsnews ? Object.values(logs.fundsnews) : [];
        let totalDeposited = 0;
        let totalWithdrawn = 0;

        fundsLogs.forEach((l: any) => {
            const moneyMatch = l.news.match(/\$([\d,]+)/);
            if (moneyMatch) {
                const amount = parseInt(moneyMatch[1].replace(/,/g, ''));
                if (l.news.toLowerCase().includes('deposited')) totalDeposited += amount;
                if (l.news.toLowerCase().includes('withdrew')) totalWithdrawn += amount;
            }
        });

        const healthScores = memberList.map((m: any) => {
            if (!m) return null;
            const name = m.name || 'Unknown';
            const id = String(m.id || m.userid || '');
            let score = 40;
            const reasons: string[] = ["Base threshold (40)"];
            const logsCount = unifiedLogs.filter((l: any) => l.news && (l.news.includes(name) || (id && l.news.includes(id)))).length;
            const logPoints = Math.min(logsCount, 20);
            score += logPoints;
            if (logPoints > 0) reasons.push(`Activity (+${logPoints})`);
            const ocData = memberCrimeMap[id];
            if (ocData) { score += 20; reasons.push("Active OC Task (+20)"); }
            const status = m.last_action?.status || 'Offline';
            if (status === 'Online') { score += 20; reasons.push("Online (+20)"); }
            else if (status === 'Idle') { score += 10; reasons.push("Idle (+10)"); }
            if (m.status?.state === 'Hospital') { score -= 15; reasons.push("In Hospital (-15)"); }
            return { id, name, score: Math.min(Math.max(score, 0), 100), reasons, state: m.status?.state || 'Okay', lastStatus: status };
        }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);

        const memberMap: Record<number, string> = {};
        memberList.forEach((m: any) => { if (m.id) memberMap[Number(m.id)] = m.name || 'Unknown'; });

        const warStats: Record<number, any> = {};
        let reportMembers: any = {};

        const factionId = factionData?.basic?.id || factionData?.faction?.id;
        const rankedWars = factionData?.basic?.ranked_wars || factionData?.faction?.ranked_wars || {};
        const rankedWarIds = Object.keys(rankedWars);

        if (rankedWarIds.length > 0) {

            const warId = rankedWarIds[0] as string;
            const warReport = await tornApi.getTornRankedWarReport(warId).catch(() => ({}));
            const warFactions = warReport?.rankedwarreport?.factions || {};
            if (factionId && warFactions[String(factionId)]) {
                reportMembers = warFactions[String(factionId)].members || {};
            } else if (Object.keys(warFactions).length > 0) {
                const firstKey = Object.keys(warFactions)[0] as string;
                reportMembers = warFactions[firstKey].members || {};
            }
        } else {

            const chains = chainsData?.chains || {};
            const chainIds = Object.keys(chains).sort((a, b) => Number(b) - Number(a));
            if (chainIds.length > 0) {
                const latestChainId = chainIds[0] as string;
                const chainReport = await tornApi.getTornChainReport(latestChainId).catch(() => ({}));
                reportMembers = chainReport?.chainreport?.members || {};
            }
        }

        Object.keys(reportMembers).forEach(memberId => {
            const m = reportMembers[memberId];
            const uid = Number(memberId);
            if (memberMap[uid]) {
                warStats[uid] = {
                    name: memberMap[uid],
                    hits: m.attacks || 0,
                    respect: m.respect || 0,
                    finishingHits: (m.leave || 0) + (m.mug || 0) + (m.hosp || 0),
                    assists: m.assists || 0,
                    losses: m.losses || 0
                };
            }
        });

        const crimeLogs = logs?.crimenews ? Object.values(logs.crimenews) : [];
        const ocTrends: Record<string, any> = {};
        crimeLogs.forEach((log: any) => {
            if (!log?.news) return;
            const crimeMatch = log.news.match(/completed a ([\w\s]+)/i) || log.news.match(/failed to ([\w\s]+)/i);
            if (crimeMatch) {
                const name = crimeMatch[1].trim().replace(/^successfully\s+/i, '').replace(/operation\s*$/i, '').trim();
                if (!ocTrends[name]) ocTrends[name] = { total: 0, success: 0, fail: 0 };
                ocTrends[name].total++;
                if (log.news.toLowerCase().includes('success') || log.news.toLowerCase().includes('completed')) ocTrends[name].success++;
                else if (log.news.toLowerCase().includes('fail')) ocTrends[name].fail++;
            }
        });

        res.json({
            health: healthScores,
            war: Object.values(warStats).sort((a, b) => b.respect - a.respect),
            oc: ocTrends,
            chain: chainDataLive?.chain || null,
            finance: {
                deposited: totalDeposited,
                withdrawn: totalWithdrawn,
                net: totalDeposited - totalWithdrawn
            }
        });
    } catch (error: any) {
        logError('Overview Final', error);
        res.status(500).json({ error: 'Failed to process intelligence overview' });
    }
});

export default router;
