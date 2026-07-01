import type { GameState, FacilityId, BuffId, FacilityOwnership, BuffOwnership } from '../types';
import { STORAGE_KEY, FACILITIES, INITIAL_TOUCH_POWER } from '../constants';
import { applyBuffMultipliers } from '../utils';

interface SaveData {
  version: number;
  timestamp: number;
  state: {
    coins: number;
    totalEarned: number;
    touchCount: number;
    evolutionStage: number;
    elapsedTime: number;
    facilities: Record<FacilityId, number>;
    buffs: Record<BuffId, boolean>;
  };
}

const SAVE_VERSION = 2; // 버전 올림 (구조 변경)

const FACILITY_IDS: FacilityId[] = [
  'popup-event', 'coffee-coupon', 'discount-voucher', 'bargain-sale',
  'vip-marketing', 'sns-ad', 'tv-ad', 'prize-event', 'celeb-collab',
];

const BUFF_IDS: BuffId[] = [
  'capital-increase', 'talent-recruit', 'pb-brand', 'branch-expand',
  'it-upgrade', 'logistics-center', 'global-entry', 'smart-store', 'eco-invest',
];

export function saveGameState(state: GameState): void {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: {
        coins: state.coins,
        totalEarned: state.totalEarned,
        touchCount: state.touchCount,
        evolutionStage: state.evolutionStage,
        elapsedTime: state.elapsedTime,
        facilities: { ...state.facilities },
        buffs: { ...state.buffs },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.warn('[Persistence] 게임 저장 실패:', e);
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saveData: SaveData = JSON.parse(raw);
    if (saveData.version !== SAVE_VERSION) return null;

    const { state } = saveData;
    if (
      state == null ||
      typeof state.coins !== 'number' ||
      typeof state.totalEarned !== 'number' ||
      typeof state.touchCount !== 'number' ||
      typeof state.evolutionStage !== 'number' ||
      typeof state.elapsedTime !== 'number' ||
      state.facilities == null ||
      state.buffs == null
    ) {
      return null;
    }

    // 시설 데이터 검증
    for (const id of FACILITY_IDS) {
      if (typeof state.facilities[id] !== 'number') return null;
    }

    // 버프 데이터 검증
    for (const id of BUFF_IDS) {
      if (typeof state.buffs[id] !== 'boolean') return null;
    }

    // CPS 재계산
    const baseCPS = FACILITY_IDS.reduce(
      (sum, id) => sum + FACILITIES[id].cpsIncrease * state.facilities[id],
      0
    );

    const baseTouchPower = INITIAL_TOUCH_POWER;
    const { touchPower, cps } = applyBuffMultipliers(baseTouchPower, baseCPS, state.buffs as BuffOwnership);

    return {
      coins: state.coins,
      totalEarned: state.totalEarned,
      cps,
      touchPower,
      baseTouchPower,
      touchCount: state.touchCount,
      evolutionStage: state.evolutionStage,
      elapsedTime: state.elapsedTime,
      facilities: state.facilities as FacilityOwnership,
      buffs: state.buffs as BuffOwnership,
      isGameOver: state.evolutionStage >= 9,
    };
  } catch (e) {
    console.warn('[Persistence] 게임 로드 실패:', e);
    return null;
  }
}

export function getInitialGameState(): GameState {
  return {
    coins: 0,
    totalEarned: 0,
    cps: 0,
    touchPower: 1,
    baseTouchPower: 1,
    touchCount: 0,
    evolutionStage: 1,
    elapsedTime: 0,
    facilities: {
      'popup-event': 0,
      'coffee-coupon': 0,
      'discount-voucher': 0,
      'bargain-sale': 0,
      'vip-marketing': 0,
      'sns-ad': 0,
      'tv-ad': 0,
      'prize-event': 0,
      'celeb-collab': 0,
    },
    buffs: {
      'capital-increase': false,
      'talent-recruit': false,
      'pb-brand': false,
      'branch-expand': false,
      'it-upgrade': false,
      'logistics-center': false,
      'global-entry': false,
      'smart-store': false,
      'eco-invest': false,
    },
    isGameOver: false,
  };
}
