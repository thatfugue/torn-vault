import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    factionId?: number;
    apiKey: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {

  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
