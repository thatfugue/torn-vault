import { calculatePayouts } from '../src/utils/payoutCalculator';

describe('Payout Calculator', () => {
  it('should calculate payouts proportionally based on respect gain (Budget Mode)', () => {
    const attacks = {
      "1": { attacker_id: 101, respect_gain: 10, result: 'Attacked' },
      "2": { attacker_id: 101, respect_gain: 20, result: 'Attacked' },
      "3": { attacker_id: 102, respect_gain: 10, result: 'Attacked' },
      "4": { attacker_id: 103, respect_gain: 0, result: 'Lost' },
    };
    const params = { totalBudget: 1000 };
    const names = { 101: 'Alice', 102: 'Bob', 103: 'ID: 103' };

    const payouts = calculatePayouts(attacks, params, names);

    expect(payouts).toContainEqual({ playerId: 101, playerName: 'Alice', respect: 30, hits: 2, payout: 750, share: 75 });
    expect(payouts).toContainEqual({ playerId: 102, playerName: 'Bob', respect: 10, hits: 1, payout: 250, share: 25 });
    expect(payouts).toContainEqual({ playerId: 103, playerName: 'ID: 103', respect: 0, hits: 1, payout: 0, share: 0 });
    expect(payouts.length).toBe(3);
  });

  it('should calculate payouts based on unit prices (Unit Mode)', () => {
    const attacks = {
      "1": { attacker_id: 101, respect_gain: 10, result: 'Attacked' },
      "2": { attacker_id: 101, respect_gain: 20, result: 'Attacked' },
      "3": { attacker_id: 102, respect_gain: 10, result: 'Attacked' },
    };
    const params = { pricePerRespect: 1000, pricePerHit: 500 };
    const names = { 101: 'ID: 101', 102: 'ID: 102' };
    const payouts = calculatePayouts(attacks, params, names);

    expect(payouts).toContainEqual({ playerId: 101, playerName: 'ID: 101', respect: 30, hits: 2, payout: 31000, share: 74.7 });
    expect(payouts).toContainEqual({ playerId: 102, playerName: 'ID: 102', respect: 10, hits: 1, payout: 10500, share: 25.3 });
  });

  it('should return empty array for no attacks', () => {
    expect(calculatePayouts({}, {})).toEqual([]);
  });

  it('should handle zero total respect in budget mode', () => {
    const attacks = {
        "1": { attacker_id: 101, respect_gain: 0, result: 'Attacked' },
    };
    const names = { 101: 'ID: 101' };
    expect(calculatePayouts(attacks, { totalBudget: 1000 }, names)).toEqual([{
        playerId: 101,
        playerName: 'ID: 101',
        respect: 0,
        hits: 1,
        payout: 0,
        share: 0
    }]);
  });
});
