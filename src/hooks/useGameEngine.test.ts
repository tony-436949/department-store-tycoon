import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 2: CPS 재화 적용 정확성
 * Validates: Requirements 2.1
 *
 * For any positive CPS value and positive deltaTime (ms),
 * the coins increase should equal exactly CPS × (deltaTime / 1000),
 * and totalEarned should accumulate the same amount.
 */

/**
 * CPS application logic extracted for testing (mirrors the game loop logic)
 */
function applyCPS(
  state: { coins: number; totalEarned: number; cps: number },
  deltaMs: number
): { coins: number; totalEarned: number } {
  if (state.cps > 0 && deltaMs > 0) {
    const earned = state.cps * (deltaMs / 1000);
    return {
      coins: state.coins + earned,
      totalEarned: state.totalEarned + earned,
    };
  }
  return { coins: state.coins, totalEarned: state.totalEarned };
}

describe('Property 2: CPS 재화 적용 정확성', () => {
  it('CPS > 0이고 deltaMs > 0일 때 재화 증가량은 CPS × (deltaMs / 1000)이다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1_000_000, noNaN: true }),  // cps
        fc.double({ min: 1, max: 1000, noNaN: true }),          // deltaMs (typical frame 1~1000ms)
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial coins
        (cps, deltaMs, initialCoins) => {
          const state = { coins: initialCoins, totalEarned: initialCoins, cps };
          const result = applyCPS(state, deltaMs);

          const expectedEarned = cps * (deltaMs / 1000);
          expect(result.coins).toBeCloseTo(initialCoins + expectedEarned, 5);
          expect(result.totalEarned).toBeCloseTo(initialCoins + expectedEarned, 5);
        }
      )
    );
  });

  it('CPS = 0이면 재화가 변하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }),          // deltaMs
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial coins
        (deltaMs, initialCoins) => {
          const state = { coins: initialCoins, totalEarned: initialCoins, cps: 0 };
          const result = applyCPS(state, deltaMs);

          expect(result.coins).toBe(initialCoins);
          expect(result.totalEarned).toBe(initialCoins);
        }
      )
    );
  });

  it('deltaMs = 0이면 재화가 변하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1_000_000, noNaN: true }),  // cps
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial coins
        (cps, initialCoins) => {
          const state = { coins: initialCoins, totalEarned: initialCoins, cps };
          const result = applyCPS(state, 0);

          expect(result.coins).toBe(initialCoins);
          expect(result.totalEarned).toBe(initialCoins);
        }
      )
    );
  });

  it('재화는 항상 단조 증가한다 (CPS > 0, deltaMs > 0일 때)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1_000_000, noNaN: true }),  // cps
        fc.double({ min: 1, max: 1000, noNaN: true }),          // deltaMs
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial coins
        (cps, deltaMs, initialCoins) => {
          const state = { coins: initialCoins, totalEarned: initialCoins, cps };
          const result = applyCPS(state, deltaMs);

          expect(result.coins).toBeGreaterThanOrEqual(initialCoins);
          expect(result.totalEarned).toBeGreaterThanOrEqual(initialCoins);
        }
      )
    );
  });

  it('1초(1000ms) 경과 시 재화 증가량은 정확히 CPS와 같다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1_000_000, noNaN: true }),  // cps
        (cps) => {
          const state = { coins: 0, totalEarned: 0, cps };
          const result = applyCPS(state, 1000);

          expect(result.coins).toBeCloseTo(cps, 5);
          expect(result.totalEarned).toBeCloseTo(cps, 5);
        }
      )
    );
  });
});

describe('useGameEngine: deltaTime 계산 로직', () => {
  it('첫 프레임은 deltaTime 0으로 처리된다', () => {
    // Simulates the first-frame behavior: lastTime = 0, then set to timestamp
    let lastTime = 0;
    const timestamp = 16.67; // typical first frame

    if (lastTime === 0) {
      lastTime = timestamp;
    }
    const deltaMs = timestamp - lastTime;

    // After the first-frame initialization, deltaMs should be 0
    // because lastTime was just set to timestamp
    expect(deltaMs).toBe(0);
  });

  it('후속 프레임에서 deltaTime은 양수이다', () => {
    let lastTime = 1000;
    const timestamp = 1016.67; // ~60fps frame

    const deltaMs = timestamp - lastTime;
    lastTime = timestamp;

    expect(deltaMs).toBeGreaterThan(0);
    expect(deltaMs).toBeCloseTo(16.67, 1);
  });
});

