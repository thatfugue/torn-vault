import axios from 'axios';
import { TornApiService, cache } from '../src/services/tornApi.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TornApiService', () => {
  let tornApi: TornApiService;

  beforeEach(() => {
    tornApi = new TornApiService('test-api-key');
    jest.clearAllMocks();
    cache.flushAll();
  });

  it('should fetch faction basic data and cache it', async () => {
    const mockData = { faction: { name: 'Test Faction', respect: 1000 } };
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const data1 = await tornApi.getFactionBasic();
    expect(data1).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    const data2 = await tornApi.getFactionBasic();
    expect(data2).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if API key is invalid', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { error: { code: 2, error: 'Incorrect key' } } });

    await expect(tornApi.getFactionBasic()).rejects.toThrow('Incorrect key');
  });

  it('should handle axios errors', async () => {
    const axiosError = {
      response: {
        data: {
          error: {
            error: 'Rate limit exceeded'
          }
        }
      }
    };
    mockedAxios.get.mockRejectedValueOnce(axiosError);

    await expect(tornApi.getFactionBasic()).rejects.toThrow('Rate limit exceeded');
  });

  it('should handle generic errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(tornApi.getFactionBasic()).rejects.toThrow('Network Error');
  });
});
