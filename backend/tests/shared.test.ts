import { APP_NAME } from '@shared/constants';

describe('Shared Constants', () => {
  it('should have the correct app name', () => {
    expect(APP_NAME).toBe('TornVault');
  });
});