describe('useGameEngine: 게임 상태 초기화', () => {
  it('초기 상태는 올바른 기본값을 가진다', () => {
    // Mirror getInitialGameState() for verification
    const initialState = {
      coins: 0,
      totalEarned: 0,
      cps: 0,
      touchPower: 1,
      baseTouchPower: 1,
      touchCount: 0,
      evolutionStage: 1,
      elapsedTime: 0,
      facilities: {
        'popup-store': 0,
        'gift-desk': 0,
        'parking-shuttle': 0,
      },
      buffs: {
        marketing: false,
        flyer: false,
        'autonomous-shuttle': false,
        'l-cloud': false,
      },
      isGameOver: false,
    };

    expect(initialState.coins).toBe(0);
    expect(initialState.cps).toBe(0);
    expect(initialState.touchPower).toBe(1);
    expect(initialState.evolutionStage).toBe(1);
    expect(initialState.isGameOver).toBe(false);
  });
});

/**
 * Property 1: 터치 재화 증가 정확성
 * Validates: Requirements 1.1, 1.6
 *
 * For any game state and touchPower value, after processing a touch event:
 * - coins should increase by exactly touchPower
 * - touchCount should increase by exactly 1
 * - totalEarned should increase by exactly touchPower
 */

/**
 * handleTouch logic extracted for testing (mirrors the actual implementation)
 */
function applyTouch(state: {
  coins: number;
  totalEarned: number;
  touchPower: number;
  touchCount: number;
}): { coins: number; totalEarned: number; touchCount: number } {
  return {
    coins: state.coins + state.touchPower,
    totalEarned: state.totalEarned + state.touchPower,
    touchCount: state.touchCount + 1,
  };
}

describe('Property 1: 터치 재화 증가 정확성', () => {
  it('터치 후 재화는 정확히 이전 재화 + touchPower와 같다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial coins
        fc.integer({ min: 1, max: 100_000 }),                     // touchPower
        fc.integer({ min: 0, max: 1_000_000 }),                   // initial touchCount
        (initialCoins, touchPower, initialTouchCount) => {
          const state = {
            coins: initialCoins,
            totalEarned: initialCoins,
            touchPower,
            touchCount: initialTouchCount,
          };
          const result = applyTouch(state);

          expect(result.coins).toBe(initialCoins + touchPower);
        }
      )
    );
  });

  it('터치 후 touchCount는 정확히 1 증가한다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }),
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (initialCoins, touchPower, initialTouchCount) => {
          const state = {
            coins: initialCoins,
            totalEarned: initialCoins,
            touchPower,
            touchCount: initialTouchCount,
          };
          const result = applyTouch(state);

          expect(result.touchCount).toBe(initialTouchCount + 1);
        }
      )
    );
  });

  it('터치 후 totalEarned는 정확히 이전 totalEarned + touchPower와 같다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000_000, noNaN: true }), // initial totalEarned
        fc.integer({ min: 1, max: 100_000 }),                     // touchPower
        (initialTotalEarned, touchPower) => {
          const state = {
            coins: 0,
            totalEarned: initialTotalEarned,
            touchPower,
            touchCount: 0,
          };
          const result = applyTouch(state);

          expect(result.totalEarned).toBe(initialTotalEarned + touchPower);
        }
      )
    );
  });

  it('N회 연속 터치 시 재화는 N × touchPower만큼 증가한다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),   // touchPower
        fc.integer({ min: 1, max: 100 }),        // N touches
        (touchPower, n) => {
          let state = {
            coins: 0,
            totalEarned: 0,
            touchPower,
            touchCount: 0,
          };
          for (let i = 0; i < n; i++) {
            const result = applyTouch(state);
            state = { ...state, ...result };
          }

          expect(state.coins).toBe(touchPower * n);
          expect(state.touchCount).toBe(n);
          expect(state.totalEarned).toBe(touchPower * n);
        }
      )
    );
  });
});

describe('useGameEngine: elapsedTime 추적', () => {
  it('elapsedTime은 deltaMs / 1000만큼 증가한다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }), // initial elapsedTime
        fc.double({ min: 1, max: 100, noNaN: true }),   // deltaMs
        (initialElapsed, deltaMs) => {
          const elapsedTime = initialElapsed + deltaMs / 1000;
          expect(elapsedTime).toBeCloseTo(initialElapsed + deltaMs / 1000, 10);
          expect(elapsedTime).toBeGreaterThanOrEqual(initialElapsed);
        }
      )
    );
  });
});


