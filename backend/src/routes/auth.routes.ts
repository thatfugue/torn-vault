import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { TornApiService } from '../services/tornApi.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

router.post('/login', async (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const tornApi = new TornApiService(apiKey);
    const userData = await tornApi.getUserBasic();

    const id = userData.player_id || userData.profile?.id || userData.basic?.id || userData.id;
    const name = userData.name || userData.profile?.name || userData.basic?.name;
    const factionId = userData.faction?.faction_id || userData.profile?.faction?.id || userData.basic?.faction_id;

    if (!id || !name) {
        console.error('LOGIN FAILURE - Structural Mismatch. Keys found:', Object.keys(userData));
        if (userData.profile) console.error('Profile Keys:', Object.keys(userData.profile));
        console.error('Full Sample:', JSON.stringify(userData).substring(0, 500));
        throw new Error('Could not retrieve user identity from Torn API structure');
    }

    const user = {
      id,
      name,
      factionId,
      apiKey: apiKey,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user });
  } catch (error: any) {
    console.error('LOGIN ERROR - Full Details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
    });
    if (error.message === 'Incorrect key') {
      return res.status(401).json({ error: 'Incorrect key' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'none' : 'lax',
  });

  res.json({ message: 'Logged out successfully' });
});

export default router;
