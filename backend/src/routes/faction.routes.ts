import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TornApiService } from '../services/tornApi.service';

const router = Router();

router.get('/pulse', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const data = await tornApi.getFactionBasic();

        const name = data.name || data.faction?.name || data.basic?.name || 'Unknown Faction';
        const respect = data.respect || data.faction?.respect || data.basic?.respect || 0;
        const membersData = data.members || data.faction?.members || data.basic?.members || [];

        res.json({
            name,
            respect,
            memberCount: Array.isArray(membersData) ? membersData.length : Object.keys(membersData).length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/roster', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const data = await tornApi.getFactionBasic();
        const membersData = data.members || data.faction?.members || data.basic?.members || [];

        let roster = [];
        if (Array.isArray(membersData)) {
            roster = membersData.map((member: any) => ({
                id: String(member.id),
                name: member.name || 'Unknown Agent',
                rank: member.position || 'Member',
                level: member.level || 0,
                status: member.last_action?.status || 'Unknown',
                state: member.status?.state || 'Okay',
                stateDescription: member.status?.description || 'No detailed intel available',
            }));
        } else {
            roster = Object.entries(membersData).map(([id, member]: [string, any]) => ({
                id,
                name: member.name || 'Unknown Agent',
                rank: member.position || 'Member',
                level: member.level || 0,
                status: member.last_action?.status || 'Unknown',
                state: member.status?.state || 'Okay',
                stateDescription: member.status?.description || 'No detailed intel available',
            }));
        }

        res.json(roster);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/armory', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    const { to } = req.query;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const data = await tornApi.getFactionArmoryNews(undefined, to ? Number(to) : undefined);
        const news = data.armorynews || {};

        const sortedNews = Object.entries(news)
            .map(([id, item]: [string, any]) => ({
                id,
                timestamp: item.timestamp,
                news: item.news,
            }))
            .sort((a, b) => b.timestamp - a.timestamp);

        res.json(sortedNews);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/logs', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    const { to } = req.query;

    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const data = await tornApi.getFactionUnifiedLogs(to ? Number(to) : undefined);

        const unifiedLogs: any[] = [];

        const processNews = (newsObj: any, type: string) => {
            if (!newsObj) return;
            Object.entries(newsObj).forEach(([id, item]: [string, any]) => {
                unifiedLogs.push({
                    id,
                    type,
                    timestamp: item.timestamp,
                    news: item.news,
                });
            });
        };

        processNews(data.armorynews, 'armory');
        processNews(data.crimenews, 'crime');
        processNews(data.fundsnews, 'funds');
        processNews(data.mainnews, 'main');
        processNews(data.membershipnews, 'membership');

        unifiedLogs.sort((a, b) => b.timestamp - a.timestamp);

        const slicedLogs = unifiedLogs.slice(0, 250);

        res.json(slicedLogs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/crimes', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;

    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const data = await tornApi.getFactionCrimes();

        const crimes = data.crimes || data.faction?.crimes || {};
        const members = data.members || data.faction?.members || data.basic?.members || {};

        res.json({ crimes, members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const fetchProgress: Record<string, number> = {};

router.get('/ranked-war/:id/progress', authMiddleware, (req: AuthRequest, res: Response) => {
    const id = req.params.id as string;
    if (!id) return res.status(400).json({ count: 0 });
    res.json({ count: fetchProgress[id] || 0 });
});

router.get('/ranked-war/:id', authMiddleware, async (req: AuthRequest, res: Response) => {

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const apiKey = req.user?.apiKey;
    const { id } = req.params;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });
    if (!id) return res.status(400).json({ error: 'ID is required' });

    try {
      const tornApi = new TornApiService(apiKey);
      const report = await tornApi.getTornRankedWarReport(id);

      const rawData = report.rankedwarreport || report;
      if (!rawData || !rawData.factions) {
          return res.status(404).json({ error: 'Ranked war report not found' });
      }

      const startTime = rawData.war.start;
      const endTime = rawData.war.end || Math.floor(Date.now() / 1000);

      const factionIds = Object.keys(rawData.factions);
      if (factionIds.length === 0) return res.status(404).json({ error: 'Factions data missing' });

      const basicFaction = await tornApi.getFactionBasic();
      const myRealFactionId = basicFaction?.ID?.toString() || basicFaction?.basic?.id?.toString() || '';

      if (myRealFactionId && !factionIds.includes(myRealFactionId)) {
          return res.status(403).json({ error: 'Your faction did not participate in this Ranked War.' });
      }

      let myFactionId: string = myRealFactionId || factionIds[0] || '';
      if (!factionIds.includes(myFactionId)) myFactionId = factionIds[0] || '';

      const opponentFactionId: string = factionIds.find(f => f !== myFactionId) || '';

      const clonedReport = JSON.parse(JSON.stringify(report));
      const safeRawData = clonedReport.rankedwarreport || clonedReport;

      fetchProgress[id] = 0;

      const onProgress = (count: number) => {
          fetchProgress[id] = count;
      };

      const attacksData = await tornApi.getAllFactionAttacks(startTime - 5, endTime + 5, onProgress);
      const allAttacks = attacksData.attacks || {};
      const attacksKeys = Object.keys(allAttacks);

      delete fetchProgress[id];

      (clonedReport as any)._debug_info = {
          startTime,
          endTime,
          attacksFetched: attacksKeys.length,
          myFactionId,
          opponentFactionId
      };

      const memberStats: Record<string, any> = {};
      const factionData = safeRawData.factions[myFactionId];
      if (!factionData) return res.status(404).json({ error: 'Our faction data missing' });
      const factionMembers = factionData.members || {};

      Object.keys(factionMembers).forEach(mId => {
          memberStats[mId] = {
              tHits: 0, nw_hits_chain: 0, nw_hits_all: 0,
              war_assists: 0, nw_assists: 0,
              war_hosp: 0, nw_hosp: 0,
              war_stealth: 0, nw_stealth: 0,
              war_mugs: 0, nw_mugs: 0,
              war_lost: 0, nw_lost: 0,
              war_respect_base: 0, war_respect_bonus: 0,
              nw_respect_base: 0, nw_respect_bonus: 0
          };
      });

      const uniqueLogs = new Set();

      const fStats = {
          war_assists: 0, nw_assists: 0,
          war_hosp: 0, nw_hosp: 0,
          war_mugs: 0, nw_mugs: 0,
          war_stealth: 0, nw_stealth: 0,
          war_lost: 0, nw_lost: 0,
          nw_hits_chain: 0, nw_hits_all: 0,
          war_respect_base: 0, war_respect_bonus: 0,
          nw_respect_base: 0, nw_respect_bonus: 0
      };

const milestoneChainSet = new Set([10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000]);

      Object.values(allAttacks).forEach((att: any) => {
          if (!att.code || uniqueLogs.has(att.code)) return;
          uniqueLogs.add(att.code);

          const attackerId: string = att.attacker?.id?.toString() || '';
          const attackerFactionId: number = Number(att.attacker?.faction?.id || 0);
          const defenderFactionId: number = Number(att.defender?.faction?.id || 0);
          const result: string = att.result || '';
          const isStealthed: boolean = att.is_stealthed === true;
          const isRankedWar: boolean = att.is_ranked_war === true;
          const warModifier: number = Number(att.modifiers?.war || 1);

          const chainObj = att.chain;
          const chain: number = Number(typeof chainObj === 'object' ? chainObj?.count : chainObj) || 0;

          const respectGain: number = Number(att.respect_gain || 0);
          const isBonusHit: boolean = milestoneChainSet.has(chain);

          const isOurHit = (attackerFactionId === Number(myFactionId)) ||
                           (attackerFactionId === 0 && defenderFactionId !== Number(myFactionId));

          if (!isOurHit) return;

          const V: boolean = att.started >= (startTime - 5) && att.started <= (endTime + 5);
          const L: boolean = att.ended >= (startTime - 5) && att.ended <= (endTime + 5);
          const E: boolean = att.started <= (startTime - 5) && att.ended >= (endTime + 5);
          if (!V && !L && !E) return;

          const creditedId = attackerId || '0';

          if (!memberStats[creditedId]) {
              memberStats[creditedId] = {
                  tHits: 0, nw_hits_chain: 0, nw_hits_all: 0,
                  war_assists: 0, nw_assists: 0,
                  war_hosp: 0, nw_hosp: 0,
                  war_stealth: 0, nw_stealth: 0,
                  war_mugs: 0, nw_mugs: 0,
                  war_lost: 0, nw_lost: 0,
                  war_respect_base: 0, war_respect_bonus: 0,
                  nw_respect_base: 0, nw_respect_bonus: 0
              };
              if (!safeRawData.factions[myFactionId].members[creditedId]) {
                  safeRawData.factions[myFactionId].members[creditedId] = {
                      name: att.attacker?.name || (creditedId === '0' ? 'Anonymous' : `ID: ${creditedId}`),
                      attacks: 0, score: 0, level: att.attacker?.level || 0
                  };
              }
          }

          const ds = memberStats[creditedId];
          const resLower = result.toLowerCase();

          const isFinishingResult = resLower.includes('attacked') || resLower.includes('hosp') || resLower.includes('mug') || resLower.includes('arrested');

          const isHighValueArrest = resLower.includes('arrested') && respectGain > 4;

          if (isRankedWar) {
              if (isFinishingResult) ds.tHits++;
          } else {
              if (isFinishingResult) {
                  ds.nw_hits_all++;
                  if (chain > 0) {
                      ds.nw_hits_chain++;
                      fStats.nw_hits_chain++;
                  }
              }
          }

          const isValidMetricHit = isRankedWar || (chain > 0);
          const isActuallyStealthed = isStealthed || resLower.includes('stealth') || creditedId === '0' || isHighValueArrest;

          if (isValidMetricHit) {
              if (resLower.includes('assist')) {
                  if (isRankedWar) { ds.war_assists++; fStats.war_assists++; }
                  else { ds.nw_assists++; fStats.nw_assists++; }
              }

              if (resLower.includes('hosp')) {
                  if (isRankedWar) { ds.war_hosp++; fStats.war_hosp++; }
                  else { ds.nw_hosp++; fStats.nw_hosp++; }
              }

              if (isActuallyStealthed) {
                  if (isRankedWar) { ds.war_stealth++; fStats.war_stealth++; }
                  else { ds.nw_stealth++; fStats.nw_stealth++; }
              }

              if (resLower.includes('mug') || isHighValueArrest) {
                  if (isRankedWar) { ds.war_mugs++; fStats.war_mugs++; }
                  else { ds.nw_mugs++; fStats.nw_mugs++; }
              }

              if (resLower.includes('lost') || resLower.includes('lose')) {
                  if (isRankedWar) { ds.war_lost++; fStats.war_lost++; }
                  else { ds.nw_lost++; fStats.nw_lost++; }
              }
          }

          if (isRankedWar) {
              if (isBonusHit) ds.war_respect_bonus += respectGain;
              else { ds.war_respect_base += respectGain; fStats.war_respect_base += respectGain; }
          } else {
              if (isBonusHit) ds.nw_respect_bonus += respectGain;
              else { ds.nw_respect_base += respectGain; fStats.nw_respect_base += respectGain; }
          }
      });

      let factionTotalWarHits = 0;
      Object.keys(memberStats).forEach(mId => {
          if (mId === '0') return;

          const ds = memberStats[mId];
          let m = safeRawData.factions[myFactionId].members[mId];

          if (!m && (ds.nw_hits_all > 0 || ds.nw_hits_chain > 0 || ds.tHits > 0)) {
              m = {
                  name: ds.name || `Member ${mId}`,
                  level: 0,
                  attacks: 0,
                  score: 0,
                  respect: 0
              };
          }

          if (m) {

              const officialWarAttacks = Number(m.attacks || 0);
              factionTotalWarHits += officialWarAttacks;

              safeRawData.factions[myFactionId].members[mId] = {
                  ...m,
                  war_attacks: officialWarAttacks,
                  total_attacks: officialWarAttacks + ds.nw_hits_chain,
                  nw_hits_all: ds.nw_hits_all,
                  nw_hits_chain: ds.nw_hits_chain,
                  war_assists: ds.war_assists,
                  nw_assists: ds.nw_assists,
                  war_hosp: ds.war_hosp,
                  nw_hosp: ds.nw_hosp,
                  war_stealth: ds.war_stealth,
                  nw_stealth: ds.nw_stealth,
                  war_mugs: ds.war_mugs,
                  nw_mugs: ds.nw_mugs,
                  war_lost: ds.war_lost,
                  nw_lost: ds.nw_lost,
                  war_respect_base: ds.war_respect_base,
                  war_respect_bonus: ds.war_respect_bonus,
                  nw_respect_base: ds.nw_respect_base,
                  nw_respect_bonus: ds.nw_respect_bonus,
                  respect: m.score || m.respect || 0
              };
          }
      });

      (clonedReport as any).faction_stats = {
          war_hits: factionTotalWarHits,
          war_assists: fStats.war_assists,
          war_hosp: fStats.war_hosp + fStats.nw_hosp,
          war_stealth: fStats.war_stealth + fStats.nw_stealth,
          war_mugs: fStats.war_mugs + fStats.nw_mugs,
          war_lost: fStats.war_lost,
          war_respect_base: Math.round(fStats.war_respect_base),
          nw_hits_chain: Object.values(memberStats).reduce((acc: number, curr: any) => acc + curr.nw_hits_chain, 0)
      };

      if (opponentFactionId && safeRawData.factions[opponentFactionId]) {
          safeRawData.factions[opponentFactionId].members = {};
      }

      (clonedReport as any).my_faction_id = myFactionId;
      (clonedReport as any).opponent_faction_id = opponentFactionId;

      const itemPrices = await tornApi.getItemPrices();
      (clonedReport as any).item_prices = itemPrices;

      res.json(clonedReport);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
});

router.post('/payout', authMiddleware, async (req: AuthRequest, res: Response) => {
    res.json({ success: true });
});

export default router;