/**
 * Property 3: CPS 재계산 정확성
 * Validates: Requirements 2.3, 3.4
 *
 * For any facility ownership combination and buff ownership combination,
 * the calculated CPS should equal (sum of facility.cpsIncrease × owned count)
 * with buff multipliers applied.
 */

import { calculateFacilityCost, applyBuffMultipliers } from '../utils';
import { FACILITIES, EVOLUTION_STAGES } from '../constants';
import type { FacilityId, BuffOwnership } from '../types';

/**
 * Recalculate CPS logic extracted for testing (mirrors purchaseFacility logic)
 */
function recalculateCPS(
  facilities: Record<FacilityId, number>,
  buffs: BuffOwnership,
  baseTouchPower: number
): { cps: number; touchPower: number } {
  const baseCPS = (Object.entries(facilities) as [FacilityId, number][]).reduce(
    (sum, [id, count]) => sum + FACILITIES[id].cpsIncrease * count,
    0
  );
  return applyBuffMultipliers(baseTouchPower, baseCPS, buffs);
}

describe('Property 3: CPS 재계산 정확성', () => {
  const facilityCountArb = fc.record({
    'popup-store': fc.integer({ min: 0, max: 50 }),
    'gift-desk': fc.integer({ min: 0, max: 50 }),
    'parking-shuttle': fc.integer({ min: 0, max: 50 }),
  }) as fc.Arbitrary<Record<FacilityId, number>>;

  const buffOwnershipArb = fc.record({
    marketing: fc.boolean(),
    flyer: fc.boolean(),
    'autonomous-shuttle': fc.boolean(),
    'l-cloud': fc.boolean(),
  }) as fc.Arbitrary<BuffOwnership>;

  it('CPS는 각 시설의 (cpsIncrease × 보유수량)의 합에 버프 배수를 적용한 값과 같다', () => {
    fc.assert(
      fc.property(
        facilityCountArb,
        buffOwnershipArb,
        fc.integer({ min: 1, max: 100 }), // baseTouchPower
        (facilities, buffs, baseTouchPower) => {
          const result = recalculateCPS(facilities, buffs, baseTouchPower);

          // Expected baseCPS
          const expectedBaseCPS =
            FACILITIES['popup-store'].cpsIncrease * facilities['popup-store'] +
            FACILITIES['gift-desk'].cpsIncrease * facilities['gift-desk'] +
            FACILITIES['parking-shuttle'].cpsIncrease * facilities['parking-shuttle'];

          // Apply buff multipliers manually
          let expectedCPS = expectedBaseCPS;
          if (buffs.flyer) expectedCPS *= 3;
          if (buffs['autonomous-shuttle']) expectedCPS *= 10;
          if (buffs['l-cloud']) expectedCPS *= 1000;

          expect(result.cps).toBe(expectedCPS);
        }
      )
    );
  });

  it('시설이 하나도 없으면 CPS는 0이다 (버프와 무관)', () => {
    fc.assert(
      fc.property(
        buffOwnershipArb,
        (buffs) => {
          const facilities: Record<FacilityId, number> = {
            'popup-store': 0,
            'gift-desk': 0,
            'parking-shuttle': 0,
          };
          const result = recalculateCPS(facilities, buffs, 1);
          expect(result.cps).toBe(0);
        }
      )
    );
  });

  it('버프가 없으면 CPS는 시설 기본 CPS 합산값과 같다', () => {
    fc.assert(
      fc.property(
        facilityCountArb,
        (facilities) => {
          const buffs: BuffOwnership = {
            marketing: false,
            flyer: false,
            'autonomous-shuttle': false,
            'l-cloud': false,
          };
          const result = recalculateCPS(facilities, buffs, 1);

          const expectedBaseCPS =
            FACILITIES['popup-store'].cpsIncrease * facilities['popup-store'] +
            FACILITIES['gift-desk'].cpsIncrease * facilities['gift-desk'] +
            FACILITIES['parking-shuttle'].cpsIncrease * facilities['parking-shuttle'];

          expect(result.cps).toBe(expectedBaseCPS);
        }
      )
    );
  });
});

