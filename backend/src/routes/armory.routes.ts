import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { TornApiService } from '../services/tornApi.service';

const router = Router();

router.get('/audit', authMiddleware, async (req: AuthRequest, res: Response) => {
    const apiKey = req.user?.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'No API key in session' });

    try {
        const tornApi = new TornApiService(apiKey);
        const [armoryData, factionData] = await Promise.all([
            tornApi.getFactionArmory(),
            tornApi.getFactionBasic()
        ]);

        const inventory = armoryData.armory || [];
        const membersData = factionData?.members || factionData?.faction?.members || factionData?.basic?.members || {};

        const memberMap: Record<number, string> = {};
        if (Array.isArray(membersData)) {
            membersData.forEach((m: any) => memberMap[m.id] = m.name);
        } else {
            Object.entries(membersData).forEach(([id, m]: [string, any]) => memberMap[Number(id)] = m.name);
        }

        const loanedItems: any[] = [];

        inventory.forEach((item: any) => {
            if (item.loaned_to) {
                loanedItems.push({
                    id: item.ID,
                    name: item.name,
                    type: item.type,
                    holderId: item.loaned_to,
                    holderName: memberMap[item.loaned_to] || `Unknown [${item.loaned_to}]`,
                    quantity: item.quantity || 1
                });
            }
        });

        res.json({
            summary: {
                totalLoaned: loanedItems.length,
                uniqueHolders: new Set(loanedItems.map(i => i.holderId)).size
            },
            loanedItems: loanedItems.sort((a, b) => a.holderName.localeCompare(b.holderName))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
