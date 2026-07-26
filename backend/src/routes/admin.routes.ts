import { Response, Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { SubscriptionService } from '../services/subscription.service';

const router = Router();

const adminOnly = (req: AuthRequest, res: Response, next: any) => {
    const isMasterId = String(req.user?.id) === '4141121';
    const isMasterName = req.user?.name === 'sercann';

    if (!isMasterId && !isMasterName) {
        return res.status(403).json({ error: 'Access Denied: Specialized Intelligence Clearance Required' });
    }
    next();
};

router.get('/subscriptions', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    const list = SubscriptionService.listAll();
    res.json(list);
});

router.post('/subscriptions/add', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    const { userId, userName, days } = req.body;
    if (!userId || !days) return res.status(400).json({ error: 'Missing userId or days' });

    const status = SubscriptionService.addAccess(String(userId), userName || 'Unknown', Number(days));
    res.json({ message: `Access granted for ${days} days`, status });
});

router.post('/subscriptions/remove', authMiddleware, adminOnly, (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    SubscriptionService.removeAccess(String(userId));
    res.json({ message: 'Access revoked' });
});

export default router;
