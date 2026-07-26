import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TornApiService } from '../services/tornApi.service';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const subStatus = SubscriptionService.getStatus(String(req.user?.id));
  res.json({ ...req.user, subscription: subStatus });
});

router.get('/me/intelligence', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    const userId = req.user?.id;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const [crimeData, chainsData, factionBasic] = await Promise.all([
            tornApi.getFactionCrimes().catch(() => ({})),
            tornApi.getFactionChains().catch(() => ({})),
            tornApi.getFactionBasic().catch(() => ({}))
        ]);

        const crimes = crimeData.crimes || crimeData.faction?.crimes || [];

        const myCrime = Array.isArray(crimes) ? crimes.find((c: any) =>
            c.slots?.some((slot: any) => {
                if (!slot.user) return false;
                const slotUserId = typeof slot.user === 'object' ? String(slot.user.id) : String(slot.user);
                return slotUserId === String(userId);
            })
        ) : null;

        let myStats = { hits: 0, respect: 0 };
        let reportMembers: any = {};

        const factionId = factionBasic?.basic?.id || factionBasic?.faction?.id;
        const rankedWars = factionBasic?.basic?.ranked_wars || factionBasic?.faction?.ranked_wars || {};
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

        if (reportMembers[String(userId)]) {
            myStats.hits = reportMembers[String(userId)].attacks || 0;
            myStats.respect = reportMembers[String(userId)].respect || 0;
        }

        res.json({
            oc: myCrime ? {
                name: myCrime.name,
                status: myCrime.status,
                ready_at: myCrime.ready_at
            } : null,
            war: myStats,
            factionName: factionBasic?.basic?.name || factionBasic?.faction?.name || 'Unknown Faction'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
