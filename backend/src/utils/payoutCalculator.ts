export interface PayoutParams {
  totalBudget?: number | undefined;
  pricePerRespect?: number | undefined;
  pricePerHit?: number | undefined;
}

export function calculatePayouts(attacks: any, params: PayoutParams, memberNames: Record<number, string> = {}): any[] {
  const playerStats: Record<number, { respect: number; hits: number; name: string }> = {};
  let totalRespect = 0;

  const validMemberIds = Object.keys(memberNames).map(Number);

  Object.values(attacks || {}).forEach((attack: any) => {

    const attackerId = Number(attack.attacker_id || attack.attackerId || attack.attacker?.id || attack.attacker_id);
    const respectGain = Number(attack.respect_gain || attack.respectGain || attack.respect || 0);
    const result = attack.result || attack.outcome || '';

    if (!attackerId || !validMemberIds.includes(attackerId)) return;

    if (!playerStats[attackerId]) {
      playerStats[attackerId] = {
        respect: 0,
        hits: 0,
        name: memberNames[attackerId] || attack.attacker_name || attack.attacker?.name || `ID: ${attackerId}`
      };
    }

    if (attack._isSummary) {
        playerStats[attackerId].respect += respectGain;
        playerStats[attackerId].hits += Number(attack._hits || 0);
        totalRespect += respectGain;
        return;
    }

    const successfulResults = ['Attacked', 'Mugged', 'Hospitalized', 'Arrested', 'Success', 'Victory'];
    if (respectGain > 0 && (successfulResults.includes(result) || result === '')) {
      playerStats[attackerId].respect += respectGain;
      totalRespect += respectGain;
    }

    playerStats[attackerId].hits += 1;
  });

  const { totalBudget, pricePerRespect, pricePerHit } = params;

  const rawResults = Object.entries(playerStats).map(([id, stats]) => {
    const playerId = Number(id);
    let payout = 0;

    if (totalBudget !== undefined && totalBudget > 0) {

      payout = totalRespect > 0 ? (stats.respect / totalRespect) * totalBudget : 0;
    } else {

      if (pricePerRespect) payout += stats.respect * pricePerRespect;
      if (pricePerHit) payout += stats.hits * pricePerHit;
    }

    return {
      playerId,
      playerName: stats.name,
      respect: Number(stats.respect.toFixed(2)),
      hits: stats.hits,
      payout: Math.floor(payout)
    };
  });

  const actualTotalPayout = rawResults.reduce((acc, r) => acc + r.payout, 0);

  return rawResults.map(res => {
    let share = 0;
    if (actualTotalPayout > 0) {
        share = (res.payout / actualTotalPayout) * 100;
    } else if (totalRespect > 0) {

        share = (res.respect / totalRespect) * 100;
    }

    return {
      ...res,
      share: Number(share.toFixed(2))
    };
  }).sort((a, b) => b.payout - a.payout || b.respect - a.respect);
}
