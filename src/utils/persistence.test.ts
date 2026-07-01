import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGameState, loadGameState, getInitialGameState } from './persistence';
import { STORAGE_KEY } from '../constants';
import type { GameState } from '../types';

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

function createTestState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...getInitialGameState(),
    ...overrides,
  };
}

describe('Persistence_Manager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getInitialGameState', () => {
    it('기본 초기 상태를 반환한다', () => {
      const state = getInitialGameState();
      expect(state.coins).toBe(0);
      expect(state.totalEarned).toBe(0);
      expect(state.cps).toBe(0);
      expect(state.touchPower).toBe(1);
      expect(state.baseTouchPower).toBe(1);
      expect(state.touchCount).toBe(0);
      expect(state.evolutionStage).toBe(1);
      expect(state.elapsedTime).toBe(0);
      expect(state.facilities['popup-store']).toBe(0);
      expect(state.facilities['gift-desk']).toBe(0);
      expect(state.facilities['parking-shuttle']).toBe(0);
      expect(state.buffs.marketing).toBe(false);
      expect(state.buffs.flyer).toBe(false);
      expect(state.buffs['autonomous-shuttle']).toBe(false);
      expect(state.buffs['l-cloud']).toBe(false);
      expect(state.isGameOver).toBe(false);
    });
  });

  describe('saveGameState', () => {
    it('GameState를 localStorage에 JSON으로 저장한다', () => {
      const state = createTestState({ coins: 500, totalEarned: 1000, touchCount: 50 });
      saveGameState(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String)
      );

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.version).toBe(1);
      expect(saved.timestamp).toBeGreaterThan(0);
      expect(saved.state.coins).toBe(500);
      expect(saved.state.totalEarned).toBe(1000);
      expect(saved.state.touchCount).toBe(50);
    });

    it('시설 및 버프 상태를 올바르게 직렬화한다', () => {
      const state = createTestState({
        facilities: { 'popup-store': 3, 'gift-desk': 1, 'parking-shuttle': 0 },
        buffs: { marketing: true, flyer: false, 'autonomous-shuttle': false, 'l-cloud': false },
      });
      saveGameState(state);

      const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(saved.state.facilities['popup-store']).toBe(3);
      expect(saved.state.facilities['gift-desk']).toBe(1);
      expect(saved.state.buffs.marketing).toBe(true);
      expect(saved.state.buffs.flyer).toBe(false);
    });

    it('localStorage 저장 실패 시 에러를 던지지 않는다', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const state = createTestState();

      expect(() => saveGameState(state)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadGameState', () => {
    it('저장된 상태를 올바르게 복원한다', () => {
      const state = createTestState({
        coins: 1500,
        totalEarned: 3000,
        touchCount: 100,
        evolutionStage: 3,
        elapsedTime: 120,
        facilities: { 'popup-store': 5, 'gift-desk': 2, 'parking-shuttle': 1 },
        buffs: { marketing: true, flyer: true, 'autonomous-shuttle': false, 'l-cloud': false },
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded).not.toBeNull();
      expect(loaded!.coins).toBe(1500);
      expect(loaded!.totalEarned).toBe(3000);
      expect(loaded!.touchCount).toBe(100);
      expect(loaded!.evolutionStage).toBe(3);
      expect(loaded!.elapsedTime).toBe(120);
      expect(loaded!.facilities['popup-store']).toBe(5);
      expect(loaded!.buffs.marketing).toBe(true);
    });

    it('CPS와 touchPower를 시설/버프 기반으로 재계산한다', () => {
      const state = createTestState({
        coins: 5000,
        facilities: { 'popup-store': 5, 'gift-desk': 2, 'parking-shuttle': 1 },
        buffs: { marketing: true, flyer: true, 'autonomous-shuttle': false, 'l-cloud': false },
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded).not.toBeNull();
      // baseCPS = 5*1 + 2*5 + 1*25 = 40
      // flyer: CPS ×3 → 120
      expect(loaded!.cps).toBe(120);
      // marketing: touch ×2 → 2
      expect(loaded!.touchPower).toBe(2);
    });

    it('데이터가 없으면 null을 반환한다', () => {
      const loaded = loadGameState();
      expect(loaded).toBeNull();
    });

    it('파싱 실패 시 null을 반환한다', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json{{{');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const loaded = loadGameState();
      expect(loaded).toBeNull();
      consoleSpy.mockRestore();
    });

    it('버전 불일치 시 null을 반환한다', () => {
      const badData = JSON.stringify({
        version: 999,
        timestamp: Date.now(),
        state: { coins: 100 },
      });
      localStorageMock.getItem.mockReturnValueOnce(badData);

      const loaded = loadGameState();
      expect(loaded).toBeNull();
    });

    it('필수 필드 누락 시 null을 반환한다', () => {
      const badData = JSON.stringify({
        version: 1,
        timestamp: Date.now(),
        state: { coins: 100 }, // 나머지 필드 누락
      });
      localStorageMock.getItem.mockReturnValueOnce(badData);

      const loaded = loadGameState();
      expect(loaded).toBeNull();
    });

    it('9단계 저장 시 isGameOver가 true로 복원된다', () => {
      const state = createTestState({
        evolutionStage: 9,
        isGameOver: true,
      });
      saveGameState(state);

      const loaded = loadGameState();
      expect(loaded).not.toBeNull();
      expect(loaded!.evolutionStage).toBe(9);
      expect(loaded!.isGameOver).toBe(true);
    });
  });

  describe('라운드트립 (save → load)', () => {
    it('저장 후 로드하면 원본 상태와 일치한다', () => {
      const original = createTestState({
        coins: 99999,
        totalEarned: 200000,
        touchCount: 500,
        evolutionStage: 5,
        elapsedTime: 300,
        facilities: { 'popup-store': 10, 'gift-desk': 5, 'parking-shuttle': 2 },
        buffs: { marketing: true, flyer: true, 'autonomous-shuttle': true, 'l-cloud': false },
      });

      saveGameState(original);
      const loaded = loadGameState();

      expect(loaded).not.toBeNull();
      expect(loaded!.coins).toBe(original.coins);
      expect(loaded!.totalEarned).toBe(original.totalEarned);
      expect(loaded!.touchCount).toBe(original.touchCount);
      expect(loaded!.evolutionStage).toBe(original.evolutionStage);
      expect(loaded!.elapsedTime).toBe(original.elapsedTime);
      expect(loaded!.facilities).toEqual(original.facilities);
      expect(loaded!.buffs).toEqual(original.buffs);
    });
  });
});
