import api from '../src/lib/api';

describe('API Client', () => {
  it('should be configured with credentials to send cookies', () => {

    expect(api.defaults.withCredentials).toBe(true);
  });

  it('should have the correct base URL', () => {

      expect(api.defaults.baseURL).toBeDefined();
  });
});
