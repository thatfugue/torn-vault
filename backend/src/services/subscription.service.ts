import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'subscriptions.json');

interface Subscription {
    userId: string;
    userName: string;
    expiresAt: number;
    plan: 'premium';
}

export class SubscriptionService {
    private static init() {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({}));
    }

    private static getAll(): Record<string, Subscription> {
        this.init();
        try {
            const data = fs.readFileSync(DATA_PATH, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    }

    private static save(subs: Record<string, Subscription>) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(subs, null, 2));
    }

    static getStatus(userId: string): { active: boolean; daysLeft: number; expiresAt: number } {
        const subs = this.getAll();
        const sub = subs[userId];

        if (!sub) return { active: false, daysLeft: 0, expiresAt: 0 };

        const now = Math.floor(Date.now() / 1000);
        const diff = sub.expiresAt - now;

        return {
            active: diff > 0,
            daysLeft: Math.max(0, Math.ceil(diff / (24 * 60 * 60))),
            expiresAt: sub.expiresAt
        };
    }

    static addAccess(userId: string, userName: string, days: number) {
        const subs = this.getAll();
        const now = Math.floor(Date.now() / 1000);
        const currentExpiry = subs[userId]?.expiresAt || now;

        const newExpiry = (currentExpiry > now ? currentExpiry : now) + (days * 24 * 60 * 60);

        subs[userId] = {
            userId,
            userName,
            expiresAt: newExpiry,
            plan: 'premium'
        };

        this.save(subs);
        return this.getStatus(userId);
    }

    static removeAccess(userId: string) {
        const subs = this.getAll();
        delete subs[userId];
        this.save(subs);
    }

    static listAll() {
        return Object.values(this.getAll());
    }
}