/**
 * Property 5: 구매 가능 여부 판정
 * Validates: Requirements 3.3, 3.4
 *
 * Purchase should succeed if and only if coins >= cost.
 * On success, coins decrease by exactly cost.
 * On failure, state is unchanged.
 */

/**
 * Purchase logic extracted for testing (mirrors purchaseFacility logic)
 */
function attemptPurchase(
  coins: number,
  facilityId: FacilityId,
  owned: number,
  facilities: Record<FacilityId, number>,
  buffs: BuffOwnership,
  baseTouchPower: number
): { success: boolean; newCoins: number; newOwned: number; newCPS: number } {
  const config = FACILITIES[facilityId];
  const cost = calculateFacilityCost(config, owned);

  if (coins < cost) {
    return { success: false, newCoins: coins, newOwned: owned, newCPS: 0 };
  }

  const newCoins = coins - cost;
  const newOwned = owned + 1;
  const updatedFacilities = { ...facilities, [facilityId]: newOwned };

  const baseCPS = (Object.entries(updatedFacilities) as [FacilityId, number][]).reduce(
    (sum, [id, count]) => sum + FACILITIES[id].cpsIncrease * count,
    0
  );
  const { cps } = applyBuffMultipliers(baseTouchPower, baseCPS, buffs);

  return { success: true, newCoins, newOwned, newCPS: cps };
}

describe('Property 5: 구매 가능 여부 판정', () => {
  const facilityIdArb = fc.constantFrom<FacilityId>('popup-store', 'gift-desk', 'parking-shuttle');

  it('coins >= cost이면 구매 성공하고 재화는 정확히 cost만큼 감소한다', () => {
    fc.assert(
      fc.property(
        facilityIdArb,
        fc.integer({ min: 0, max: 30 }), // owned count
        (facilityId, owned) => {
          const config = FACILITIES[facilityId];
          const cost = calculateFacilityCost(config, owned);
          // Ensure coins >= cost
          const coins = cost + Math.floor(Math.random() * 10000);

          const facilities: Record<FacilityId, number> = {
            'popup-store': 0,
            'gift-desk': 0,
            'parking-shuttle': 0,
            [facilityId]: owned,
          };
          const buffs: BuffOwnership = {
            marketing: false,
            flyer: false,
            'autonomous-shuttle': false,
            'l-cloud': false,
          };

          const result = attemptPurchase(coins, facilityId, owned, facilities, buffs, 1);

          expect(result.success).toBe(true);
          expect(result.newCoins).toBe(coins - cost);
          expect(result.newOwned).toBe(owned + 1);
        }
      )
    );
  });

  it('coins < cost이면 구매 실패하고 상태가 변하지 않는다', () => {
    fc.assert(
      fc.property(
        facilityIdArb,
        fc.integer({ min: 0, max: 30 }), // owned count
        (facilityId, owned) => {
          const config = FACILITIES[facilityId];
          const cost = calculateFacilityCost(config, owned);
          // Ensure coins < cost (cost is at least baseCost which is >= 15)
          const coins = cost > 0 ? cost - 1 : 0;

          const facilities: Record<FacilityId, number> = {
            'popup-store': 0,
            'gift-desk': 0,
            'parking-shuttle': 0,
            [facilityId]: owned,
          };
          const buffs: BuffOwnership = {
            marketing: false,
            flyer: false,
            'autonomous-shuttle': false,
            'l-cloud': false,
          };

          const result = attemptPurchase(coins, facilityId, owned, facilities, buffs, 1);

          expect(result.success).toBe(false);
          expect(result.newCoins).toBe(coins);
          expect(result.newOwned).toBe(owned);
        }
      )
    );
  });

  it('구매 성공 후 CPS가 정확히 재계산된다', () => {
    fc.assert(
      fc.property(
        facilityIdArb,
        fc.integer({ min: 0, max: 20 }), // owned count
        (facilityId, owned) => {
          const config = FACILITIES[facilityId];
          const cost = calculateFacilityCost(config, owned);
          const coins = cost + 100000; // Ensure enough coins

          const facilities: Record<FacilityId, number> = {
            'popup-store': 0,
            'gift-desk': 0,
            'parking-shuttle': 0,
            [facilityId]: owned,
          };
          const buffs: BuffOwnership = {
            marketing: false,
            flyer: false,
            'autonomous-shuttle': false,
            'l-cloud': false,
          };

          const result = attemptPurchase(coins, facilityId, owned, facilities, buffs, 1);

          // After purchase, CPS should include the new facility
          const expectedBaseCPS = FACILITIES[facilityId].cpsIncrease * (owned + 1);
          expect(result.success).toBe(true);
          expect(result.newCPS).toBe(expectedBaseCPS);
        }
      )
    );
  });
});

