export interface User {
  id: number;
  name: string;
  role: 'Leader' | 'Co-Leader' | 'Member';
  apiKey?: string;
}

export interface Faction {
  id: number;
  name: string;
  respect: number;
  memberCount: number;
}
