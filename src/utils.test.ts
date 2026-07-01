import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatKoreanNumber, formatTime, calculateFacilityCost, applyBuffMultipliers } from './utils';
import { FACILITIES } from './constants';
import type { BuffOwnership, FacilityConfig } from './types';

/**
 * Property 10: 한국어 숫자 포맷팅 일관성
 * Validates: Requirements 9.1, 9.2, 9.3
 *
 * For any non-negative integer:
 * - If value < 10,000: result ends with "원" and does NOT contain "만" or "억"
 * - If 10,000 ≤ value < 100,000,000: result ends with "만원"
 * - If value ≥ 100,000,000: result ends with "억원"
 */
describe('Property 10: 한국어 숫자 포맷팅 일관성', () => {
  it('value < 10,000이면 "원"으로 끝나고 "만" 또는 "억"을 포함하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9_999 }),
        (value) => {
          const result = formatKoreanNumber(value);
          expect(result).toMatch(/원$/);
          expect(result).not.toMatch(/만/);
          expect(result).not.toMatch(/억/);
        }
      )
    );
  });

  it('10,000 ≤ value < 100,000,000이면 "만원"으로 끝난다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10_000, max: 99_999_999 }),
        (value) => {
          const result = formatKoreanNumber(value);
          expect(result).toMatch(/만원$/);
        }
      )
    );
  });

  it('value ≥ 100,000,000이면 "억원"으로 끝난다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100_000_000, max: 10_000_000_000 }),
        (value) => {
          const result = formatKoreanNumber(value);
          expect(result).toMatch(/억원$/);
        }
      )
    );
  });
});

/**
 * Property 12: 타이머 포맷팅 정확성
 * Validates: Requirements 7.1
 *
 * For any non-negative integer seconds:
 * - formatTime(seconds) matches pattern /^\d{2,}:\d{2}$/
 * - MM = floor(seconds/60) zero-padded to 2 digits
 * - SS = seconds % 60 zero-padded to 2 digits
 */
describe('Property 12: 타이머 포맷팅 정확성', () => {
  it('formatTime은 항상 MM:SS 패턴을 반환한다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_999 }), // 최대 99:59
        (seconds) => {
          const result = formatTime(seconds);
          expect(result).toMatch(/^\d{2,}:\d{2}$/);
        }
      )
    );
  });

  it('MM은 floor(seconds/60)을 2자리로 zero-pad한 값이다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_999 }),
        (seconds) => {
          const result = formatTime(seconds);
          const [mm] = result.split(':');
          const expectedMM = Math.floor(seconds / 60).toString().padStart(2, '0');
          expect(mm).toBe(expectedMM);
        }
      )
    );
  });

  it('SS는 seconds % 60을 2자리로 zero-pad한 값이다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_999 }),
        (seconds) => {
          const result = formatTime(seconds);
          const [, ss] = result.split(':');
          const expectedSS = (seconds % 60).toString().padStart(2, '0');
          expect(ss).toBe(expectedSS);
        }
      )
    );
  });
});

/**
 * Property 4: 시설 비용 계산 정확성
 * Validates: Requirements 13.1, 13.2
 *
 * For any facility config (from FACILITIES) and owned count 0-100:
 * - calculateFacilityCost result is always a positive integer (Number.isInteger)
 * - Result = floor(baseCost * inflationRate^owned)
 * - Result is monotonically increasing with owned
 */