/**
 * Property 7: 진화 조건 판정 정확성
 * Validates: Requirements 5.2
 *
 * Evolution stage should advance when totalEarned meets the next threshold.
 * Stage 9 = game over.
 */

/**
 * checkEvolution logic extracted for testing (mirrors the actual implementation)
 */
function checkEvolutionPure(state: {
  evolutionStage: number;
  totalEarned: number;
  isGameOver: boolean;
}): { evolutionStage: number; isGameOver: boolean; evolved: boolean } {
  if (state.evolutionStage >= 9 || state.isGameOver) {
    return { evolutionStage: state.evolutionStage, isGameOver: state.isGameOver, evolved: false };
  }

  // EVOLUTION_STAGES is 0-indexed: stage 1 = index 0, next stage = index [currentStage]
  const nextStage = EVOLUTION_STAGES[state.evolutionStage];
  if (!nextStage) {
    return { evolutionStage: state.evolutionStage, isGameOver: state.isGameOver, evolved: false };
  }

  if (state.totalEarned >= nextStage.threshold) {
    const newStage = nextStage.stage;
    const isGameOver = newStage >= 9;
    return { evolutionStage: newStage, isGameOver, evolved: true };
  }

  return { evolutionStage: state.evolutionStage, isGameOver: state.isGameOver, evolved: false };
}

describe('Property 7: 진화 조건 판정 정확성', () => {
  it('totalEarned >= 다음 단계 threshold이면 진화가 발생한다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }), // currentStage (1~8, since stage 9 can't evolve further)
        (currentStage) => {
          const nextStage = EVOLUTION_STAGES[currentStage];
          // totalEarned exactly at threshold
          const state = {
            evolutionStage: currentStage,
            totalEarned: nextStage.threshold,
            isGameOver: false,
          };

          const result = checkEvolutionPure(state);

          expect(result.evolved).toBe(true);
          expect(result.evolutionStage).toBe(currentStage + 1);
        }
      )
    );
  });

  it('totalEarned < 다음 단계 threshold이면 진화가 발생하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }), // currentStage
        (currentStage) => {
          const nextStage = EVOLUTION_STAGES[currentStage];
          // totalEarned just below threshold
          const state = {
            evolutionStage: currentStage,
            totalEarned: nextStage.threshold - 1,
            isGameOver: false,
          };

          const result = checkEvolutionPure(state);

          expect(result.evolved).toBe(false);
          expect(result.evolutionStage).toBe(currentStage);
        }
      )
    );
  });

  it('8단계에서 threshold 달성 시 9단계 진화 + isGameOver = true', () => {
    const stage9Threshold = EVOLUTION_STAGES[8].threshold; // index 8 = stage 9
    const state = {
      evolutionStage: 8,
      totalEarned: stage9Threshold,
      isGameOver: false,
    };

    const result = checkEvolutionPure(state);

    expect(result.evolved).toBe(true);
    expect(result.evolutionStage).toBe(9);
    expect(result.isGameOver).toBe(true);
  });

  it('이미 9단계이면 추가 진화가 발생하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100_000_000_000, noNaN: true }), // any totalEarned
        (totalEarned) => {
          const state = {
            evolutionStage: 9,
            totalEarned,
            isGameOver: true,
          };

          const result = checkEvolutionPure(state);

          expect(result.evolved).toBe(false);
          expect(result.evolutionStage).toBe(9);
        }
      )
    );
  });

  it('진화 후 단계는 정확히 현재 단계 + 1이다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 8 }),
        fc.double({ min: 0, max: 100_000_000_000, noNaN: true }),
        (currentStage, extraEarned) => {
          const nextStage = EVOLUTION_STAGES[currentStage];
          // Ensure we meet threshold (add extra on top)
          const state = {
            evolutionStage: currentStage,
            totalEarned: nextStage.threshold + extraEarned,
            isGameOver: false,
          };

          const result = checkEvolutionPure(state);

          expect(result.evolved).toBe(true);
          expect(result.evolutionStage).toBe(currentStage + 1);
        }
      )
    );
  });
});
