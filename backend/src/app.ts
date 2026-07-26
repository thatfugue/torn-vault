import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import factionRoutes from './routes/faction.routes';
import analyticsRoutes from './routes/analytics.routes';
import armoryRoutes from './routes/armory.routes';
import adminRoutes from './routes/admin.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { subscriptionGuard } from './middleware/subscription.middleware';

dotenv.config();

const app = express();

app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {

        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/faction', authMiddleware, subscriptionGuard, factionRoutes);
app.use('/api/analytics', authMiddleware, subscriptionGuard, analyticsRoutes);
app.use('/api/armory', authMiddleware, subscriptionGuard, armoryRoutes);

export default app;
