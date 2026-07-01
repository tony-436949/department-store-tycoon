import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { saveGameState, loadGameState } from './persistence';
import { STORAGE_KEY, FACILITIES, INITIAL_TOUCH_POWER } from '../constants';
import { applyBuffMultipliers } from '../utils';
import type { GameState, FacilityOwnership, BuffOwnership } from '../types';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

/**
 * Property 11: 게임 상태 저장/복원 라운드트립
 * Validates: Requirements 10.1, 10.3
 *
 * For any 유효한 GameState에 대해, saveGameState 후 loadGameState를 호출하면
 * 원래 상태와 동일한 게임 상태가 복원되어야 한다.
 */
describe('Property 11: 게임 상태 저장/복원 라운드트립', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // Arbitrary generators for GameState fields
  const facilitiesArb: fc.Arbitrary<FacilityOwnership> = fc.record({
    'popup-store': fc.nat({ max: 100 }),
    'gift-desk': fc.nat({ max: 100 }),
    'parking-shuttle': fc.nat({ max: 100 }),
  }) as fc.Arbitrary<FacilityOwnership>;

  const buffsArb: fc.Arbitrary<BuffOwnership> = fc.record({
    marketing: fc.boolean(),
    flyer: fc.boolean(),
    'autonomous-shuttle': fc.boolean(),
    'l-cloud': fc.boolean(),
  }) as fc.Arbitrary<BuffOwnership>;

  const gameStateArb: fc.Arbitrary<GameState> = fc.record({
    coins: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
    totalEarned: fc.double({ min: 0, max: 1e12, noNaN: true, noDefaultInfinity: true }),
    touchCount: fc.nat({ max: 1_000_000 }),
    evolutionStage: fc.integer({ min: 1, max: 9 }),
    elapsedTime: fc.double({ min: 0, max: 100_000, noNaN: true, noDefaultInfinity: true }),
    facilities: facilitiesArb,
    buffs: buffsArb,
  }).map((partial) => {
    // Calculate derived fields based on facilities and buffs
    const baseCPS = (['popup-store', 'gift-desk', 'parking-shuttle'] as const).reduce(
      (sum, id) => sum + FACILITIES[id].cpsIncrease * partial.facilities[id],
      0
    );
    const baseTouchPower = INITIAL_TOUCH_POWER;
    const { touchPower, cps } = applyBuffMultipliers(baseTouchPower, baseCPS, partial.buffs);

    return {
      coins: partial.coins,
      totalEarned: partial.totalEarned,
      cps,
      touchPower,
      baseTouchPower,
      touchCount: partial.touchCount,
      evolutionStage: partial.evolutionStage,
      elapsedTime: partial.elapsedTime,
      facilities: partial.facilities,
      buffs: partial.buffs,
      isGameOver: partial.evolutionStage >= 9,
    } as GameState;
  });

  it('save → load 후 coins가 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.coins).toBe(state.coins);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 totalEarned가 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.totalEarned).toBe(state.totalEarned);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 touchCount가 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.touchCount).toBe(state.touchCount);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 evolutionStage가 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.evolutionStage).toBe(state.evolutionStage);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 elapsedTime이 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.elapsedTime).toBe(state.elapsedTime);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 facilities가 정확히 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.facilities).toEqual(state.facilities);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 buffs가 정확히 일치한다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.buffs).toEqual(state.buffs);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 cps와 touchPower가 applyBuffMultipliers에 의해 올바르게 재계산된다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();

        // Recalculate expected CPS from facilities + buffs
        const baseCPS = (['popup-store', 'gift-desk', 'parking-shuttle'] as const).reduce(
          (sum, id) => sum + FACILITIES[id].cpsIncrease * state.facilities[id],
          0
        );
        const { touchPower, cps } = applyBuffMultipliers(INITIAL_TOUCH_POWER, baseCPS, state.buffs);

        expect(loaded!.cps).toBe(cps);
        expect(loaded!.touchPower).toBe(touchPower);
      }),
      { numRuns: 200 }
    );
  });

  it('save → load 후 isGameOver는 evolutionStage >= 9일 때만 true이다', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        localStorageMock.clear();
        saveGameState(state);
        const loaded = loadGameState();
        expect(loaded).not.toBeNull();
        expect(loaded!.isGameOver).toBe(state.evolutionStage >= 9);
      }),
      { numRuns: 200 }
    );
  });
});
