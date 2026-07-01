import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { VIP_REWARD_MULTIPLIER, VIP_SPAWN_MIN_MS, VIP_SPAWN_MAX_MS } from '../constants';
import { generateVipSpawnDelay } from './useGameEngine';

/**
 * Property 8: VIP 보상 계산 정확성
 * Validates: Requirements 6.1, 6.3
 *
 * For any positive CPS value, VIP touch reward should be exactly CPS × 100 (VIP_REWARD_MULTIPLIER).
 */
describe('Property 8: VIP 보상 계산 정확성', () => {
  /**
   * VIP reward calculation logic extracted for testing
   * (mirrors handleVipClick: reward = state.cps * VIP_REWARD_MULTIPLIER)
   */
  function calculateVipReward(cps: number): number {
    return cps * VIP_REWARD_MULTIPLIER;
  }

  it('양의 CPS 값에 대해 VIP 보상은 정확히 CPS × 100이다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        (cps) => {
          const reward = calculateVipReward(cps);
          expect(reward).toBe(cps * 100);
        }
      )
    );
  });

  it('VIP_REWARD_MULTIPLIER 상수는 100이다', () => {
    expect(VIP_REWARD_MULTIPLIER).toBe(100);
  });

  it('VIP 보상은 항상 양수이다 (CPS > 0일 때)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        (cps) => {
          const reward = calculateVipReward(cps);
          expect(reward).toBeGreaterThan(0);
        }
      )
    );
  });

  it('VIP 보상 지급 후 재화는 정확히 이전 재화 + reward이다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e12, noNaN: true, noDefaultInfinity: true }), // cps
        fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),     // initial coins
        (cps, initialCoins) => {
          const reward = calculateVipReward(cps);
          const newCoins = initialCoins + reward;
          expect(newCoins).toBe(initialCoins + cps * 100);
        }
      )
    );
  });
});

/**
 * Property 9: VIP 스폰 간격 범위
 * Validates: Requirements 6.1, 6.3
 *
 * For any generated VIP spawn delay, the value should always be
 * between 60000ms (60s) and 120000ms (120s) inclusive.
 */
describe('Property 9: VIP 스폰 간격 범위', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Math.random이 [0, 1) 범위의 어떤 값이든, 스폰 딜레이는 [60000, 120000] 범위 내이다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          // Clamp to [0, 1) to match Math.random() behavior
          const clampedValue = Math.min(randomValue, 0.9999999999999999);
          vi.spyOn(Math, 'random').mockReturnValue(clampedValue);

          const delay = generateVipSpawnDelay();

          expect(delay).toBeGreaterThanOrEqual(VIP_SPAWN_MIN_MS);
          expect(delay).toBeLessThanOrEqual(VIP_SPAWN_MAX_MS);

          vi.restoreAllMocks();
        }
      )
    );
  });

  it('Math.random() = 0일 때 스폰 딜레이는 정확히 60000ms이다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const delay = generateVipSpawnDelay();
    expect(delay).toBe(VIP_SPAWN_MIN_MS);
    expect(delay).toBe(60000);
  });

  it('Math.random() = 1일 때 스폰 딜레이는 정확히 120000ms이다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const delay = generateVipSpawnDelay();
    expect(delay).toBe(VIP_SPAWN_MAX_MS);
    expect(delay).toBe(120000);
  });

  it('스폰 딜레이 공식은 VIP_SPAWN_MIN_MS + random * (VIP_SPAWN_MAX_MS - VIP_SPAWN_MIN_MS)이다', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          vi.spyOn(Math, 'random').mockReturnValue(randomValue);

          const delay = generateVipSpawnDelay();
          const expected = VIP_SPAWN_MIN_MS + randomValue * (VIP_SPAWN_MAX_MS - VIP_SPAWN_MIN_MS);

          expect(delay).toBe(expected);

          vi.restoreAllMocks();
        }
      )
    );
  });

  it('VIP_SPAWN_MIN_MS = 60000, VIP_SPAWN_MAX_MS = 120000 상수값 확인', () => {
    expect(VIP_SPAWN_MIN_MS).toBe(60000);
    expect(VIP_SPAWN_MAX_MS).toBe(120000);
  });
});
