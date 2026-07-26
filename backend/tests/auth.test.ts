import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login with valid API key and set HTTP-only cookie', async () => {

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        player_id: 12345,
        name: 'TestUser',
        rank: 'Legendary',
        faction: { faction_name: 'Test Faction', faction_id: 6789 }
      }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ apiKey: 'valid-api-key' });

    expect(response.status).toBe(200);

    expect(response.body).not.toHaveProperty('token');
    expect(response.body.user).toMatchObject({
      id: 12345,
      name: 'TestUser'
    });

    const cookies = response.headers['set-cookie'] as any;
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.*?;/);
    expect(cookies[0]).toMatch(/HttpOnly/);
    });

  it('should return 401 for invalid API key', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { error: { code: 2, error: 'Incorrect key' } }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ apiKey: 'invalid-api-key' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Incorrect key');
  });

  it('should logout and clear the HTTP-only cookie', async () => {
    const response = await request(app)
      .post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');

    const cookies = response.headers['set-cookie'] as any;
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=;/);
    expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
  });

  it('should access protected route with valid cookie', async () => {
     const token = jwt.sign({ id: 12345, name: 'TestUser', apiKey: 'test-key', factionId: 6789 }, process.env.JWT_SECRET || 'your-default-secret');

     const response = await request(app)
       .get('/api/user/me')
       .set('Cookie', [`token=${token}`]);

     expect(response.status).toBe(200);
     expect(response.body.id).toBe(12345);
  });

  it('should return 401 for protected route without cookie', async () => {
    const response = await request(app).get('/api/user/me');
    expect(response.status).toBe(401);
  });
});
