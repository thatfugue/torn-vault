import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

describe('Attack Log Service', () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 12345, name: 'TestUser', apiKey: 'test-key', factionId: 6789 }, JWT_SECRET);
  });

  it('should fetch attack logs for a timeframe', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        attacks: {
            "101": { attacker_id: 1, defender_id: 2, respect_gain: 1.5, result: 'Attacked' },
            "102": { attacker_id: 1, defender_id: 3, respect_gain: 2.0, result: 'Attacked' }
        }
      }
    });

    const response = await request(app)
      .get('/api/faction/attacks?from=1712534400&to=1712620800')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
        "101": { attacker_id: 1, defender_id: 2, respect_gain: 1.5, result: 'Attacked' },
        "102": { attacker_id: 1, defender_id: 3, respect_gain: 2.0, result: 'Attacked' }
    });
  });
});
