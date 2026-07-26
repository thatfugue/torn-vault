import axios from 'axios';
import NodeCache from 'node-cache';

export const cache = new NodeCache({ stdTTL: 60 });

export class TornApiService {
  private apiKey: string;
  private baseV1 = 'https://api.torn.com';
  private baseV2 = 'https://api.torn.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFactionBasic(): Promise<any> {
    try {
      return await this.fetchData('faction', 'basic,members', {}, 2);
    } catch (e) {
      return await this.fetchData('faction', 'basic,members', {}, 1);
    }
  }

  async getUserBasic(): Promise<any> {
    try {
      return await this.fetchData('user', 'basic', {}, 2);
    } catch (e) {
      return await this.fetchData('user', 'basic', {}, 1);
    }
  }

  async getFactionAttacks(from?: number, to?: number): Promise<any> {
    try {
      return await this.fetchData('faction', 'attacks', { from, to }, 2);
    } catch (e) {
      return await this.fetchData('faction', 'attacks', { from, to }, 1);
    }
  }

  async getAllFactionAttacks(from: number, to: number, onProgress?: (count: number) => void): Promise<any> {
    const cacheKey = `v300_all_attacks_${from}_${to}_${this.apiKey}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    let iterations = 0;
    const maxIterations = 1000;
    const uniqueLogs = new Map<string, any>();
    let currentFrom = from;
    let prevUniqueSize = -1;

    while (iterations < maxIterations) {
      try {
        const response = await axios.get(`${this.baseV2}/faction/attacks`, {
          params: { key: this.apiKey, from: currentFrom, to, sort: 'asc', limit: 100 }
        });

        if (response.data.error) {
            const errCode = response.data.error.code;

            if (errCode === 5 || errCode === 8 || response.data.error.error.toLowerCase().includes('many')) {
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }
            throw new Error(response.data.error.error || 'API error');
        }

        const attacksArray: any[] = response.data.attacks || [];
        if (attacksArray.length === 0) break;

        attacksArray.forEach((att: any) => {
            if (att.code) uniqueLogs.set(att.code, att);
        });

        if (onProgress) onProgress(uniqueLogs.size);

        if (attacksArray.length < 100) break;

        const lastAttack = attacksArray[attacksArray.length - 1];
        const newest: number = lastAttack.ended || lastAttack.started || currentFrom;

        if (uniqueLogs.size === prevUniqueSize) {
            currentFrom = newest + 1;
        } else {
            currentFrom = newest;
        }
        prevUniqueSize = uniqueLogs.size;

        if (currentFrom >= to) break;

        await new Promise(r => setTimeout(r, 750));
        iterations++;
      } catch (err: any) {
        if (err.response?.status === 429) {
            await new Promise(r => setTimeout(r, 10000));
            continue;
        }
        throw err;
      }
    }

    const finalResult = { attacks: Array.from(uniqueLogs.values()) };
    cache.set(cacheKey, finalResult, 600);
    return finalResult;
  }

  async getFactionArmory(): Promise<any> {
    return this.fetchData('faction', 'armory', {}, 1);
  }

  async getFactionChain(): Promise<any> {
    return this.fetchData('faction', 'chain', {}, 1);
  }

  async getFactionChainReport(): Promise<any> {
    return this.fetchData('faction', 'chainreport', {}, 1);
  }

  async getFactionChains(): Promise<any> {
    return this.fetchData('faction', 'chains', {}, 1);
  }

  async getTornChainReport(chainId: string | number): Promise<any> {
    const cacheKey = `v300_torn_chainreport_${chainId}_${this.apiKey}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const response = await axios.get(`${this.baseV1}/torn/${chainId}`, {
        params: { selections: 'chainreport', key: this.apiKey },
      });
      if (response.data.error) throw new Error(response.data.error.error);
      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) throw new Error(error.response.data.error.error);
      throw error;
    }
  }

  async getTornRankedWarReport(warId: string | number): Promise<any> {
    const cacheKey = `v300_torn_rankedwarreport_${warId}_${this.apiKey}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      try {
          const responseV2 = await axios.get(`${this.baseV2}/torn/rankedwarreport`, {
            params: { id: warId, key: this.apiKey },
          });
          if (!responseV2.data.error) {
              cache.set(cacheKey, responseV2.data);
              return responseV2.data;
          }
      } catch (v2Error) {}

      const response = await axios.get(`${this.baseV1}/torn/${warId}`, {
        params: { selections: 'rankedwarreport', key: this.apiKey },
      });
      if (response.data.error) throw new Error(response.data.error.error);
      cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) throw new Error(error.response.data.error.error);
      throw error;
    }
  }

  async getFactionArmoryNews(from?: number, to?: number): Promise<any> {
    return this.fetchData('faction', 'armorynews', { from, to }, 1);
  }

  async getFactionUnifiedLogs(to?: number): Promise<any> {
    const extraParams = to ? { to } : {};
    return this.fetchData('faction', 'armorynews,crimenews,fundsnews,mainnews,membershipnews', extraParams, 1);
  }

  async getFactionCrimes(): Promise<any> {
    try {
      return await this.fetchData('faction', 'crimes,members', {}, 2);
    } catch (e) {
      return await this.fetchData('faction', 'crimes,members', {}, 1);
    }
  }

  async getItemPrices(): Promise<Record<number, number>> {
    const cacheKey = 'v300_global_item_prices';
    const cached = cache.get(cacheKey);
    if (cached) return cached as Record<number, number>;

    try {
      const response = await axios.get(`${this.baseV1}/torn/`, {
        params: { selections: 'items', key: this.apiKey },
      });

      const items = response.data.items || {};
      const prices: Record<number, number> = {};

      Object.entries(items).forEach(([id, item]: [string, any]) => {
          if (item.market_value) {
              prices[Number(id)] = item.market_value;
          }
      });

      cache.set(cacheKey, prices, 3600);
      return prices;
    } catch (error) {
      console.error('Failed to fetch item prices:', error);
      return {};
    }
  }

  private async fetchData(part: string, selections: string, extraParams: any = {}, version: 1 | 2 = 1): Promise<any> {
    const cacheKey = `v300_${version}_${part}_${selections}_${JSON.stringify(extraParams)}`;
    const cachedData = cache.get(cacheKey + this.apiKey);

    if (cachedData) {
      return cachedData;
    }

    try {
      let response;
      if (version === 2) {
        response = await axios.get(`${this.baseV2}/${part}/${selections}`, {
          params: { key: this.apiKey, ...extraParams },
        });
      } else {
        response = await axios.get(`${this.baseV1}/${part}/`, {
          params: { selections, key: this.apiKey, ...extraParams },
        });
      }

      if (response.data.error) {
        throw new Error(response.data.error.error || 'Unknown API error');
      }

      cache.set(cacheKey + this.apiKey, response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.error);
      }
      if (error.message.includes('Incorrect key')) {
          throw new Error('Incorrect key');
      }
      throw error;
    }
  }
}
