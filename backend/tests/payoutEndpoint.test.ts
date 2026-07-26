import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

describe('Payout Calculation Endpoint', () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 12345, name: 'TestUser', apiKey: 'test-key', factionId: 6789 }, JWT_SECRET);
  });

  it('should calculate and return payouts', async () => {

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        attacks: {
            "101": { attacker_id: 1, respect_gain: 10, result: 'Attacked' },
            "102": { attacker_id: 2, respect_gain: 10, result: 'Attacked' }
        }
      }
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        members: {
            "1": { name: 'Member 1' },
            "2": { name: 'Member 2' }
        }
      }
    });

    const response = await request(app)
      .post('/api/faction/payout')
      .set('Authorization', `Bearer ${token}`)
      .send({ budget: 1000 });

    expect(response.status).toBe(200);
    expect(response.body).toContainEqual({ playerId: 1, playerName: 'Member 1', respect: 10, hits: 1, payout: 500, share: 50 });
    expect(response.body).toContainEqual({ playerId: 2, playerName: 'Member 2', respect: 10, hits: 1, payout: 500, share: 50 });
  });

  it('should return 400 if budget is missing', async () => {
    const response = await request(app)
      .post('/api/faction/payout')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Budget is required');
  });
});
