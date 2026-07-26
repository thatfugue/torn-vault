import request from 'supertest';
import app from '../src/app';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

describe('Faction Dashboard Services', () => {
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    token = jwt.sign({ id: 12345, name: 'TestUser', apiKey: 'test-key', factionId: 6789 }, JWT_SECRET);
  });

  it('should fetch faction pulse data (name, respect, member count)', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        name: 'Test Faction',
        respect: 50000,
        members: {
            "1": { name: "Member 1" },
            "2": { name: "Member 2" }
        }
      }
    });

    const response = await request(app)
      .get('/api/faction/pulse')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: 'Test Faction',
      respect: 50000,
      memberCount: 2
    });
  });

  it('should fetch faction armory news and sort by timestamp', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        armorynews: {
          "item1": { timestamp: 100, news: "Player took a Xanax" },
          "item2": { timestamp: 200, news: "Player returned a Rifle" }
        }
      }
    });

    const response = await request(app)
      .get('/api/faction/armory')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "item2", timestamp: 200, news: "Player returned a Rifle" },
      { id: "item1", timestamp: 100, news: "Player took a Xanax" }
    ]);
  });

  it('should fetch unified logs and merge different categories', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        armorynews: { "a1": { timestamp: 100, news: "Armory Log" } },
        crimenews: { "c1": { timestamp: 150, news: "Crime Log" } },
        fundsnews: {},
        mainnews: { "m1": { timestamp: 200, news: "Main Log" } },
        membershipnews: {}
      }
    });

    const response = await request(app)
      .get('/api/faction/logs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    expect(response.body[0].type).toBe('main');
    expect(response.body[1].type).toBe('crime');
    expect(response.body[2].type).toBe('armory');
  });

  it('should fetch faction crimes and members for OC Planner', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        crimes: [
          { id: 1, name: "Political Assassination", status: "Planning" }
        ],
        members: {
          "1": { name: "Agent X", status: { state: "Okay" } }
        }
      }
    });

    const response = await request(app)
      .get('/api/faction/crimes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.crimes).toBeDefined();
    expect(response.body.members).toBeDefined();
    expect(response.body.crimes[0].name).toBe("Political Assassination");
  });
});