describe('Property 4: 시설 비용 계산 정확성', () => {
  const facilityConfigs = Object.values(FACILITIES);
  const facilityArb = fc.constantFrom(...facilityConfigs);

  it('결과는 항상 양의 정수이다', () => {
    fc.assert(
      fc.property(
        facilityArb,
        fc.integer({ min: 0, max: 100 }),
        (config: FacilityConfig, owned: number) => {
          const cost = calculateFacilityCost(config, owned);
          expect(cost).toBeGreaterThan(0);
          expect(Number.isInteger(cost)).toBe(true);
        }
      )
    );
  });

  it('결과는 floor(baseCost * inflationRate^owned)와 같다', () => {
    fc.assert(
      fc.property(
        facilityArb,
        fc.integer({ min: 0, max: 100 }),
        (config: FacilityConfig, owned: number) => {
          const cost = calculateFacilityCost(config, owned);
          const expected = Math.floor(config.baseCost * Math.pow(config.inflationRate, owned));
          expect(cost).toBe(expected);
        }
      )
    );
  });

  it('owned가 증가하면 비용도 단조 증가한다', () => {
    fc.assert(
      fc.property(
        facilityArb,
        fc.integer({ min: 0, max: 99 }),
        (config: FacilityConfig, owned: number) => {
          const cost1 = calculateFacilityCost(config, owned);
          const cost2 = calculateFacilityCost(config, owned + 1);
          expect(cost2).toBeGreaterThanOrEqual(cost1);
        }
      )
    );
  });
});

/**
 * Property 6: 버프 배수 적용 정확성
 * Validates: Requirements 4.2
 *
 * For any buff combination:
 * - If marketing=true: touchPower is at least 2× baseTouchPower
 * - If flyer=true: cps is at least 3× baseCPS
 * - If autonomous-shuttle=true: both are at least 10× base values (combined with other multipliers)
 * - touchPower and cps are never negative
 */
describe('Property 6: 버프 배수 적용 정확성', () => {
  const buffOwnershipArb = fc.record({
    marketing: fc.boolean(),
    flyer: fc.boolean(),
    'autonomous-shuttle': fc.boolean(),
    'l-cloud': fc.boolean(),
  }) as fc.Arbitrary<BuffOwnership>;

  const basePowerArb = fc.integer({ min: 1, max: 1000 });

  it('marketing=true이면 touchPower는 baseTouchPower의 최소 2배이다', () => {
    fc.assert(
      fc.property(
        basePowerArb,
        basePowerArb,
        buffOwnershipArb.filter((b) => b.marketing),
        (baseTouchPower, baseCPS, buffs) => {
          const result = applyBuffMultipliers(baseTouchPower, baseCPS, buffs);
          expect(result.touchPower).toBeGreaterThanOrEqual(baseTouchPower * 2);
        }
      )
    );
  });

  it('flyer=true이면 cps는 baseCPS의 최소 3배이다', () => {
    fc.assert(
      fc.property(
        basePowerArb,
        basePowerArb,
        buffOwnershipArb.filter((b) => b.flyer),
        (baseTouchPower, baseCPS, buffs) => {
          const result = applyBuffMultipliers(baseTouchPower, baseCPS, buffs);
          expect(result.cps).toBeGreaterThanOrEqual(baseCPS * 3);
        }
      )
    );
  });

  it('autonomous-shuttle=true이면 touchPower와 cps 모두 base의 최소 10배이다', () => {
    fc.assert(
      fc.property(
        basePowerArb,
        basePowerArb,
        buffOwnershipArb.filter((b) => b['autonomous-shuttle']),
        (baseTouchPower, baseCPS, buffs) => {
          const result = applyBuffMultipliers(baseTouchPower, baseCPS, buffs);
          expect(result.touchPower).toBeGreaterThanOrEqual(baseTouchPower * 10);
          expect(result.cps).toBeGreaterThanOrEqual(baseCPS * 10);
        }
      )
    );
  });

  it('touchPower와 cps는 절대 음수가 되지 않는다', () => {
    fc.assert(
      fc.property(
        basePowerArb,
        basePowerArb,
        buffOwnershipArb,
        (baseTouchPower, baseCPS, buffs) => {
          const result = applyBuffMultipliers(baseTouchPower, baseCPS, buffs);
          expect(result.touchPower).toBeGreaterThanOrEqual(0);
          expect(result.cps).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });
});
