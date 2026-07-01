// ─── Marketing (시설→마케팅) Types ─────────────────────────────────

export type FacilityId =
  | 'popup-event'
  | 'coffee-coupon'
  | 'discount-voucher'
  | 'bargain-sale'
  | 'vip-marketing'
  | 'sns-ad'
  | 'tv-ad'
  | 'prize-event'
  | 'celeb-collab';

export interface FacilityConfig {
  id: FacilityId;
  name: string;
  baseCost: number;
  cpsIncrease: number;
  inflationRate: number; // 1.05 ~ 1.08
}

export type FacilityOwnership = {
  [key in FacilityId]: number; // 보유 수량
};

// ─── Buff (대규모 투자 프로젝트) Types ────────────────────────────

export type BuffId =
  | 'capital-increase'
  | 'talent-recruit'
  | 'pb-brand'
  | 'branch-expand'
  | 'it-upgrade'
  | 'logistics-center'
  | 'global-entry'
  | 'smart-store'
  | 'eco-invest';

export interface BuffConfig {
  id: BuffId;
  name: string;
  cost: number;
  multiplierType: 'touch' | 'cps' | 'all' | 'infinite';
  multiplier: number;
}

export type BuffOwnership = {
  [key in BuffId]: boolean; // 구매 여부
};

// ─── Evolution Types ─────────────────────────────────────────────

export type EvolutionEffectType =
  | 'dust-cloud'
  | 'neon-sign'
  | 'lens-flare'
  | 'zoom-out'
  | 'marble-wipe'
  | 'panorama'
  | 'gold-particle'
  | 'firework-hologram';

export interface EvolutionStage {
  stage: number;
  name: string;
  threshold: number;
  effect: EvolutionEffectType | null;
}

// ─── Game State ──────────────────────────────────────────────────

export interface GameState {
  coins: number;
  totalEarned: number;
  cps: number;
  touchPower: number;
  baseTouchPower: number;
  touchCount: number;
  evolutionStage: number; // 1~9
  elapsedTime: number; // seconds
  facilities: FacilityOwnership;
  buffs: BuffOwnership;
  isGameOver: boolean;
}

// ─── Touch Effect ────────────────────────────────────────────────

export interface TouchEffect {
  id: string;
  x: number;
  y: number;
  amount: number;
}

// ─── VIP Event ───────────────────────────────────────────────────

export interface VIPState {
  isActive: boolean;
  position: { x: number; y: number };
  spawnTime: number;
  nextSpawnDelay: number;
}
