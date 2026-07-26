import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

describe('Member Activity Service', () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 12345, name: 'TestUser', apiKey: 'test-key', factionId: 6789 }, JWT_SECRET);
  });

  it('should fetch and format member activity statuses', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        members: {
            "1": { name: "Member 1", last_action: { status: "Online" }, position: "Member", level: 10, status: { state: "Okay", description: "Safe" } },
            "2": { name: "Member 2", last_action: { status: "Offline" }, position: "Member", level: 20, status: { state: "Okay", description: "Safe" } },
            "3": { name: "Member 3", last_action: { status: "Idle" }, position: "Member", level: 30, status: { state: "Okay", description: "Safe" } }
        }
      }
    });

    const response = await request(app)
      .get('/api/faction/roster')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: 'Member 1', status: 'Online', rank: 'Member', level: 10, state: 'Okay', stateDescription: 'Safe' },
      { id: "2", name: 'Member 2', status: 'Offline', rank: 'Member', level: 20, state: 'Okay', stateDescription: 'Safe' },
      { id: "3", name: 'Member 3', status: 'Idle', rank: 'Member', level: 30, state: 'Okay', stateDescription: 'Safe' }
    ]);
  });
});
